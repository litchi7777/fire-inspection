import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('Firebase設定確認:', {
  apiKey: firebaseConfig.apiKey ? '✅ 設定済み' : '❌ 未設定',
  authDomain: firebaseConfig.authDomain || '❌ 未設定',
  projectId: firebaseConfig.projectId || '❌ 未設定',
  storageBucket: firebaseConfig.storageBucket || '❌ 未設定',
});

// Firebase初期化
export const app = initializeApp(firebaseConfig);

// サービスのインスタンス
export const auth = getAuth(app);

// Firestoreの初期化 - fire-inspection-databaseを使用
export const db = getFirestore(app, 'fire-inspection-database');

export const storage = getStorage(app);

// エミュレータ接続（必要に応じて有効化）
// 開発環境でエミュレータを使用する場合はコメントを解除
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectStorageEmulator(storage, 'localhost', 9199);
// }

console.log('✅ Firebase初期化完了');
