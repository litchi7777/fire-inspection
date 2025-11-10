import {
  getOfflineQueue,
  removeFromOfflineQueue,
  updateRetryCount,
  OfflineQueueItem,
} from '../db/offlineQueue';
import {
  setDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const MAX_RETRY_COUNT = 3;

/**
 * オンライン状態かどうかを確認
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * オフラインキューを処理
 */
export const processOfflineQueue = async (): Promise<void> => {
  if (!isOnline()) {
    console.log('Offline: Queue processing skipped');
    return;
  }

  const queue = await getOfflineQueue();

  if (queue.length === 0) {
    console.log('Offline queue is empty');
    return;
  }

  console.log(`Processing ${queue.length} items from offline queue`);

  for (const item of queue) {
    try {
      await processQueueItem(item);
      // 成功したらキューから削除
      if (item.id) {
        await removeFromOfflineQueue(item.id);
      }
      console.log(`Successfully synced item ${item.id}`);
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);

      // リトライ回数を更新
      if (item.id) {
        const newRetryCount = item.retryCount + 1;
        if (newRetryCount >= MAX_RETRY_COUNT) {
          console.error(`Max retry count reached for item ${item.id}, removing from queue`);
          await removeFromOfflineQueue(item.id);
        } else {
          await updateRetryCount(item.id, newRetryCount);
        }
      }
    }
  }
};

/**
 * 個別のキューアイテムを処理
 */
const processQueueItem = async (item: OfflineQueueItem): Promise<void> => {
  const docRef = doc(db, item.collection, item.documentId);

  switch (item.type) {
    case 'CREATE':
    case 'UPDATE':
      await setDoc(docRef, item.data, { merge: true });
      break;

    case 'DELETE':
      await deleteDoc(docRef);
      break;

    default:
      throw new Error(`Unknown queue item type: ${item.type}`);
  }
};

/**
 * オンライン状態の監視を開始
 */
export const startOnlineMonitoring = (): void => {
  // オンラインになったときにキューを処理
  window.addEventListener('online', () => {
    console.log('Back online, processing offline queue');
    processOfflineQueue();
  });

  // オフラインになったときのログ
  window.addEventListener('offline', () => {
    console.log('Gone offline, queueing operations');
  });

  // 初回実行（既にオンラインの場合）
  if (isOnline()) {
    processOfflineQueue();
  }
};

/**
 * 定期的な同期処理
 */
export const startPeriodicSync = (intervalMs: number = 60000): void => {
  setInterval(() => {
    if (isOnline()) {
      processOfflineQueue();
    }
  }, intervalMs);
};
