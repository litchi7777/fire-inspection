import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useInspectionEventStore } from '@/stores/useInspectionEventStore';
import { Header } from '@/components/common/Header';

export const InspectionEventCreate = (): JSX.Element => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuthStore();
  const { createNewEvent, loading, error, clearError } =
    useInspectionEventStore();

  const [formData, setFormData] = useState({
    inspectorName: user?.name || '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!projectId) {
      return;
    }

    try {
      const startDate = new Date(formData.startDate);
      // 開始日から年を自動取得
      const year = startDate.getFullYear();

      await createNewEvent({
        projectId,
        year,
        inspectorName: formData.inspectorName,
        startDate,
      });

      navigate(`/projects/${projectId}/events`);
    } catch (err) {
      console.error('点検イベント作成エラー:', err);
    }
  };

  const handleBack = (): void => {
    navigate(`/projects/${projectId}/events`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="点検イベント作成"
        onBack={handleBack}
        backLabel="点検イベント一覧に戻る"
      />

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 点検者名 */}
              <div>
                <label
                  htmlFor="inspectorName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  点検者名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="inspectorName"
                  name="inspectorName"
                  required
                  value={formData.inspectorName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="例: 田中太郎"
                />
              </div>

              {/* 開始日 */}
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  開始日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* 説明 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>注意:</strong>{' '}
                  点検イベントを作成すると、この案件の図面上で点検作業を開始できます。
                  複数の点検者が同時に作業する場合は、それぞれが同じ点検イベントに参加してください。
                </p>
              </div>

              {/* ボタン */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
