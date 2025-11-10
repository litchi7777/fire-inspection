import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project } from '@/types';
import {
  getProjects,
  getProject,
  createProject,
  updateDocument,
  deleteDocument,
} from '@/services/firebase/firestore';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  fetchProjects: (companyId: string) => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
  createNewProject: (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      loading: false,
      error: null,

      /**
       * 案件一覧を取得
       */
      fetchProjects: async (companyId: string) => {
        set({ loading: true, error: null });
        try {
          const projects = await getProjects(companyId);
          set({ projects, loading: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : '案件一覧の取得に失敗しました';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      /**
       * 案件詳細を取得
       */
      fetchProject: async (projectId: string) => {
        set({ loading: true, error: null });
        try {
          const project = await getProject(projectId);
          if (!project) {
            throw new Error('案件が見つかりません');
          }
          set({ currentProject: project, loading: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : '案件詳細の取得に失敗しました';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      /**
       * 案件を作成
       */
      createNewProject: async (
        projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
      ) => {
        set({ loading: true, error: null });
        try {
          const projectId = await createProject(projectData);
          // 一覧を再取得
          await get().fetchProjects(projectData.companyId);
          set({ loading: false });
          return projectId;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '案件の作成に失敗しました';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      /**
       * 案件を更新
       */
      updateProject: async (projectId: string, data: Partial<Project>) => {
        set({ loading: true, error: null });
        try {
          await updateDocument('projects', projectId, data);

          // 現在の案件が更新対象の場合、再取得
          const { currentProject } = get();
          if (currentProject && currentProject.id === projectId) {
            await get().fetchProject(projectId);
          }

          // 一覧も更新
          const { projects } = get();
          const updatedProjects = projects.map((p) =>
            p.id === projectId ? { ...p, ...data } : p
          );
          set({ projects: updatedProjects, loading: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '案件の更新に失敗しました';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      /**
       * 案件を削除
       */
      deleteProject: async (projectId: string) => {
        set({ loading: true, error: null });
        try {
          await deleteDocument('projects', projectId);

          // 一覧から削除
          const { projects, currentProject } = get();
          const updatedProjects = projects.filter((p) => p.id !== projectId);

          // 現在の案件が削除対象の場合、クリア
          const newCurrentProject =
            currentProject?.id === projectId ? null : currentProject;

          set({
            projects: updatedProjects,
            currentProject: newCurrentProject,
            loading: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '案件の削除に失敗しました';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      /**
       * 現在の案件を設定
       */
      setCurrentProject: (project: Project | null) => {
        set({ currentProject: project });
      },

      /**
       * エラーをクリア
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject,
      }),
    }
  )
);
