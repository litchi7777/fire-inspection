import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import * as authService from '@/services/firebase/auth';
import { getUser, updateUser } from '@/services/firebase/firestore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: (userId: string) => Promise<void>;
  updateUserData: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      /**
       * ログイン
       */
      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          // Firebase Authenticationでログイン
          const firebaseUser = await authService.signIn(email, password);

          // Firestoreからユーザー情報を取得
          const userData = await getUser(firebaseUser.uid);

          if (!userData) {
            throw new Error('ユーザー情報が見つかりません');
          }

          if (!userData.isActive) {
            throw new Error('このアカウントは無効化されています');
          }

          // 最終ログイン時刻を更新
          await updateUser(firebaseUser.uid, {
            lastLogin: new Date(),
          });

          set({
            user: { ...userData, lastLogin: new Date() },
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'ログインに失敗しました';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      /**
       * ログアウト
       */
      logout: async () => {
        set({ loading: true, error: null });
        try {
          await authService.signOut();
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'ログアウトに失敗しました';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      /**
       * ユーザー情報を読み込み
       */
      loadUser: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          const userData = await getUser(userId);

          if (!userData) {
            throw new Error('ユーザー情報が見つかりません');
          }

          set({
            user: userData,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'ユーザー情報の取得に失敗しました';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      /**
       * ユーザー情報を更新
       */
      updateUserData: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) {
          throw new Error('ユーザーがログインしていません');
        }

        set({ loading: true, error: null });
        try {
          await updateUser(user.id, data);
          set({
            user: { ...user, ...data },
            loading: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'ユーザー情報の更新に失敗しました';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      /**
       * エラーをクリア
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
