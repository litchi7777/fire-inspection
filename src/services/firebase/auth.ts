import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updatePassword,
} from 'firebase/auth';
import { auth } from './config';

/**
 * メール/パスワードでログイン
 */
export const signIn = async (
  email: string,
  password: string
): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
};

/**
 * ログアウト
 */
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

/**
 * 認証状態の変更を監視
 */
export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * パスワード変更
 */
export const changePassword = async (newPassword: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ユーザーがログインしていません');
  }
  await updatePassword(user, newPassword);
};

/**
 * 現在のユーザーを取得
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * 新規ユーザーを作成
 */
export const createUser = async (
  email: string,
  password: string
): Promise<FirebaseUser> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
};
