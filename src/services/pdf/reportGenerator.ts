import { jsPDF } from 'jspdf';
import { InspectionEvent, InspectionResult, InspectionPoint, Project } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';

export interface ReportData {
  project: Project;
  event: InspectionEvent;
  points: InspectionPoint[];
  results: InspectionResult[];
}

/**
 * 日本語テキストを描画（UTF-16でエンコード）
 * jsPDFは標準フォントでは日本語を表示できないため、
 * Canvas上にテキストを描画してから画像として埋め込む方式
 */
const drawJapaneseText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: { fontSize?: number; align?: 'left' | 'center' | 'right'; maxWidth?: number }
): void => {
  const fontSize = options?.fontSize || 12;
  const align = options?.align || 'left';
  const maxWidth = options?.maxWidth || 170;

  // Canvas要素を作成してテキストを描画
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 高解像度対応
  const scale = 2;
  canvas.width = maxWidth * scale * 3.78; // mm to px (1mm ≈ 3.78px at 96dpi)
  canvas.height = fontSize * scale * 3.78;

  ctx.scale(scale, scale);
  ctx.font = `${fontSize * 3.78}px "Noto Sans JP", "Hiragino Kaku Gothic Pro", "ヒラギノ角ゴ Pro", "Yu Gothic", "游ゴシック", Meiryo, "メイリオ", sans-serif`;
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  // テキスト配置
  let textX = 0;
  if (align === 'center') {
    textX = canvas.width / (2 * scale) / 2;
    ctx.textAlign = 'center';
  } else if (align === 'right') {
    textX = canvas.width / scale;
    ctx.textAlign = 'right';
  } else {
    ctx.textAlign = 'left';
  }

  ctx.fillText(text, textX, 0, canvas.width / scale);

  // Canvas画像をPDFに追加
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = maxWidth;
  const imgHeight = fontSize * 1.2; // 行間を考慮

  let adjustedX = x;
  if (align === 'center') {
    adjustedX = x - imgWidth / 2;
  } else if (align === 'right') {
    adjustedX = x - imgWidth;
  }

  doc.addImage(imgData, 'PNG', adjustedX, y - fontSize / 2, imgWidth, imgHeight);
};

/**
 * 点検報告書PDFを生成
 */
export const generateInspectionReport = async (data: ReportData): Promise<void> => {
  const { project, event, points, results } = data;

  // jsPDFインスタンスを作成（A4サイズ、縦向き）
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPos = 25;

  // タイトル（日本語）
  drawJapaneseText(doc, '消防設備点検報告書', 105, yPos, { fontSize: 20, align: 'center', maxWidth: 170 });
  yPos += 15;

  // 罫線
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  yPos += 10;

  // 基本情報セクション
  drawJapaneseText(doc, '【基本情報】', 20, yPos, { fontSize: 14, maxWidth: 170 });
  yPos += 10;

  drawJapaneseText(doc, `物件名: ${project.customerName}`, 20, yPos, { fontSize: 12, maxWidth: 170 });
  yPos += 8;

  drawJapaneseText(doc, `所在地: ${project.address}`, 20, yPos, { fontSize: 12, maxWidth: 170 });
  yPos += 8;

  const eventYearMonth = format(new Date(event.startDate), 'yyyy年MM月', { locale: ja });
  drawJapaneseText(doc, `点検年月: ${eventYearMonth}`, 20, yPos, { fontSize: 12, maxWidth: 170 });
  yPos += 8;

  drawJapaneseText(doc, `点検責任者: ${event.inspectorName}`, 20, yPos, { fontSize: 12, maxWidth: 170 });
  yPos += 8;

  const dateStr = format(new Date(event.startDate), 'yyyy年MM月dd日', { locale: ja });
  drawJapaneseText(doc, `点検開始日: ${dateStr}`, 20, yPos, { fontSize: 12, maxWidth: 170 });
  yPos += 8;

  const statusText = event.status === 'completed' ? '完了' : event.status === 'in_progress' ? '実施中' : '未実施';
  drawJapaneseText(doc, `状態: ${statusText}`, 20, yPos, { fontSize: 12, maxWidth: 170 });
  yPos += 8;

  // 報告書作成日
  const createdDate = format(new Date(), 'yyyy年MM月dd日 HH:mm', { locale: ja });
  drawJapaneseText(doc, `報告書作成日時: ${createdDate}`, 20, yPos, { fontSize: 10, maxWidth: 170 });
  yPos += 15;

  // 点検結果サマリー
  const totalPoints = points.length;
  const inspectedPoints = results.filter((r) => r.status !== 'uninspected').length;
  const okPoints = results.filter((r) => r.status === 'ok').length;
  const failPoints = results.filter((r) => r.status === 'fail').length;
  const uninspectedPoints = totalPoints - inspectedPoints;
  const conflictPoints = results.filter((r) => r.hasConflict && !r.isResolved).length;

  // 罫線
  doc.line(20, yPos, 190, yPos);
  yPos += 10;

  drawJapaneseText(doc, '【点検結果サマリー】', 20, yPos, { fontSize: 14, maxWidth: 170 });
  yPos += 10;

  drawJapaneseText(doc, `総設備数: ${totalPoints}件`, 25, yPos, { fontSize: 11, maxWidth: 165 });
  yPos += 7;
  drawJapaneseText(doc, `点検済み: ${inspectedPoints}件`, 25, yPos, { fontSize: 11, maxWidth: 165 });
  yPos += 7;
  drawJapaneseText(doc, `正常: ${okPoints}件`, 25, yPos, { fontSize: 11, maxWidth: 165 });
  yPos += 7;
  drawJapaneseText(doc, `異常: ${failPoints}件`, 25, yPos, { fontSize: 11, maxWidth: 165 });
  yPos += 7;
  drawJapaneseText(doc, `未点検: ${uninspectedPoints}件`, 25, yPos, { fontSize: 11, maxWidth: 165 });
  yPos += 7;

  // 競合がある場合は表示
  if (conflictPoints > 0) {
    drawJapaneseText(doc, `⚠ 競合検出: ${conflictPoints}件（要確認）`, 25, yPos, { fontSize: 11, maxWidth: 165 });
    yPos += 7;
  }

  // 点検進捗率
  const progress = totalPoints > 0 ? Math.round((inspectedPoints / totalPoints) * 100) : 0;
  drawJapaneseText(doc, `点検進捗率: ${progress}%`, 25, yPos, { fontSize: 11, maxWidth: 165 });
  yPos += 15;

  // 詳細結果セクション
  // 罫線
  doc.line(20, yPos, 190, yPos);
  yPos += 10;

  drawJapaneseText(doc, '【点検詳細】', 20, yPos, { fontSize: 14, maxWidth: 170 });
  yPos += 10;

  // 設備タイプの日本語マッピング
  const equipmentTypeMap: Record<string, string> = {
    fire_extinguisher: '消火器',
    smoke_sensor: '煙感知器',
    heat_sensor: '熱感知器',
    sprinkler: 'スプリンクラー',
    fire_door: '防火扉',
  };

  for (const point of points) {
    // ページの残りスペースをチェック
    if (yPos > 265) {
      doc.addPage();
      yPos = 20;
    }

    const result = results.find((r) => r.pointId === point.id);
    const statusText = result
      ? result.status === 'ok'
        ? '✓ 正常'
        : result.status === 'fail'
        ? '✗ 異常'
        : '○ 未点検'
      : '○ 未点検';

    const equipmentTypeName = equipmentTypeMap[point.type] || point.type;
    const conflictMark = result?.hasConflict && !result?.isResolved ? ' ⚠競合あり' : '';

    drawJapaneseText(doc, `${point.name} [${equipmentTypeName}]: ${statusText}${conflictMark}`, 20, yPos, { fontSize: 10, maxWidth: 170 });
    yPos += 6;

    // 点検記録の詳細を表示
    if (result && result.records.length > 0) {
      result.records.forEach((record, index) => {
        // 点検者と日時
        const recordDate = format(new Date(record.timestamp), 'yyyy/MM/dd HH:mm', { locale: ja });
        drawJapaneseText(doc, `  記録${index + 1}: ${record.userName} (${recordDate})`, 25, yPos, { fontSize: 9, maxWidth: 165 });
        yPos += 5;

        // 各項目の結果
        record.itemResults.forEach((item) => {
          if (item.notes) {
            // 長いメモは複数行に分割
            const maxLength = 60;
            let noteText = item.notes;
            while (noteText.length > 0) {
              const line = noteText.substring(0, maxLength);
              drawJapaneseText(doc, `    - ${line}`, 30, yPos, { fontSize: 8, maxWidth: 160 });
              yPos += 4;
              noteText = noteText.substring(maxLength);

              // ページ終端チェック
              if (yPos > 265) {
                doc.addPage();
                yPos = 20;
              }
            }
          }
        });

        // 写真の有無
        if (record.photos && record.photos.length > 0) {
          drawJapaneseText(doc, `    写真: ${record.photos.length}枚添付`, 30, yPos, { fontSize: 8, maxWidth: 160 });
          yPos += 4;
        }
      });
    }

    yPos += 3;
  }

  // フッター：ページ番号と会社情報を追加
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // ページ番号
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`- ${i} / ${pageCount} -`, 105, 287, { align: 'center' });

    // 作成日（フッター）
    doc.setFontSize(8);
    doc.text(format(new Date(), 'yyyy/MM/dd'), 20, 287);
  }

  // 最終ページに備考セクションを追加
  doc.setPage(pageCount);
  if (yPos < 240) {
    yPos += 10;
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    drawJapaneseText(doc, '【備考】', 20, yPos, { fontSize: 12, maxWidth: 170 });
    yPos += 8;

    if (failPoints > 0) {
      drawJapaneseText(doc, `※ 異常が検出された設備が ${failPoints}件 あります。速やかな対応が必要です。`, 20, yPos, { fontSize: 9, maxWidth: 170 });
      yPos += 6;
    }

    if (conflictPoints > 0) {
      drawJapaneseText(doc, `※ 競合が検出された記録が ${conflictPoints}件 あります。内容を確認し、正しい記録を選択してください。`, 20, yPos, { fontSize: 9, maxWidth: 170 });
      yPos += 6;
    }

    if (uninspectedPoints > 0) {
      drawJapaneseText(doc, `※ 未点検の設備が ${uninspectedPoints}件 残っています。`, 20, yPos, { fontSize: 9, maxWidth: 170 });
    }
  }

  // PDFをダウンロード
  const fileYearMonth = format(new Date(event.startDate), 'yyyyMM', { locale: ja });
  const fileName = `消防設備点検報告書_${project.customerName}_${fileYearMonth}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};
