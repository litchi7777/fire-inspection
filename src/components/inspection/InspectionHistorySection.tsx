import { History, ChevronDown, ChevronUp, AlertTriangle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { useState, useEffect } from 'react';
import { getPointHistoryAcrossYears, PointHistoryByYear } from '@/services/firebase/firestore';

interface InspectionHistorySectionProps {
  projectId?: string;
  pointId?: string;
  currentYear?: number;
  onDeleteRecord?: (eventId: string, recordIndex: number) => Promise<void>;
}

export const InspectionHistorySection = ({
  projectId,
  pointId,
  currentYear,
  onDeleteRecord,
}: InspectionHistorySectionProps): JSX.Element | null => {
  const [showHistory, setShowHistory] = useState(false);
  const [historicalData, setHistoricalData] = useState<PointHistoryByYear[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async (): Promise<void> => {
      if (!projectId || !pointId) return;

      setLoading(true);
      try {
        const history = await getPointHistoryAcrossYears(projectId, pointId);
        setHistoricalData(history);
      } catch (error) {
        console.error('過去の点検履歴取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId && pointId) {
      fetchHistory();
    }
  }, [projectId, pointId]);

  // 総レコード数を計算
  const totalRecords = historicalData.reduce((sum, hist) => sum + hist.result.records.length, 0);

  return (
    <div className="border-t pt-4">
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4" />
          <span>点検履歴 ({totalRecords}件)</span>
        </div>
        {showHistory ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {showHistory && (
        <div className="mt-3 space-y-4 animate-slide-in-from-top">
          {loading ? (
            <div className="text-center py-4 text-sm text-gray-500">読み込み中...</div>
          ) : (
            historicalData.map((history) => {
              const isSameYear = currentYear === history.year;
              const hasConflict = isSameYear && history.result.records.length > 1;

              // イベントの開始月を取得
              const eventDate = new Date(history.result.records[0].timestamp);
              const yearMonth = format(eventDate, 'yyyy年MM月', { locale: ja });

              return (
                <div key={history.eventId} className="space-y-2">
                  {/* 点検ヘッダー */}
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-blue-600">
                      {yearMonth} 点検
                    </div>
                    {hasConflict && (
                      <div className="flex items-center gap-1 text-xs text-yellow-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span>競合あり</span>
                      </div>
                    )}
                  </div>

                  {/* レコード一覧 */}
                  <div className="space-y-2">
                    {history.result.records.map((record, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border transition-colors relative group ${
                          hasConflict
                            ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* 削除ボタン */}
                        {onDeleteRecord && (
                          <button
                            onClick={async () => {
                              if (window.confirm('この点検記録を削除しますか？')) {
                                await onDeleteRecord(history.eventId, index);
                                // データを再取得
                                if (projectId && pointId) {
                                  const updatedHistory = await getPointHistoryAcrossYears(projectId, pointId);
                                  setHistoricalData(updatedHistory);
                                }
                              }
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all"
                            aria-label="記録を削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="flex items-start justify-between mb-2 pr-8">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">
                              {format(record.timestamp, 'yyyy/MM/dd HH:mm', { locale: ja })}
                            </div>
                            <div className="text-sm font-medium text-gray-700 mt-1">
                              {record.userName}
                            </div>
                          </div>
                          {record.itemResults.map((item, itemIndex) => (
                            <span
                              key={itemIndex}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                item.status === 'ok'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {item.status === 'ok' ? '正常' : '異常'}
                            </span>
                          ))}
                        </div>
                        {record.itemResults.map((item, itemIndex) => (
                          <div key={itemIndex}>
                            {item.notes && (
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        ))}
                        {record.photos && record.photos.length > 0 && (
                          <div className="mt-2 flex gap-2 overflow-x-auto">
                            {record.photos.map((photoUrl, photoIndex) => (
                              <img
                                key={photoIndex}
                                src={photoUrl}
                                alt={`記録写真 ${photoIndex + 1}`}
                                className="h-20 w-20 object-cover rounded border border-gray-300"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
