import { Mic, Loader2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { transcribeAudio } from '@/services/gemini/audioTranscription';
import { useState } from 'react';

interface VoiceInputSectionProps {
  online: boolean;
  onTextTranscribed: (text: string) => void;
}

export const VoiceInputButton = ({
  online,
  onTextTranscribed,
}: VoiceInputSectionProps): JSX.Element => {
  const [audioState, audioControls] = useAudioRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleMouseDown = async () => {
    if (!online || isTranscribing) return;
    await audioControls.startRecording();
  };

  const handleMouseUp = async () => {
    if (!audioState.isRecording) return;

    audioControls.stopRecording();

    // 録音完了後、自動的にテキスト化
    // audioBlobが設定されるまで少し待つ
    setTimeout(async () => {
      const blob = audioState.audioBlob;
      if (!blob) return;

      setIsTranscribing(true);
      try {
        const text = await transcribeAudio(blob);
        onTextTranscribed(text);
        audioControls.clearRecording();
      } catch (error) {
        console.error('Transcription error:', error);
        alert('音声のテキスト変換に失敗しました');
      } finally {
        setIsTranscribing(false);
      }
    }, 100);
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isTranscribing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span className="text-xs text-blue-600 font-medium">変換中...</span>
      </div>
    );
  }

  if (audioState.isRecording) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 rounded-full">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs text-red-700 font-medium font-mono">
          {formatRecordingTime(audioState.recordingTime)}
        </span>
      </div>
    );
  }

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      disabled={!online}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors touch-manipulation ${
        online
          ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
      title={online ? '長押しで録音' : 'オフライン時は使用できません'}
    >
      <Mic className="w-4 h-4" />
      <span className="text-xs font-medium">音声入力</span>
    </button>
  );
};
