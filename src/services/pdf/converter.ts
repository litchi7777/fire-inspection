import * as pdfjsLib from 'pdfjs-dist';

// PDF.jsのワーカーを設定
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ConvertedPage {
  pageNumber: number;
  blob: Blob;
  width: number;
  height: number;
}

/**
 * PDFファイルを読み込んでPNG画像に変換
 */
export const convertPdfToPng = async (
  file: File,
  scale: number = 2.0
): Promise<ConvertedPage[]> => {
  try {
    // PDFファイルを読み込み
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const convertedPages: ConvertedPage[] = [];

    // 各ページを処理
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Canvasを作成
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas context not available');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // PDFページをCanvasにレンダリング
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // CanvasをBlobに変換
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/png');
      });

      convertedPages.push({
        pageNumber: pageNum,
        blob,
        width: viewport.width,
        height: viewport.height,
      });
    }

    return convertedPages;
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error(
      `PDFの変換に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    );
  }
};

/**
 * PDFファイルのページ数を取得
 */
export const getPdfPageCount = async (file: File): Promise<number> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
  } catch (error) {
    console.error('PDF page count error:', error);
    throw new Error(
      `PDFの読み込みに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    );
  }
};

/**
 * ファイルサイズを人間が読める形式に変換
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
