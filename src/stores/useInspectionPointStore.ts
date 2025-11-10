import { create } from 'zustand';
import { InspectionPoint, EquipmentType } from '@/types';
import {
  getInspectionPoints,
  createInspectionPoint,
  updateInspectionPoint,
  deleteInspectionPoint,
} from '@/services/firebase/firestore';

interface InspectionPointState {
  points: InspectionPoint[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchPoints: (projectId: string, drawingId: string) => Promise<void>;
  createPoint: (
    projectId: string,
    drawingId: string,
    pointData: {
      x: number;
      y: number;
      type: EquipmentType;
      name: string;
    }
  ) => Promise<string>;
  updatePoint: (
    projectId: string,
    drawingId: string,
    pointId: string,
    pointData: Partial<InspectionPoint>
  ) => Promise<void>;
  deletePoint: (
    projectId: string,
    drawingId: string,
    pointId: string
  ) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  points: [],
  loading: false,
  error: null,
};

export const useInspectionPointStore = create<InspectionPointState>()(
  (set, get) => ({
    ...initialState,

    fetchPoints: async (projectId: string, drawingId: string) => {
      set({ loading: true, error: null });
      try {
        const points = await getInspectionPoints(projectId, drawingId);
        set({ points, loading: false });
      } catch (error) {
        console.error('点検ポイント取得エラー:', error);
        set({
          error: '点検ポイントの取得に失敗しました',
          loading: false,
        });
      }
    },

    createPoint: async (projectId, drawingId, pointData) => {
      set({ loading: true, error: null });
      try {
        const pointId = await createInspectionPoint(projectId, drawingId, {
          ...pointData,
          inspectionItems: [], // デフォルトは空
        });

        // 作成後、一覧を再取得
        const points = await getInspectionPoints(projectId, drawingId);
        set({ points, loading: false });

        return pointId;
      } catch (error) {
        console.error('点検ポイント作成エラー:', error);
        set({
          error: '点検ポイントの作成に失敗しました',
          loading: false,
        });
        throw error;
      }
    },

    updatePoint: async (projectId, drawingId, pointId, pointData) => {
      set({ loading: true, error: null });
      try {
        await updateInspectionPoint(projectId, drawingId, pointId, pointData);

        // 更新後、一覧を再取得
        const points = await getInspectionPoints(projectId, drawingId);
        set({ points, loading: false });
      } catch (error) {
        console.error('点検ポイント更新エラー:', error);
        set({
          error: '点検ポイントの更新に失敗しました',
          loading: false,
        });
        throw error;
      }
    },

    deletePoint: async (projectId, drawingId, pointId) => {
      set({ loading: true, error: null });
      try {
        await deleteInspectionPoint(projectId, drawingId, pointId);

        // 削除後、一覧から削除
        const points = get().points.filter((p) => p.id !== pointId);
        set({ points, loading: false });
      } catch (error) {
        console.error('点検ポイント削除エラー:', error);
        set({
          error: '点検ポイントの削除に失敗しました',
          loading: false,
        });
        throw error;
      }
    },

    clearError: () => set({ error: null }),

    reset: () => set(initialState),
  })
);
