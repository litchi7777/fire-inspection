import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  UploadResult,
} from 'firebase/storage';
import { storage } from './config';

/**
 * ファイルをアップロード
 */
export const uploadFile = async (
  path: string,
  file: File | Blob
): Promise<UploadResult> => {
  const storageRef = ref(storage, path);
  return await uploadBytes(storageRef, file);
};

/**
 * ファイルのダウンロードURLを取得
 */
export const getFileURL = async (path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  return await getDownloadURL(storageRef);
};

/**
 * ファイルを削除
 */
export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

/**
 * PDFファイルをアップロード
 */
export const uploadPdfFile = async (
  projectId: string,
  drawingId: string,
  pdfFile: File
): Promise<string> => {
  const path = `/drawings/${projectId}/${drawingId}.pdf`;
  await uploadFile(path, pdfFile);
  return path;
};

/**
 * 図面画像をアップロード
 */
export const uploadDrawingImage = async (
  projectId: string,
  drawingId: string,
  pageNumber: number,
  imageBlob: Blob
): Promise<string> => {
  const path = `/drawings/${projectId}/${drawingId}_page${pageNumber}.png`;
  await uploadFile(path, imageBlob);
  return path;
};

/**
 * 点検写真をアップロード
 */
export const uploadInspectionPhoto = async (
  projectId: string,
  eventId: string,
  pointId: string,
  photoFile: File
): Promise<string> => {
  const timestamp = Date.now();
  const path = `/photos/${projectId}/${eventId}/${pointId}_${timestamp}.jpg`;
  await uploadFile(path, photoFile);
  return path;
};

/**
 * Base64画像をBlobに変換
 */
export const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeType });
};

/**
 * Base64画像をアップロード
 */
export const uploadBase64Photo = async (
  projectId: string,
  eventId: string,
  pointId: string,
  base64Photo: string
): Promise<string> => {
  const blob = base64ToBlob(base64Photo);
  const timestamp = Date.now();
  const path = `/photos/${projectId}/${eventId}/${pointId}_${timestamp}.jpg`;
  await uploadFile(path, blob);
  return path;
};
