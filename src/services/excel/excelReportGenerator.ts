import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import {
  InspectionEvent,
  InspectionResult,
  InspectionPoint,
  Project,
} from '@/types';

export interface ExcelReportData {
  project: Project;
  event: InspectionEvent;
  points: InspectionPoint[];
  results: InspectionResult[];
}

/**
 * Excel形式の点検報告書を生成
 *
 * 注意: この関数を使用する前に、以下の準備が必要です：
 * 1. public/templates/ に Excelテンプレートを配置
 * 2. テンプレート内にプレースホルダーを設定（後述）
 */
export const generateExcelReport = async (
  data: ExcelReportData
): Promise<void> => {
  const { project, event } = data;

  try {
    // テンプレートファイルを読み込み
    const templatePath = '/templates/消火器点検票.xlsx';
    const response = await fetch(templatePath);

    if (!response.ok) {
      throw new Error(
        `テンプレートファイルが見つかりません: ${templatePath}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    // ExcelJSでワークブックを読み込み
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // 最初のシートを取得
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('ワークシートが見つかりません');
    }

    // データをシートに埋め込む
    fillTemplateData(worksheet, data);

    // Blobを生成
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // ファイル名を生成
    const eventYearMonth = format(
      new Date(event.startDate),
      'yyyyMM',
      { locale: ja }
    );
    const fileName = `点検票_${project.customerName}_${eventYearMonth}_${format(new Date(), 'yyyyMMdd')}.xlsx`;

    // ダウンロード
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Excel報告書生成エラー:', error);
    throw new Error(
      'Excel報告書の生成に失敗しました。テンプレートファイルの配置を確認してください。'
    );
  }
};

/**
 * テンプレートにデータを埋め込む
 */
function fillTemplateData(
  worksheet: ExcelJS.Worksheet,
  data: ExcelReportData
): void {
  const { project, event, points, results } = data;

  // 設備タイプの日本語名
  const equipmentTypeMap: Record<string, string> = {
    fire_extinguisher: '消火器',
    smoke_sensor: '煙感知器',
    heat_sensor: '熱感知器',
    sprinkler: 'スプリンクラー',
    fire_door: '防火扉',
    indoor_hydrant: '屋内消火栓',
    emergency_light: '誘導灯',
    fire_alarm: '自動火災報知設備',
    other: 'その他',
  };

  // 点検結果のステータスを取得
  const getResultStatus = (pointId: string): string => {
    const result = results.find((r) => r.pointId === pointId);
    if (!result || result.status === 'uninspected') {
      return '未点検';
    }
    return result.status === 'ok' ? '○' : '×';
  };

  // 点検記録の詳細を取得
  const getResultNotes = (pointId: string): string => {
    const result = results.find((r) => r.pointId === pointId);
    if (!result || result.records.length === 0) {
      return '';
    }

    return result.records
      .flatMap((record) =>
        record.itemResults
          .filter((item) => item.notes)
          .map(
            (item) =>
              `${record.userName} (${format(new Date(record.timestamp), 'yyyy/MM/dd HH:mm', { locale: ja })}): ${item.notes}`
          )
      )
      .join('\n');
  };

  // セルマッピング（テンプレートのセル位置に合わせて調整してください）
  // 例: A1セルに案件名、B1セルに住所、など
  const cellMapping: Record<string, string | number> = {
    // 基本情報
    customerName: project.customerName,
    address: project.address,
    year: format(new Date(event.startDate), 'yyyy年MM月', { locale: ja }),
    inspectorName: event.inspectorName,
    inspectionDate: format(
      new Date(event.startDate),
      'yyyy年MM月dd日',
      { locale: ja }
    ),
    reportCreatedDate: format(new Date(), 'yyyy年MM月dd日', { locale: ja }),

    // サマリー情報
    totalPoints: points.length,
    inspectedPoints: results.filter((r) => r.status !== 'uninspected').length,
    okPoints: results.filter((r) => r.status === 'ok').length,
    failPoints: results.filter((r) => r.status === 'fail').length,
    uninspectedPoints:
      points.length - results.filter((r) => r.status !== 'uninspected').length,
  };

  // セル内のプレースホルダーを置換
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      if (typeof cell.value === 'string') {
        let value = cell.value;

        // プレースホルダーを置換 {変数名} -> 実際の値
        Object.entries(cellMapping).forEach(([key, val]) => {
          value = value.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
        });

        cell.value = value;
      }
    });
  });

  // 点検詳細を追加（行を動的に追加）
  // 開始行を指定（テンプレートに合わせて調整）
  const startRow = 10; // 例: 10行目から点検項目を記載

  points.forEach((point, index) => {
    const rowNum = startRow + index;
    const row = worksheet.getRow(rowNum);

    // 各列にデータを設定（テンプレートの列に合わせて調整）
    row.getCell(1).value = index + 1; // No.
    row.getCell(2).value = equipmentTypeMap[point.type] || point.type; // 種類
    row.getCell(3).value = point.name; // 設備名
    row.getCell(4).value = getResultStatus(point.id); // 結果
    row.getCell(5).value = getResultNotes(point.id); // 備考

    row.commit();
  });
}
