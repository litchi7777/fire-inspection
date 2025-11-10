import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { useDrawingStore } from '@/stores/useDrawingStore';
import { getFileURL } from '@/services/firebase/storage';

export const DrawingViewer = (): JSX.Element => {
  const navigate = useNavigate();
  const { projectId, drawingId } = useParams<{
    projectId: string;
    drawingId: string;
  }>();
  const { drawings, fetchDrawings } = useDrawingStore();

  const [currentDrawingIndex, setCurrentDrawingIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchDrawings(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (drawings.length > 0 && drawingId) {
      const index = drawings.findIndex((d) => d.id === drawingId);
      if (index !== -1) {
        setCurrentDrawingIndex(index);
      }
    }
  }, [drawings, drawingId]);

  useEffect(() => {
    const loadImage = async (): Promise<void> => {
      if (drawings.length === 0 || currentDrawingIndex >= drawings.length) {
        return;
      }

      const currentDrawing = drawings[currentDrawingIndex];
      if (!currentDrawing.storagePath) return;

      setLoading(true);
      try {
        const url = await getFileURL(currentDrawing.storagePath);
        setImageUrl(url);
      } catch (error) {
        console.error('画像の読み込みに失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [currentDrawingIndex, drawings]);

  const handlePrevious = (): void => {
    if (currentDrawingIndex > 0) {
      setCurrentDrawingIndex(currentDrawingIndex - 1);
    }
  };

  const handleNext = (): void => {
    if (currentDrawingIndex < drawings.length - 1) {
      setCurrentDrawingIndex(currentDrawingIndex + 1);
    }
  };

  const handleBack = (): void => {
    navigate(`/projects/${projectId}/drawings`);
  };

  if (!projectId || drawings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">図面が見つかりません</p>
          <button
            onClick={handleBack}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            図面一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const currentDrawing = drawings[currentDrawingIndex];

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* ヘッダー */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>図面一覧に戻る</span>
            </button>

            <div className="text-white text-center">
              <h2 className="text-lg font-semibold">
                {currentDrawing?.pdfName}
              </h2>
              <p className="text-sm text-gray-400">
                ページ {currentDrawing?.pageNumber} ({currentDrawingIndex + 1}/
                {drawings.length})
              </p>
            </div>

            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* メインビュー */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              <p className="mt-4 text-white">読み込み中...</p>
            </div>
          </div>
        ) : (
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* ズームコントロール */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                  <button
                    onClick={() => zoomIn()}
                    className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
                    title="拡大"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
                    title="縮小"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
                    title="リセット"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                <TransformComponent
                  wrapperClass="w-full h-full"
                  contentClass="w-full h-full flex items-center justify-center"
                >
                  <img
                    src={imageUrl}
                    alt={`${currentDrawing?.pdfName} - ページ ${currentDrawing?.pageNumber}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}

        {/* ページナビゲーション */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center gap-4 bg-gray-800 rounded-lg px-4 py-3 shadow-lg">
            <button
              onClick={handlePrevious}
              disabled={currentDrawingIndex === 0}
              className="p-2 text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="前のページ"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <span className="text-white font-medium min-w-[80px] text-center">
              {currentDrawingIndex + 1} / {drawings.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentDrawingIndex === drawings.length - 1}
              className="p-2 text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="次のページ"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
