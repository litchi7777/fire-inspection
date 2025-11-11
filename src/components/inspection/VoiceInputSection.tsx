import { Mic, Square, Loader2, WifiOff, CheckCircle } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { transcribeAudio } from '@/services/gemini/audioTranscription';
import { useState } from 'react';

interface VoiceInputSectionProps {
  online: boolean;
  onTextTranscribed: (text: string) => void;
}

export const VoiceInputSection = ({
  online,
  onTextTranscribed,
}: VoiceInputSectionProps): JSX.Element => {
  const [audioState, audioControls] = useAudioRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleVoiceInput = async () => {
    if (audioState.isRecording) {
      audioControls.stopRecording();
    } else {
      await audioControls.startRecording();
    }
  };

  const handleTranscribe = async () => {
    if (!audioState.audioBlob) {
      console.error('❌ audioBlobが存在しません');
      return;
    }

    console.log('🎙️ 文字起こし開始:', {
      blobSize: audioState.audioBlob.size,
      blobType: audioState.audioBlob.type,
      recordingTime: audioState.recordingTime,
    });

    setIsTranscribing(true);
    try {
      const text = await transcribeAudio(audioState.audioBlob);
      console.log('✅ 文字起こし完了、テキスト長:', text.length);
      onTextTranscribed(text);
      audioControls.clearRecording();
    } catch (error) {
      console.error('❌ Transcription error:', error);
      alert('音声のテキスト変換に失敗しました');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCancelRecording = () => {
    if (audioState.isRecording) {
      audioControls.stopRecording();
    }
    audioControls.clearRecording();
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!online) {
    return (
      <div className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-500">
        <WifiOff className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">オフライン時は音声入力を使用できません</span>
      </div>
    );
  }

  if (audioState.isRecording) {
    return (
      <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-700 font-medium">録音中</span>
          </div>
          <span className="text-red-700 font-mono text-sm">
            {formatRecordingTime(audioState.recordingTime)}
          </span>
        </div>
        <button
          onClick={handleVoiceInput}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation"
        >
          <Square className="w-4 h-4" />
          <span>録音停止</span>
        </button>
      </div>
    );
  }

  if (audioState.audioBlob) {
    return (
      <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <span className="text-green-700 font-medium">録音完了</span>
          <span className="text-green-700 text-sm">
            {formatRecordingTime(audioState.recordingTime)}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTranscribe}
            disabled={isTranscribing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>変換中...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>テキスト化</span>
              </>
            )}
          </button>
          <button
            onClick={handleCancelRecording}
            disabled={isTranscribing}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleVoiceInput}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
    >
      <Mic className="w-5 h-5" />
      <span>音声で入力</span>
    </button>
  );
};
