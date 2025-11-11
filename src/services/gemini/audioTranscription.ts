import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

/**
 * 音声データをテキストに変換
 * @param audioBlob 音声データのBlob
 * @returns 変換されたテキスト
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  try {
    // Gemini 1.5 Flash を使用（マルチモーダル対応）
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // BlobをBase64に変換
    const base64Audio = await blobToBase64(audioBlob);

    // マルチモーダルプロンプト
    const prompt = `以下の音声から、消防点検の記録として適切なテキストを抽出してください。

要件:
- 音声の内容をそのまま文字起こししてください
- 点検結果（正常、異常など）や設備の状態について述べられている内容を正確に記録してください
- 不要な言葉（えー、あのー、など）は除外してください
- 簡潔で明瞭な日本語にしてください

音声内容:`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: audioBlob.type,
          data: base64Audio,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error('Audio transcription error:', error);
    throw new Error('音声のテキスト変換に失敗しました');
  }
};

/**
 * BlobをBase64文字列に変換
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // "data:audio/webm;base64," などのプレフィックスを削除
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * マイクの使用許可を確認
 */
export const checkMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // ストリームを停止
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
};
