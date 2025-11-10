import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useDrawingStore } from '@/stores/useDrawingStore';
import { DrawingUpload } from './DrawingUpload';
import { DrawingList } from './DrawingList';
import { Header } from '@/components/common/Header';

export const DrawingManagement = (): JSX.Element => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, fetchProject } = useProjectStore();
  const { drawings, fetchDrawings, error, clearError } = useDrawingStore();
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
      fetchDrawings(projectId);
    }
  }, [projectId]);

  const handleBack = (): void => {
    navigate('/projects');
  };

  const handleUploadDrawing = (): void => {
    setShowUploadModal(true);
  };

  const handleUploadSuccess = (): void => {
    if (projectId) {
      fetchDrawings(projectId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="図面管理"
        subtitle={currentProject?.customerName}
        onBack={handleBack}
        backLabel="案件一覧に戻る"
        rightContent={
          <button
            onClick={handleUploadDrawing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>図面アップロード</span>
          </button>
        }
      />

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-red-800">{error}</div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <DrawingList projectId={projectId || ''} drawings={drawings} />
        </div>
      </main>

      {/* 図面アップロードモーダル */}
      {showUploadModal && projectId && (
        <DrawingUpload
          projectId={projectId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};
