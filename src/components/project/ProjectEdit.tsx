import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, Save, X, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { Header } from '@/components/common/Header';

export const ProjectEdit = (): JSX.Element => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const {
    currentProject,
    loading,
    error,
    fetchProject,
    updateProject,
    deleteProject,
    clearError,
  } = useProjectStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    address: '',
  });

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (currentProject) {
      setFormData({
        customerName: currentProject.customerName,
        address: currentProject.address,
      });
    }
  }, [currentProject]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (): Promise<void> => {
    if (!projectId) return;

    try {
      await updateProject(projectId, formData);
      setIsEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleCancel = (): void => {
    if (currentProject) {
      setFormData({
        customerName: currentProject.customerName,
        address: currentProject.address,
      });
    }
    setIsEditing(false);
    clearError();
  };

  const handleBack = (): void => {
    navigate('/projects');
  };

  const handleDelete = async (): Promise<void> => {
    if (!projectId) return;

    try {
      await deleteProject(projectId);
      navigate('/projects');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading && !currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">案件が見つかりません</p>
          <button
            onClick={handleBack}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            案件一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="案件編集"
        onBack={handleBack}
        backLabel="案件一覧に戻る"
        rightContent={
          !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>編集</span>
            </button>
          ) : undefined
        }
      />

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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

          {/* 案件情報 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              案件情報
            </h2>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    顧客名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    住所 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>キャンセル</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? '保存中...' : '保存'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    顧客名
                  </label>
                  <p className="text-gray-900">{currentProject.customerName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    住所
                  </label>
                  <p className="text-gray-900">{currentProject.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      作成日
                    </label>
                    <p className="text-gray-900">
                      {format(currentProject.createdAt, 'yyyy年MM月dd日', {
                        locale: ja,
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最終更新日
                    </label>
                    <p className="text-gray-900">
                      {format(currentProject.updatedAt, 'yyyy年MM月dd日', {
                        locale: ja,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 削除ボタン */}
          {!isEditing && (
            <div className="mt-6">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>この案件を削除</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              案件を削除しますか？
            </h3>
            <p className="text-gray-600 mb-6">
              この操作は取り消せません。この案件に関連するすべての図面、点検イベント、点検結果も削除されます。
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
