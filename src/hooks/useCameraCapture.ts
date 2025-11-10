import { useState, useRef, useCallback } from 'react';

export interface CameraCaptureState {
  isStreaming: boolean;
  photos: string[]; // Base64 encoded images
  error: string | null;
}

export interface CameraCaptureControls {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => void;
  removePhoto: (index: number) => void;
  clearPhotos: () => void;
}

/**
 * カメラ撮影用カスタムフック
 */
export const useCameraCapture = (): [
  CameraCaptureState,
  CameraCaptureControls,
  React.RefObject<HTMLVideoElement>
] => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * カメラ起動
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // カメラストリームを取得
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 背面カメラを優先
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      // ビデオ要素にストリームを設定
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('カメラアクセスエラー:', err);
      setError('カメラへのアクセスが拒否されました。ブラウザの設定を確認してください。');
      setIsStreaming(false);
    }
  }, []);

  /**
   * カメラ停止
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
  }, []);

  /**
   * 写真撮影
   */
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !isStreaming) {
      return;
    }

    try {
      // Canvas要素を作成
      const canvas = document.createElement('canvas');
      const video = videoRef.current;

      // ビデオのサイズに合わせる
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // ビデオフレームをキャンバスに描画
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Base64エンコード
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setPhotos((prev) => [...prev, photoData]);
      }
    } catch (err) {
      console.error('写真撮影エラー:', err);
      setError('写真の撮影に失敗しました');
    }
  }, [isStreaming]);

  /**
   * 写真削除
   */
  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * 全写真クリア
   */
  const clearPhotos = useCallback(() => {
    setPhotos([]);
  }, []);

  const state: CameraCaptureState = {
    isStreaming,
    photos,
    error,
  };

  const controls: CameraCaptureControls = {
    startCamera,
    stopCamera,
    capturePhoto,
    removePhoto,
    clearPhotos,
  };

  return [state, controls, videoRef];
};
