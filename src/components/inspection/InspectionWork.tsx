import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileImage } from 'lucide-react';
import { useDrawingStore } from '@/stores/useDrawingStore';
import { useInspectionEventStore } from '@/stores/useInspectionEventStore';
import { Header } from '@/components/common/Header';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';

export const InspectionWork = (): JSX.Element => {
  const navigate = useNavigate();
  const { projectId, eventId } = useParams<{
    projectId: string;
    eventId: string;
  }>();
  const { drawings, fetchDrawings } = useDrawingStore();
  const { currentEvent, fetchEvent } = useInspectionEventStore();
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (projectId && eventId) {
      fetchDrawings(projectId);
      fetchEvent(eventId);
    }
  }, [projectId, eventId]);

  const handleBack = (): void => {
    navigate(`/projects/${projectId}/events/${eventId}`);
  };

  const handleDrawingSelect = (drawingId: string): void => {
    setSelectedDrawingId(drawingId);
    // 図面ビューアに遷移（点検モード付き）
    navigate(
      `/projects/${projectId}/events/${eventId}/drawing/${drawingId}/inspect`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="点検作業"
        subtitle={
          currentEvent
            ? `${currentEvent.year}年度 点検 - ${format(new Date(currentEvent.startDate), 'yyyy/MM/dd', { locale: ja })}`
            : undefined
        }
        onBack={handleBack}
        backLabel="点検イベント詳細に戻る"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              点検する図面を選択
            </h2>
            <p className="text-sm text-gray-600">
              図面を選択して設備の点検を行ってください
            </p>
          </div>

          {drawings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center text-gray-500">
                <FileImage className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="mb-4">図面がまだアップロードされていません</p>
                <p className="text-sm">
                  図面管理ページから図面をアップロードしてください
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drawings.map((drawing) => (
                <button
                  key={drawing.id}
                  onClick={() => handleDrawingSelect(drawing.id)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileImage className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {drawing.pdfName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ページ {drawing.pageNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    点検開始 →
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
