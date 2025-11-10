import { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { useDrawingStore } from '@/stores/useDrawingStore';
import { formatFileSize, getPdfPageCount } from '@/services/pdf/converter';

interface DrawingUploadProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DrawingUpload = ({
  projectId,
  onClose,
  onSuccess,
}: DrawingUploadProps): JSX.Element => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const { uploadPdfDrawing, uploadProgress, loading, error, clearError } =
    useDrawingStore();

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    // PDFファイルのみ受け付ける
    if (file.type !== 'application/pdf') {
      alert('PDFファイルを選択してください');
      return;
    }

    try {
      const count = await getPdfPageCount(file);
      setSelectedFile(file);
      setPageCount(count);
      clearError();
    } catch (err) {
      console.error('PDF読み込みエラー:', err);
      alert('PDFファイルの読み込みに失敗しました');
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile) return;

    try {
      await uploadPdfDrawing(projectId, selectedFile);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('アップロードエラー:', err);
    }
  };

  const handleCancel = (): void => {
    setSelectedFile(null);
    setPageCount(0);
    clearError();
    onClose();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('PDFファイルを選択してください');
      return;
    }

    try {
      const count = await getPdfPageCount(file);
      setSelectedFile(file);
      setPageCount(count);
      clearError();
    } catch (err) {
      console.error('PDF読み込みエラー:', err);
      alert('PDFファイルの読み込みに失敗しました');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            図面PDFアップロード
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                PDFファイルをドラッグ&ドロップ
              </p>
              <p className="text-sm text-gray-600 mb-4">または</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                ファイルを選択
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div>
              {/* 選択されたファイル情報 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{formatFileSize(selectedFile.size)}</span>
                      <span>{pageCount}ページ</span>
                    </div>
                  </div>
                  {!loading && (
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPageCount(0);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* アップロード進捗 */}
              {loading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      アップロード中...
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 説明 */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>処理内容:</strong> PDFの各ページがPNG画像に変換され、個別の図面として保存されます。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'アップロード中...' : 'アップロード'}
          </button>
        </div>
      </div>
    </div>
  );
};
