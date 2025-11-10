import { create } from 'zustand';
import { Drawing } from '@/types';
import {
  getDrawings,
  createDrawing,
  deleteDrawing,
} from '@/services/firebase/firestore';
import {
  uploadPdfFile,
  uploadDrawingImage,
  deleteFile,
} from '@/services/firebase/storage';
import { convertPdfToPng } from '@/services/pdf/converter';
import { useAuthStore } from './useAuthStore';

interface DrawingState {
  drawings: Drawing[];
  loading: boolean;
  uploadProgress: number;
  error: string | null;
  fetchDrawings: (projectId: string) => Promise<void>;
  uploadPdfDrawing: (projectId: string, pdfFile: File) => Promise<void>;
  deleteDrawingById: (projectId: string, drawingId: string) => Promise<void>;
  clearError: () => void;
}

export const useDrawingStore = create<DrawingState>()((set, get) => ({
  drawings: [],
  loading: false,
  uploadProgress: 0,
  error: null,

  /**
   * 図面一覧を取得
   */
  fetchDrawings: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const drawings = await getDrawings(projectId);
      set({ drawings, loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '図面一覧の取得に失敗しました';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  /**
   * PDFファイルをアップロードして図面を作成
   */
  uploadPdfDrawing: async (projectId: string, pdfFile: File) => {
    set({ loading: true, uploadProgress: 0, error: null });

    try {
      // 現在の図面数を取得して表示順序を決定
      const { drawings } = get();
      const nextDisplayOrder = drawings.length + 1;

      // 1. PDFをPNGに変換
      set({ uploadProgress: 10 });
      const convertedPages = await convertPdfToPng(pdfFile);

      // 2. 各ページごとに図面ドキュメントを作成
      const totalPages = convertedPages.length;
      const progressPerPage = 80 / totalPages;

      for (let i = 0; i < convertedPages.length; i++) {
        const page = convertedPages[i];
        const currentDisplayOrder = nextDisplayOrder + i;

        // 図面IDを生成
        const drawingId = `${Date.now()}_${page.pageNumber}`;

        // PDFファイルをアップロード (最初のページのみ)
        let pdfStoragePath = '';
        if (i === 0) {
          pdfStoragePath = await uploadPdfFile(projectId, drawingId, pdfFile);
        }

        // PNG画像をアップロード
        const storagePath = await uploadDrawingImage(
          projectId,
          drawingId,
          page.pageNumber,
          page.blob
        );

        // Firestoreに図面データを保存
        await createDrawing(projectId, {
          pdfName: pdfFile.name,
          pdfStoragePath: i === 0 ? pdfStoragePath : convertedPages[0] ? '' : '',
          pageNumber: page.pageNumber,
          displayOrder: currentDisplayOrder,
          storagePath,
        });

        // 進捗を更新
        set({
          uploadProgress: 10 + Math.round(progressPerPage * (i + 1)),
        });
      }

      // 図面一覧を再取得
      set({ uploadProgress: 95 });
      await get().fetchDrawings(projectId);

      set({ loading: false, uploadProgress: 100 });

      // 少し待ってから進捗をリセット
      setTimeout(() => {
        set({ uploadProgress: 0 });
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'PDFのアップロードに失敗しました';
      set({ error: errorMessage, loading: false, uploadProgress: 0 });
      throw error;
    }
  },

  /**
   * 図面を削除
   */
  deleteDrawingById: async (projectId: string, drawingId: string) => {
    set({ loading: true, error: null });
    try {
      // 削除対象の図面を取得
      const { drawings } = get();
      const drawing = drawings.find((d) => d.id === drawingId);

      if (!drawing) {
        throw new Error('図面が見つかりません');
      }

      // Storageから画像を削除
      if (drawing.storagePath) {
        await deleteFile(drawing.storagePath);
      }

      // PDFファイルも削除 (最初のページの場合)
      if (drawing.pdfStoragePath) {
        await deleteFile(drawing.pdfStoragePath);
      }

      // Firestoreから削除
      const userId = useAuthStore.getState().user?.id || 'unknown';
      await deleteDrawing(projectId, drawingId, userId);

      // 図面一覧を再取得
      await get().fetchDrawings(projectId);

      set({ loading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '図面の削除に失敗しました';
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
}));
