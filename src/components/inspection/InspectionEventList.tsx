import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useInspectionEventStore } from '@/stores/useInspectionEventStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { Header } from '@/components/common/Header';

export const InspectionEventList = (): JSX.Element => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, fetchProject } = useProjectStore();
  const { events, fetchEvents } = useInspectionEventStore();

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
      fetchEvents(projectId);
    }
  }, [projectId]);

  const handleBack = (): void => {
    navigate('/projects');
  };

  const handleCreateEvent = (): void => {
    navigate(`/projects/${projectId}/events/new`);
  };

  const handleEventClick = (eventId: string): void => {
    navigate(`/projects/${projectId}/events/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="点検イベント"
        subtitle={currentProject?.customerName}
        onBack={handleBack}
        backLabel="案件一覧に戻る"
        rightContent={
          <button
            onClick={handleCreateEvent}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>点検イベント作成</span>
          </button>
        }
      />

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                点検イベントがありません
              </h3>
              <p className="text-gray-600 mb-6">
                最初の点検イベントを作成してください
              </p>
              <button
                onClick={handleCreateEvent}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span>点検イベント作成</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {format(new Date(event.startDate), 'yyyy年MM月', {
                            locale: ja,
                          })}{' '}
                          点検
                        </h3>
                        <p className="text-sm text-gray-600">
                          開始日: {format(new Date(event.startDate), 'yyyy年MM月dd日', {
                            locale: ja,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.inspectorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.status === 'completed' ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">完了</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span className="text-orange-600">進行中</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-blue-600 font-medium">
                    詳細 →
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
