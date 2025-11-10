import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import { InspectionPoint } from '@/types';
import { isOnline } from '@/services/sync/syncService';
import { VoiceInputSection } from './VoiceInputSection';
import { PhotoCaptureSection } from './PhotoCaptureSection';
import { InspectionHistorySection } from './InspectionHistorySection';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/common/ToastContainer';
import { getInspectionResult } from '@/services/firebase/firestore';

interface InspectionRecordModalProps {
  point: InspectionPoint;
  projectId?: string;
  pointId?: string;
  currentYear?: number;
  eventId?: string;
  onClose: () => void;
  onSave: (data: { status: 'ok' | 'fail'; notes: string; photos: string[] }) => void;
  onDeleteRecord?: (eventId: string, recordIndex: number) => Promise<void>;
}

export const InspectionRecordModal = ({
  point,
  projectId,
  pointId,
  currentYear,
  eventId,
  onClose,
  onSave,
  onDeleteRecord,
}: InspectionRecordModalProps): JSX.Element => {
  const [status, setStatus] = useState<'ok' | 'fail' | null>(null);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [online, setOnline] = useState(isOnline());
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // 最新の点検履歴を自動復元
  useEffect(() => {
    const loadLatestRecord = async (): Promise<void> => {
      if (!projectId || !eventId || !pointId) return;

      try {
        const result = await getInspectionResult(projectId, eventId, pointId);
        if (result && result.records.length > 0) {
          // 最新のレコード（配列の最後の要素）を取得
          const latestRecord = result.records[result.records.length - 1];

          // ステータスを復元（uninspectedは除外）
          const latestStatus = latestRecord.itemResults[0]?.status;
          if (latestStatus && latestStatus !== 'uninspected') {
            setStatus(latestStatus);
          }

          // ノートを復元
          const latestNotes = latestRecord.itemResults
            .filter((item) => item.notes)
            .map((item) => item.notes)
            .join('\n');
          if (latestNotes) {
            setNotes(latestNotes);
          }

          // 写真は復元しない（新しい写真を撮影することを想定）
        }
      } catch (error) {
        console.error('最新履歴の読み込みエラー:', error);
      }
    };

    loadLatestRecord();
  }, [projectId, eventId, pointId]);

  const handleSave = useCallback(async () => {
    if (!status) {
      toast.warning('点検結果を選択してください');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ status, notes, photos });
      toast.success('点検記録を保存しました');
      onClose();
    } catch (error) {
      console.error('保存エラー:', error);
      toast.error('点検記録の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [status, notes, photos, onSave, onClose, toast]);

  const handleTextTranscribed = (text: string) => {
    setNotes((prev) => {
      if (prev) {
        return `${prev}\n${text}`;
      }
      return text;
    });
  };

  // オンライン状態の監視
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter または Cmd+Enter で保存
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      // Escapeで閉じる
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, onClose]);

  const canSave = status !== null;

  return (
    <>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col animate-zoom-in">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">点検記録</h3>
            {/* オンライン状態インジケーター */}
            <div className="flex items-center gap-1.5">
              {online ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">オンライン</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400 font-medium">オフライン</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 touch-manipulation"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ（スクロール可能） */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* 設備情報 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="text-sm text-blue-600 font-medium mb-1">設備名</div>
            <div className="font-semibold text-gray-900 text-lg">{point.name}</div>
            <div className="text-xs text-blue-600 mt-2 inline-block px-2 py-1 bg-white rounded">
              種別: {point.type}
            </div>
          </div>

          {/* 点検結果 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              点検結果 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStatus('ok')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all touch-manipulation ${
                  status === 'ok'
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span>正常</span>
              </button>
              <button
                onClick={() => setStatus('fail')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all touch-manipulation ${
                  status === 'fail'
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <XCircle className="w-5 h-5" />
                <span>異常</span>
              </button>
            </div>
          </div>

          {/* 備考 */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              備考・特記事項
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="気になった点や詳細を記入してください"
            />
          </div>

          {/* 音声入力 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              音声入力
            </label>
            <VoiceInputSection online={online} onTextTranscribed={handleTextTranscribed} />
          </div>

          {/* 写真撮影 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              写真
            </label>
            <PhotoCaptureSection online={online} onPhotosChange={setPhotos} />
          </div>

          {/* 点検履歴 */}
          <InspectionHistorySection
            projectId={projectId}
            pointId={pointId}
            currentYear={currentYear}
            onDeleteRecord={onDeleteRecord}
          />
        </div>

        {/* フッター */}
        <div className="flex items-center gap-3 p-4 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all touch-manipulation ${
              canSave && !isSaving
                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                保存中...
              </span>
            ) : (
              '記録を保存'
            )}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
