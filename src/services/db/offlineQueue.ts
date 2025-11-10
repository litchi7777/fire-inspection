import { initDB } from './indexedDB';

export interface OfflineQueueItem {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string;
  documentId: string;
  data: any;
  timestamp: Date;
  retryCount: number;
}

const QUEUE_STORE = 'offlineQueue';

/**
 * オフラインキューにアイテムを追加
 */
export const addToOfflineQueue = async (
  item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>
): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);

    const queueItem: Omit<OfflineQueueItem, 'id'> = {
      ...item,
      timestamp: new Date(),
      retryCount: 0,
    };

    const request = store.add(queueItem);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

/**
 * オフラインキューの全アイテムを取得
 */
export const getOfflineQueue = async (): Promise<OfflineQueueItem[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);
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
 * キューアイテムを削除
 */
export const removeFromOfflineQueue = async (id: number): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

/**
 * キューアイテムのリトライ回数を更新
 */
export const updateRetryCount = async (
  id: number,
  retryCount: number
): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        item.retryCount = retryCount;
        const updateRequest = store.put(item);

        updateRequest.onsuccess = () => {
          resolve();
        };

        updateRequest.onerror = () => {
          reject(updateRequest.error);
        };
      } else {
        reject(new Error('Queue item not found'));
      }
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
};

/**
 * オフラインキューをクリア
 */
export const clearOfflineQueue = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};
