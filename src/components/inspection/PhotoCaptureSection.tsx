import { Camera, WifiOff, Trash2 } from 'lucide-react';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { useState } from 'react';

interface PhotoCaptureSectionProps {
  online: boolean;
  onPhotosChange: (photos: string[]) => void;
}

export const PhotoCaptureSection = ({
  online,
  onPhotosChange,
}: PhotoCaptureSectionProps): JSX.Element => {
  const [cameraState, cameraControls, videoRef] = useCameraCapture();
  const [showCamera, setShowCamera] = useState(false);

  const handleToggleCamera = async () => {
    if (showCamera) {
      cameraControls.stopCamera();
      setShowCamera(false);
    } else {
      setShowCamera(true);
      await cameraControls.startCamera();
    }
  };

  const handleCapture = () => {
    cameraControls.capturePhoto();
    // 親コンポーネントに写真リストを通知
    setTimeout(() => {
      onPhotosChange(cameraState.photos);
    }, 100);
  };

  const handleRemovePhoto = (index: number) => {
    cameraControls.removePhoto(index);
    setTimeout(() => {
      onPhotosChange(cameraState.photos.filter((_, i) => i !== index));
    }, 100);
  };

  if (!online) {
    return (
      <div className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-500">
        <WifiOff className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">オフライン時は写真撮影を使用できません</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* カメラエラー */}
      {cameraState.error && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm animate-fade-in">
          {cameraState.error}
        </div>
      )}

      {/* カメラプレビュー */}
      {showCamera && (
        <div className="space-y-3 animate-slide-in-from-top">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCapture}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
            >
              <Camera className="w-5 h-5" />
              <span className="font-medium">撮影</span>
            </button>
            <button
              onClick={handleToggleCamera}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 撮影済み写真グリッド */}
      {cameraState.photos.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            {cameraState.photos.map((photo, index) => (
              <div
                key={index}
                className="relative group aspect-video rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors"
              >
                <img
                  src={photo}
                  alt={`写真 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
                <button
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 hover:bg-red-700 active:bg-red-800 transition-all touch-manipulation"
                  aria-label="写真を削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  写真 {index + 1}
                </div>
              </div>
            ))}
          </div>
          {!showCamera && (
            <button
              onClick={handleToggleCamera}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors touch-manipulation"
            >
              <Camera className="w-5 h-5" />
              <span>さらに撮影</span>
            </button>
          )}
        </div>
      )}

      {/* カメラ未起動時の初期ボタン */}
      {!showCamera && cameraState.photos.length === 0 && (
        <button
          onClick={handleToggleCamera}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors touch-manipulation"
        >
          <Camera className="w-5 h-5" />
          <span>写真を撮影</span>
        </button>
      )}
    </div>
  );
};
