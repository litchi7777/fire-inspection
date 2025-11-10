import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Users,
  ClipboardCheck,
  FileText,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useInspectionEventStore } from '@/stores/useInspectionEventStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useInspectionPointStore } from '@/stores/useInspectionPointStore';
import { useDrawingStore } from '@/stores/useDrawingStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { getInspectionResults } from '@/services/firebase/firestore';
import { generateWordReport } from '@/services/word/wordReportGenerator';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { Header } from '@/components/common/Header';

export const InspectionEventDetail = (): JSX.Element => {
  const navigate = useNavigate();
  const { projectId, eventId } = useParams<{
    projectId: string;
    eventId: string;
  }>();
  const {
    currentEvent,
    fetchEvent,
    updateEventStatus,
    deleteEventById,
    loading,
  } = useInspectionEventStore();
  const { currentProject, fetchProject } = useProjectStore();
  const { drawings, fetchDrawings } = useDrawingStore();
  const { points, fetchPoints } = useInspectionPointStore();
  const { user } = useAuthStore();
  const [generatingWord, setGeneratingWord] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (projectId && eventId) {
      fetchProject(projectId);
      fetchEvent(eventId);
      fetchDrawings(projectId);
    }
  }, [projectId, eventId]);

  useEffect(() => {
    // すべての図面の点検ポイントを取得
    if (projectId && drawings.length > 0) {
      drawings.forEach((drawing) => {
        fetchPoints(projectId, drawing.id);
      });
    }
  }, [projectId, drawings]);

  const handleBack = (): void => {
    navigate(`/projects/${projectId}/events`);
  };

  const handleStartInspection = (): void => {
    navigate(`/projects/${projectId}/events/${eventId}/work`);
  };

  const handleGenerateWord = async (): Promise<void> => {
    if (!currentProject || !currentEvent || !projectId || !eventId) {
      alert('必要な情報が不足しています');
      return;
    }

    setGeneratingWord(true);
    try {
      // 点検結果を取得
      const results = await getInspectionResults(projectId, eventId);

      // Word文書を生成
      await generateWordReport({
        project: currentProject,
        event: currentEvent,
        points,
        results,
      });
    } catch (error) {
      console.error('Word生成エラー:', error);
      alert(
        `Word文書の生成に失敗しました\n${error instanceof Error ? error.message : ''}`
      );
    } finally {
      setGeneratingWord(false);
    }
  };

  const handleStatusChange = async (
    status: 'pending' | 'in_progress' | 'completed'
  ): Promise<void> => {
    if (!eventId) return;

    try {
      await updateEventStatus(eventId, status);
    } catch (error) {
      console.error('状態変更エラー:', error);
      alert('状態の変更に失敗しました');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!eventId || !projectId || !user) return;

    setDeleting(true);
    try {
      await deleteEventById(eventId, user.id);
      navigate(`/projects/${projectId}/events`);
    } catch (error) {
      console.error('削除エラー:', error);
      alert('点検イベントの削除に失敗しました');
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading && !currentEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">点検イベントが見つかりません</p>
          <button
            onClick={handleBack}
            className="mt-4 text-green-600 hover:text-green-700"
          >
            点検イベント一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="点検イベント詳細"
        onBack={handleBack}
        backLabel="点検イベント一覧に戻る"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* イベント情報カード */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {format(new Date(currentEvent.startDate), 'yyyy年MM月', {
                      locale: ja,
                    })}{' '}
                    点検
                  </h2>
                  <p className="text-gray-600 mt-1">
                    開始日: {format(new Date(currentEvent.startDate), 'yyyy年MM月dd日', {
                      locale: ja,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* 状態表示・変更 */}
                <select
                  value={currentEvent.status}
                  onChange={(e) =>
                    handleStatusChange(
                      e.target.value as 'pending' | 'in_progress' | 'completed'
                    )
                  }
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="pending">点検前</option>
                  <option value="in_progress">進行中</option>
                  <option value="completed">点検完了</option>
                </select>

                {/* 削除ボタン */}
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="削除"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  点検者
                </label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span>{currentEvent.inspectorName}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作成日
                </label>
                <p className="text-gray-900">
                  {format(new Date(currentEvent.createdAt), 'yyyy年MM月dd日 HH:mm', {
                    locale: ja,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* 点検作業セクション */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              点検作業
            </h3>
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <ClipboardCheck className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-700 mb-6">
                図面を選択して設備の点検を開始してください
              </p>
              <div className="flex flex-col items-center justify-center gap-4">
                <button
                  onClick={handleStartInspection}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm font-medium"
                >
                  <ClipboardCheck className="w-5 h-5" />
                  <span>点検作業を開始</span>
                </button>
                <button
                  onClick={handleGenerateWord}
                  disabled={generatingWord}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-5 h-5" />
                  <span>{generatingWord ? 'Word生成中...' : 'Word出力'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 削除確認ダイアログ */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  点検イベントを削除
                </h3>
                <p className="text-gray-600 text-sm">
                  この点検イベントを削除してもよろしいですか？
                  <br />
                  <span className="font-medium text-red-600">
                    この操作は取り消せません。
                  </span>
                  <br />
                  点検結果などのすべてのデータが削除されます。
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>削除中...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>削除する</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
