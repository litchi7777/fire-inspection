import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import {
  User,
  Company,
  Project,
  Drawing,
  InspectionPoint,
  InspectionEvent,
  InspectionResult,
  InspectionRecord,
} from '@/types';

/**
 * ユーザー情報を取得
 */
export const getUser = async (userId: string): Promise<User | null> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    lastLogin: data.lastLogin?.toDate() || null,
  } as User;
};

/**
 * ユーザー情報を更新
 */
export const updateUser = async (
  userId: string,
  data: Partial<User>
): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

/**
 * 会社情報を取得
 */
export const getCompany = async (companyId: string): Promise<Company | null> => {
  const docRef = doc(db, 'companies', companyId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Company;
};

/**
 * プロジェクト一覧を取得
 */
export const getProjects = async (companyId: string): Promise<Project[]> => {
  const q = query(
    collection(db, 'projects'),
    where('companyId', '==', companyId)
  );

  const querySnapshot = await getDocs(q);
  const projects = querySnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        deleted: data.deleted ?? false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        deletedAt: data.deletedAt?.toDate(),
      } as Project;
    })
    .filter((project) => !project.deleted);

  // クライアント側で作成日時の降順でソート
  return projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

/**
 * プロジェクトを取得
 */
export const getProject = async (projectId: string): Promise<Project | null> => {
  const docRef = doc(db, 'projects', projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();

  // 削除されたプロジェクトは null を返す
  if (data.deleted === true) {
    return null;
  }

  return {
    id: docSnap.id,
    ...data,
    deleted: data.deleted ?? false,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    deletedAt: data.deletedAt?.toDate(),
  } as Project;
};

/**
 * プロジェクトを作成
 */
export const createProject = async (
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'deleted' | 'deletedAt' | 'deletedBy'>
): Promise<string> => {
  const docRef = doc(collection(db, 'projects'));
  await setDoc(docRef, {
    ...projectData,
    deleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

/**
 * プロジェクトを削除（論理削除）
 */
export const deleteProject = async (
  projectId: string,
  userId: string
): Promise<void> => {
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, {
    deleted: true,
    deletedAt: Timestamp.now(),
    deletedBy: userId,
    updatedAt: Timestamp.now(),
  });
};

/**
 * 図面一覧を取得
 */
export const getDrawings = async (projectId: string): Promise<Drawing[]> => {
  const q = query(collection(db, `projects/${projectId}/drawings`));

  const querySnapshot = await getDocs(q);
  const drawings = querySnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        projectId,
        ...data,
        deleted: data.deleted ?? false,
        createdAt: data.createdAt?.toDate() || new Date(),
        deletedAt: data.deletedAt?.toDate(),
      } as Drawing;
    })
    .filter((drawing) => !drawing.deleted);

  // クライアント側でdisplayOrderの昇順でソート
  return drawings.sort((a, b) => a.displayOrder - b.displayOrder);
};

/**
 * 図面を作成
 */
export const createDrawing = async (
  projectId: string,
  drawingData: Omit<Drawing, 'id' | 'projectId' | 'createdAt' | 'deleted' | 'deletedAt' | 'deletedBy'>
): Promise<string> => {
  const docRef = doc(collection(db, `projects/${projectId}/drawings`));
  await setDoc(docRef, {
    ...drawingData,
    deleted: false,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

/**
 * 図面を削除（論理削除）
 */
export const deleteDrawing = async (
  projectId: string,
  drawingId: string,
  userId: string
): Promise<void> => {
  const docRef = doc(db, `projects/${projectId}/drawings`, drawingId);
  await updateDoc(docRef, {
    deleted: true,
    deletedAt: Timestamp.now(),
    deletedBy: userId,
  });
};

/**
 * 点検ポイント一覧を取得
 */
export const getInspectionPoints = async (
  projectId: string,
  drawingId: string
): Promise<InspectionPoint[]> => {
  const q = query(
    collection(db, `projects/${projectId}/drawings/${drawingId}/points`)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        drawingId,
        ...data,
        deleted: data.deleted ?? false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        deletedAt: data.deletedAt?.toDate(),
      } as InspectionPoint;
    })
    .filter((point) => !point.deleted);
};

/**
 * 点検ポイントを作成
 */
export const createInspectionPoint = async (
  projectId: string,
  drawingId: string,
  pointData: Omit<InspectionPoint, 'id' | 'drawingId' | 'createdAt' | 'updatedAt' | 'deleted' | 'deletedAt' | 'deletedBy'>
): Promise<string> => {
  const docRef = doc(
    collection(db, `projects/${projectId}/drawings/${drawingId}/points`)
  );
  await setDoc(docRef, {
    ...pointData,
    deleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

/**
 * 点検ポイントを更新
 */
export const updateInspectionPoint = async (
  projectId: string,
  drawingId: string,
  pointId: string,
  pointData: Partial<Omit<InspectionPoint, 'id' | 'drawingId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  const docRef = doc(
    db,
    `projects/${projectId}/drawings/${drawingId}/points`,
    pointId
  );
  await updateDoc(docRef, {
    ...pointData,
    updatedAt: Timestamp.now(),
  });
};

/**
 * 点検ポイントを削除（論理削除）
 */
export const deleteInspectionPoint = async (
  projectId: string,
  drawingId: string,
  pointId: string,
  userId: string
): Promise<void> => {
  const docRef = doc(
    db,
    `projects/${projectId}/drawings/${drawingId}/points`,
    pointId
  );
  await updateDoc(docRef, {
    deleted: true,
    deletedAt: Timestamp.now(),
    deletedBy: userId,
    updatedAt: Timestamp.now(),
  });
};

/**
 * 汎用的なドキュメント取得
 */
export const getDocument = async <T extends DocumentData>(
  collectionPath: string,
  docId: string
): Promise<(T & { id: string }) | null> => {
  const docRef = doc(db, collectionPath, docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
};

/**
 * 汎用的なドキュメント作成
 */
export const createDocument = async <T extends DocumentData>(
  collectionPath: string,
  data: T
): Promise<string> => {
  const docRef = doc(collection(db, collectionPath));
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

/**
 * 汎用的なドキュメント更新
 */
export const updateDocument = async <T extends DocumentData>(
  collectionPath: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(db, collectionPath, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

/**
 * 汎用的なドキュメント削除
 */
export const deleteDocument = async (
  collectionPath: string,
  docId: string
): Promise<void> => {
  const docRef = doc(db, collectionPath, docId);
  await deleteDoc(docRef);
};

/**
 * 会社と初期管理者ユーザーを作成
 */
export const createCompanyAndAdmin = async (
  companyData: {
    name: string;
    address: string;
  },
  adminData: {
    userId: string;
    email: string;
    name: string;
  }
): Promise<string> => {
  // 会社を作成
  const companyRef = doc(collection(db, 'companies'));
  const companyId = companyRef.id;

  const companyDocData = {
    ...companyData,
    adminUsers: [adminData.userId],
    members: [adminData.userId],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(companyRef, companyDocData);

  // 管理者ユーザーを作成
  const userRef = doc(db, 'users', adminData.userId);

  const userDocData = {
    email: adminData.email,
    name: adminData.name,
    companyId,
    role: 'admin',
    isActive: true,
    mustChangePassword: false,
    devices: [],
    createdAt: Timestamp.now(),
    createdBy: adminData.userId,
    lastLogin: null,
  };

  await setDoc(userRef, userDocData);

  return companyId;
};

/**
 * 点検イベント一覧を取得
 */
export const getInspectionEvents = async (
  projectId: string
): Promise<InspectionEvent[]> => {
  // deleted フィールドがない既存データも取得するため、where('deleted', '==', false) を使わない
  const q = query(
    collection(db, 'inspectionEvents'),
    where('projectId', '==', projectId)
  );

  const querySnapshot = await getDocs(q);
  const events = querySnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        deleted: data.deleted ?? false, // 既存データの場合は false とみなす
        startDate: data.startDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        deletedAt: data.deletedAt?.toDate(),
      } as InspectionEvent;
    })
    // deleted が true のものを除外
    .filter((event) => !event.deleted);

  // クライアント側で開始日の降順でソート
  return events.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
};

/**
 * 点検イベントを取得
 */
export const getInspectionEvent = async (
  eventId: string
): Promise<InspectionEvent | null> => {
  const docRef = doc(db, 'inspectionEvents', eventId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();

  // 削除されたイベントは null を返す（deleted フィールドがない場合は false とみなす）
  if (data.deleted === true) {
    return null;
  }

  return {
    id: docSnap.id,
    ...data,
    deleted: data.deleted ?? false, // 既存データの場合は false とみなす
    startDate: data.startDate?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    deletedAt: data.deletedAt?.toDate(),
  } as InspectionEvent;
};

/**
 * 点検イベントを作成
 */
export const createInspectionEvent = async (
  eventData: Omit<InspectionEvent, 'id' | 'createdAt' | 'updatedAt' | 'deleted' | 'deletedAt' | 'deletedBy' | 'status'>
): Promise<string> => {
  const docRef = doc(collection(db, 'inspectionEvents'));
  await setDoc(docRef, {
    ...eventData,
    startDate: Timestamp.fromDate(eventData.startDate),
    status: 'pending',
    deleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

/**
 * 点検イベントを更新
 */
export const updateInspectionEvent = async (
  eventId: string,
  eventData: Partial<Omit<InspectionEvent, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  const docRef = doc(db, 'inspectionEvents', eventId);
  const updateData: any = {
    ...eventData,
    updatedAt: Timestamp.now(),
  };

  if (eventData.startDate) {
    updateData.startDate = Timestamp.fromDate(eventData.startDate);
  }

  await updateDoc(docRef, updateData);
};

/**
 * 点検イベントを削除（論理削除）
 */
export const deleteInspectionEvent = async (
  eventId: string,
  userId: string
): Promise<void> => {
  const docRef = doc(db, 'inspectionEvents', eventId);
  await updateDoc(docRef, {
    deleted: true,
    deletedAt: Timestamp.now(),
    deletedBy: userId,
    updatedAt: Timestamp.now(),
  });
};

/**
 * 点検結果を取得
 */
export const getInspectionResult = async (
  projectId: string,
  eventId: string,
  pointId: string
): Promise<InspectionResult | null> => {
  const docRef = doc(
    db,
    `projects/${projectId}/inspectionEvents/${eventId}/results`,
    pointId
  );
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    records: data.records
      ?.map((record: any) => ({
        ...record,
        deleted: record.deleted ?? false,
        timestamp: record.timestamp?.toDate() || new Date(),
        deletedAt: record.deletedAt?.toDate(),
      }))
      .filter((record: InspectionRecord) => !record.deleted) || [],
    lastUpdated: data.lastUpdated?.toDate() || new Date(),
  } as InspectionResult;
};

/**
 * 点検イベントの全点検結果を取得
 */
export const getInspectionResults = async (
  projectId: string,
  eventId: string
): Promise<InspectionResult[]> => {
  const q = query(
    collection(db, `projects/${projectId}/inspectionEvents/${eventId}/results`)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      records: data.records
        ?.map((record: any) => ({
          ...record,
          deleted: record.deleted ?? false,
          timestamp: record.timestamp?.toDate() || new Date(),
          deletedAt: record.deletedAt?.toDate(),
        }))
        .filter((record: InspectionRecord) => !record.deleted) || [],
      lastUpdated: data.lastUpdated?.toDate() || new Date(),
    } as InspectionResult;
  });
};

/**
 * 点検結果を保存
 */
export const saveInspectionResult = async (
  projectId: string,
  eventId: string,
  pointId: string,
  recordData: Omit<InspectionRecord, 'timestamp'>
): Promise<void> => {
  const docRef = doc(
    db,
    `projects/${projectId}/inspectionEvents/${eventId}/results`,
    pointId
  );

  // 既存の結果を取得
  const existingResult = await getInspectionResult(projectId, eventId, pointId);

  const newRecord: InspectionRecord = {
    ...recordData,
    timestamp: new Date(),
    deleted: false,
  };

  if (existingResult) {
    // 既存の記録がある場合は追加
    const updatedRecords = [...existingResult.records, newRecord];
    await updateDoc(docRef, {
      records: updatedRecords.map((record) => ({
        ...record,
        timestamp: Timestamp.fromDate(record.timestamp),
      })),
      status: recordData.itemResults.some((item) => item.status === 'fail')
        ? 'fail'
        : 'ok',
      hasConflict: updatedRecords.length > 1,
      lastUpdated: Timestamp.now(),
    });
  } else {
    // 新規作成
    await setDoc(docRef, {
      eventId,
      pointId,
      status: recordData.itemResults.some((item) => item.status === 'fail')
        ? 'fail'
        : 'ok',
      records: [
        {
          ...newRecord,
          timestamp: Timestamp.fromDate(newRecord.timestamp),
        },
      ],
      hasConflict: false,
      isResolved: false,
      lastUpdated: Timestamp.now(),
    });
  }
};

/**
 * 特定の点検ポイントの過去年度の点検履歴を取得
 */
export interface PointHistoryByYear {
  year: number;
  eventId: string;
  result: InspectionResult;
}

export const getPointHistoryAcrossYears = async (
  projectId: string,
  pointId: string
): Promise<PointHistoryByYear[]> => {
  // プロジェクトの全点検イベントを取得
  const events = await getInspectionEvents(projectId);

  // 各イベントごとにこのポイントの点検結果を取得
  const historyPromises = events.map(async (event) => {
    const result = await getInspectionResult(projectId, event.id, pointId);
    if (result && result.records.length > 0) {
      return {
        year: event.year,
        eventId: event.id,
        result,
      };
    }
    return null;
  });

  const histories = await Promise.all(historyPromises);

  // nullを除外して年度降順でソート
  return histories
    .filter((h): h is PointHistoryByYear => h !== null)
    .sort((a, b) => b.year - a.year);
};

/**
 * 特定の点検記録を削除（論理削除）
 */
export const deleteInspectionRecord = async (
  projectId: string,
  eventId: string,
  pointId: string,
  recordIndex: number,
  userId: string
): Promise<void> => {
  const docRef = doc(
    db,
    `projects/${projectId}/inspectionEvents/${eventId}/results`,
    pointId
  );

  // 既存の結果を取得（削除済みレコードも含む）
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error('削除対象の記録が見つかりません');
  }

  const data = docSnap.data();
  const allRecords = data.records?.map((record: any) => ({
    ...record,
    deleted: record.deleted ?? false,
    timestamp: record.timestamp?.toDate() || new Date(),
    deletedAt: record.deletedAt?.toDate(),
  })) || [];

  if (!allRecords[recordIndex]) {
    throw new Error('削除対象の記録が見つかりません');
  }

  // 指定されたインデックスのレコードを論理削除
  allRecords[recordIndex] = {
    ...allRecords[recordIndex],
    deleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
  };

  // 削除されていないレコードのみを取得
  const activeRecords = allRecords.filter((record: InspectionRecord) => !record.deleted);

  // ステータスを再計算
  const hasAnyFail = activeRecords.some((record: InspectionRecord) =>
    record.itemResults.some((item) => item.status === 'fail')
  );

  await updateDoc(docRef, {
    records: allRecords.map((record: InspectionRecord) => ({
      ...record,
      timestamp: Timestamp.fromDate(record.timestamp),
      deletedAt: record.deletedAt ? Timestamp.fromDate(record.deletedAt) : null,
    })),
    status: activeRecords.length > 0 ? (hasAnyFail ? 'fail' : 'ok') : 'uninspected',
    hasConflict: activeRecords.length > 1,
    lastUpdated: Timestamp.now(),
  });
};
