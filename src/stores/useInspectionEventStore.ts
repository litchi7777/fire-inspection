import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InspectionEvent } from '@/types';
import {
  getInspectionEvents,
  getInspectionEvent,
  createInspectionEvent,
  updateInspectionEvent,
  deleteInspectionEvent,
} from '@/services/firebase/firestore';

interface InspectionEventState {
  events: InspectionEvent[];
  currentEvent: InspectionEvent | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchEvents: (projectId: string) => Promise<void>;
  fetchEvent: (eventId: string) => Promise<void>;
  createNewEvent: (
    eventData: Omit<InspectionEvent, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'deleted' | 'deletedAt' | 'deletedBy'>
  ) => Promise<string>;
  updateEvent: (
    eventId: string,
    eventData: Partial<Omit<InspectionEvent, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  updateEventStatus: (
    eventId: string,
    status: 'pending' | 'in_progress' | 'completed'
  ) => Promise<void>;
  deleteEventById: (eventId: string, userId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  events: [],
  currentEvent: null,
  loading: false,
  error: null,
};

export const useInspectionEventStore = create<InspectionEventState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchEvents: async (projectId: string) => {
        set({ loading: true, error: null });
        try {
          const events = await getInspectionEvents(projectId);
          set({ events, loading: false });
        } catch (error) {
          console.error('点検イベント一覧取得エラー:', error);
          set({
            error: '点検イベント一覧の取得に失敗しました',
            loading: false,
          });
        }
      },

      fetchEvent: async (eventId: string) => {
        set({ loading: true, error: null });
        try {
          const event = await getInspectionEvent(eventId);
          set({ currentEvent: event, loading: false });
        } catch (error) {
          console.error('点検イベント取得エラー:', error);
          set({
            error: '点検イベントの取得に失敗しました',
            loading: false,
          });
        }
      },

      createNewEvent: async (eventData) => {
        set({ loading: true, error: null });
        try {
          const eventId = await createInspectionEvent(eventData);

          // 作成後、一覧を再取得
          const events = await getInspectionEvents(eventData.projectId);
          set({ events, loading: false });

          return eventId;
        } catch (error) {
          console.error('点検イベント作成エラー:', error);
          set({
            error: '点検イベントの作成に失敗しました',
            loading: false,
          });
          throw error;
        }
      },

      updateEvent: async (eventId, eventData) => {
        set({ loading: true, error: null });
        try {
          await updateInspectionEvent(eventId, eventData);

          // 更新後、現在のイベントを再取得
          const event = await getInspectionEvent(eventId);
          set({ currentEvent: event, loading: false });
        } catch (error) {
          console.error('点検イベント更新エラー:', error);
          set({
            error: '点検イベントの更新に失敗しました',
            loading: false,
          });
          throw error;
        }
      },

      updateEventStatus: async (eventId, status) => {
        set({ loading: true, error: null });
        try {
          await updateInspectionEvent(eventId, { status });

          // 更新後、現在のイベントを再取得
          const event = await getInspectionEvent(eventId);
          set({ currentEvent: event, loading: false });
        } catch (error) {
          console.error('点検イベント状態更新エラー:', error);
          set({
            error: '点検イベントの状態更新に失敗しました',
            loading: false,
          });
          throw error;
        }
      },

      deleteEventById: async (eventId, userId) => {
        set({ loading: true, error: null });
        try {
          await deleteInspectionEvent(eventId, userId);

          // 削除後、一覧から削除（論理削除のため、フィルタリング）
          const events = get().events.filter((e) => e.id !== eventId);
          set({ events, loading: false });
        } catch (error) {
          console.error('点検イベント削除エラー:', error);
          set({
            error: '点検イベントの削除に失敗しました',
            loading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'inspection-event-storage',
    }
  )
);
