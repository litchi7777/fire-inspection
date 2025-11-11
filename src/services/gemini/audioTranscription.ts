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

  console.log('🎤 音声データ情報:', {
    size: audioBlob.size,
    type: audioBlob.type,
  });

  try {
    // Gemini 2.5 Flash を使用（マルチモーダル対応）
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // BlobをBase64に変換
    console.log('📝 Base64変換開始...');
    const base64Audio = await blobToBase64(audioBlob);
    console.log('✅ Base64変換完了 (長さ:', base64Audio.length, ')');

    // マルチモーダルプロンプト
    const prompt = `音声をそのまま日本語に文字起こししてください。箇条書きや整形は不要です。話された内容をそのまま書き起こしてください。`;

    console.log('🚀 Gemini APIリクエスト送信...');
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: audioBlob.type,
          data: base64Audio,
        },
      },
    ]);

    console.log('📥 Gemini APIレスポンス受信');
    const response = await result.response;
    const text = response.text();

    console.log('✅ 文字起こし成功:', text);
    return text.trim();
  } catch (error) {
    console.error('❌ Audio transcription error:', error);
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
