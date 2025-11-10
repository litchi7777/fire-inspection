import { useState, useRef, useCallback } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
}

export interface AudioRecorderControls {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
}

/**
 * 音声録音用カスタムフック
 */
export const useAudioRecorder = (): [AudioRecorderState, AudioRecorderControls] => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  /**
   * 録音開始
   */
  const startRecording = useCallback(async () => {
    try {
      // マイクへのアクセスを要求
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // MediaRecorderのサポート確認
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // データが利用可能になったときのハンドラ
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 録音停止時のハンドラ
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);

        // ストリームを停止
        stream.getTracks().forEach((track) => track.stop());

        // タイマーをクリア
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // 録音開始
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setAudioBlob(null);

      // タイマー開始
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
        setRecordingTime(Math.floor(elapsed / 1000));
      }, 100);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。');
    }
  }, []);

  /**
   * 録音停止
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
    }
  }, [isRecording]);

  /**
   * 録音一時停止
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      // 一時停止開始時刻を記録
      pausedTimeRef.current = Date.now() - startTimeRef.current;

      // タイマーを停止
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  /**
   * 録音再開
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // タイマーを再開
      const pausedDuration = Date.now() - startTimeRef.current - pausedTimeRef.current;
      pausedTimeRef.current = pausedDuration;

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
        setRecordingTime(Math.floor(elapsed / 1000));
      }, 100);
    }
  }, [isRecording, isPaused]);

  /**
   * 録音データをクリア
   */
  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  }, []);

  const state: AudioRecorderState = {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
  };

  const controls: AudioRecorderControls = {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
  };

  return [state, controls];
};
