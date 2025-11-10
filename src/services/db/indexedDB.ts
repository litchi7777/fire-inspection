import {
  Project,
  Drawing,
  InspectionPoint,
  InspectionEvent,
  InspectionResult,
} from '@/types';

const DB_NAME = 'FireInspectionDB';
const DB_VERSION = 1;

// ストア名
const STORES = {
  PROJECTS: 'projects',
  DRAWINGS: 'drawings',
  POINTS: 'points',
  EVENTS: 'events',
  RESULTS: 'results',
  OFFLINE_QUEUE: 'offlineQueue',
};

/**
 * IndexedDBの初期化
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // プロジェクトストア
      if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
        const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
        projectStore.createIndex('companyId', 'companyId', { unique: false });
      }

      // 図面ストア
      if (!db.objectStoreNames.contains(STORES.DRAWINGS)) {
        const drawingStore = db.createObjectStore(STORES.DRAWINGS, { keyPath: 'id' });
        drawingStore.createIndex('projectId', 'projectId', { unique: false });
      }

      // 点検ポイントストア
      if (!db.objectStoreNames.contains(STORES.POINTS)) {
        const pointStore = db.createObjectStore(STORES.POINTS, { keyPath: 'id' });
        pointStore.createIndex('drawingId', 'drawingId', { unique: false });
      }

      // 点検イベントストア
      if (!db.objectStoreNames.contains(STORES.EVENTS)) {
        const eventStore = db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
        eventStore.createIndex('projectId', 'projectId', { unique: false });
      }

      // 点検結果ストア
      if (!db.objectStoreNames.contains(STORES.RESULTS)) {
        const resultStore = db.createObjectStore(STORES.RESULTS, { keyPath: 'id' });
        resultStore.createIndex('eventId', 'eventId', { unique: false });
        resultStore.createIndex('pointId', 'pointId', { unique: false });
      }

      // オフラインキューストア
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
};

/**
 * 汎用的なデータ保存
 */
export const saveToIndexedDB = async <T extends { id: string }>(
  storeName: string,
  data: T
): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

/**
 * 汎用的なデータ取得
 */
export const getFromIndexedDB = async <T>(
  storeName: string,
  id: string
): Promise<T | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

/**
 * インデックスを使ったデータ取得
 */
export const getAllByIndex = async <T>(
  storeName: string,
  indexName: string,
  indexValue: string
): Promise<T[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(indexValue);

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

/**
 * ストア内の全データ取得
 */
export const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

/**
 * データ削除
 */
export const deleteFromIndexedDB = async (
  storeName: string,
  id: string
): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// 型安全なヘルパー関数

export const saveProject = (project: Project) =>
  saveToIndexedDB(STORES.PROJECTS, project);

export const getProject = (id: string) =>
  getFromIndexedDB<Project>(STORES.PROJECTS, id);

export const getProjectsByCompanyId = (companyId: string) =>
  getAllByIndex<Project>(STORES.PROJECTS, 'companyId', companyId);

export const saveDrawing = (drawing: Drawing) =>
  saveToIndexedDB(STORES.DRAWINGS, drawing);

export const getDrawing = (id: string) =>
  getFromIndexedDB<Drawing>(STORES.DRAWINGS, id);

export const getDrawingsByProjectId = (projectId: string) =>
  getAllByIndex<Drawing>(STORES.DRAWINGS, 'projectId', projectId);

export const saveInspectionPoint = (point: InspectionPoint) =>
  saveToIndexedDB(STORES.POINTS, point);

export const getInspectionPoint = (id: string) =>
  getFromIndexedDB<InspectionPoint>(STORES.POINTS, id);

export const getInspectionPointsByDrawingId = (drawingId: string) =>
  getAllByIndex<InspectionPoint>(STORES.POINTS, 'drawingId', drawingId);

export const saveInspectionEvent = (event: InspectionEvent) =>
  saveToIndexedDB(STORES.EVENTS, event);

export const getInspectionEvent = (id: string) =>
  getFromIndexedDB<InspectionEvent>(STORES.EVENTS, id);

export const getInspectionEventsByProjectId = (projectId: string) =>
  getAllByIndex<InspectionEvent>(STORES.EVENTS, 'projectId', projectId);

export const saveInspectionResult = (result: InspectionResult) =>
  saveToIndexedDB(STORES.RESULTS, result);

export const getInspectionResult = (id: string) =>
  getFromIndexedDB<InspectionResult>(STORES.RESULTS, id);

export const getInspectionResultsByEventId = (eventId: string) =>
  getAllByIndex<InspectionResult>(STORES.RESULTS, 'eventId', eventId);
