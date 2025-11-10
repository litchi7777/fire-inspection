import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileImage, Trash2, Eye } from 'lucide-react';
import { Drawing } from '@/types';
import { useDrawingStore } from '@/stores/useDrawingStore';
import { getFileURL } from '@/services/firebase/storage';

interface DrawingListProps {
  projectId: string;
  drawings: Drawing[];
}

export const DrawingList = ({
  projectId,
  drawings,
}: DrawingListProps): JSX.Element => {
  const navigate = useNavigate();
  const { deleteDrawingById, loading } = useDrawingStore();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadThumbnails = async (): Promise<void> => {
      const urls: Record<string, string> = {};
      for (const drawing of drawings) {
        if (drawing.storagePath) {
          try {
            const url = await getFileURL(drawing.storagePath);
            urls[drawing.id] = url;
          } catch (error) {
            console.error('サムネイル読み込みエラー:', error);
          }
        }
      }
      setThumbnails(urls);
    };

    if (drawings.length > 0) {
      loadThumbnails();
    }
  }, [drawings]);

  const handleDelete = async (
    e: React.MouseEvent,
    drawingId: string
  ): Promise<void> => {
    e.stopPropagation();

    if (!confirm('この図面を削除してもよろしいですか?')) {
      return;
    }

    try {
      await deleteDrawingById(projectId, drawingId);
    } catch (err) {
      console.error('削除エラー:', err);
    }
  };

  const handleView = (drawingId: string): void => {
    navigate(`/projects/${projectId}/drawings/${drawingId}`);
  };

  if (drawings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileImage className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>図面がまだアップロードされていません</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {drawings.map((drawing) => (
        <div
          key={drawing.id}
          onClick={() => handleView(drawing.id)}
          className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
        >
          {/* サムネイル画像 */}
          <div className="aspect-video bg-gray-200 relative">
            {thumbnails[drawing.id] ? (
              <img
                src={thumbnails[drawing.id]}
                alt={`${drawing.pdfName} - ページ ${drawing.pageNumber}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileImage className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
              {drawing.pageNumber}
            </div>
          </div>

          {/* 情報 */}
          <div className="p-3">
            <p className="text-sm font-medium text-gray-900 truncate mb-1">
              {drawing.pdfName}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              ページ {drawing.pageNumber}
            </p>

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleView(drawing.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                <span>表示</span>
              </button>
              <button
                onClick={(e) => handleDelete(e, drawing.id)}
                disabled={loading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
