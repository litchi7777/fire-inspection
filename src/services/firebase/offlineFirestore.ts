import { InspectionResult, InspectionRecord } from '@/types';
import {
  saveInspectionResult as saveToFirestore,
  getInspectionResult as getFromFirestore,
  getInspectionResults as getResultsFromFirestore,
} from './firestore';
import {
  saveInspectionResult as saveToIndexedDB,
  getInspectionResult as getFromIndexedDB,
  getInspectionResultsByEventId,
} from '../db/indexedDB';
import { addToOfflineQueue } from '../db/offlineQueue';
import { isOnline } from '../sync/syncService';

/**
 * オフライン対応の点検結果保存
 */
export const saveInspectionResultOffline = async (
  projectId: string,
  eventId: string,
  pointId: string,
  recordData: Omit<InspectionRecord, 'timestamp'>
): Promise<void> => {
  // まずIndexedDBに保存（オフライン時もオンライン時も）
  const newRecord: InspectionRecord = {
    ...recordData,
    timestamp: new Date(),
  };

  // 既存の結果を取得（IndexedDBから）
  const resultId = `${eventId}_${pointId}`;
  const existingResult = await getFromIndexedDB(resultId);

  const updatedResult: InspectionResult = existingResult
    ? {
        ...existingResult,
        records: [...existingResult.records, newRecord],
        status: recordData.itemResults.some((item) => item.status === 'fail')
          ? 'fail'
          : 'ok',
        hasConflict: existingResult.records.length + 1 > 1,
        lastUpdated: new Date(),
      }
    : {
        id: resultId,
        eventId,
        pointId,
        status: recordData.itemResults.some((item) => item.status === 'fail')
          ? 'fail'
          : 'ok',
        records: [newRecord],
        hasConflict: false,
        isResolved: false,
        lastUpdated: new Date(),
      };

  await saveToIndexedDB(updatedResult);

  // オンラインの場合はFirestoreにも保存を試みる
  if (isOnline()) {
    try {
      await saveToFirestore(projectId, eventId, pointId, recordData);
    } catch (error) {
      console.error('Failed to save to Firestore, adding to offline queue:', error);
      // Firestoreへの保存に失敗したらキューに追加
      await addToOfflineQueue({
        type: 'UPDATE',
        collection: `projects/${projectId}/inspectionEvents/${eventId}/results`,
        documentId: pointId,
        data: updatedResult,
      });
    }
  } else {
    // オフラインの場合はキューに追加
    await addToOfflineQueue({
      type: 'UPDATE',
      collection: `projects/${projectId}/inspectionEvents/${eventId}/results`,
      documentId: pointId,
      data: updatedResult,
    });
  }
};

/**
 * オフライン対応の点検結果取得
 */
export const getInspectionResultOffline = async (
  projectId: string,
  eventId: string,
  pointId: string
): Promise<InspectionResult | null> => {
  // オンラインの場合はFirestoreから取得し、IndexedDBにキャッシュ
  if (isOnline()) {
    try {
      const result = await getFromFirestore(projectId, eventId, pointId);
      if (result) {
        await saveToIndexedDB(result);
      }
      return result;
    } catch (error) {
      console.error('Failed to fetch from Firestore, falling back to IndexedDB:', error);
      // Firestoreからの取得に失敗したらIndexedDBから取得
      const resultId = `${eventId}_${pointId}`;
      return await getFromIndexedDB(resultId);
    }
  }

  // オフラインの場合はIndexedDBから取得
  const resultId = `${eventId}_${pointId}`;
  return await getFromIndexedDB(resultId);
};

/**
 * オフライン対応の点検結果一覧取得
 */
export const getInspectionResultsOffline = async (
  projectId: string,
  eventId: string
): Promise<InspectionResult[]> => {
  // オンラインの場合はFirestoreから取得し、IndexedDBにキャッシュ
  if (isOnline()) {
    try {
      const results = await getResultsFromFirestore(projectId, eventId);
      // すべての結果をIndexedDBにキャッシュ
      for (const result of results) {
        await saveToIndexedDB(result);
      }
      return results;
    } catch (error) {
      console.error('Failed to fetch from Firestore, falling back to IndexedDB:', error);
      // Firestoreからの取得に失敗したらIndexedDBから取得
      return await getInspectionResultsByEventId(eventId);
    }
  }

  // オフラインの場合はIndexedDBから取得
  return await getInspectionResultsByEventId(eventId);
};
