import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { InspectionEvent, InspectionResult, InspectionPoint, Project } from '@/types';

export interface WordReportData {
  project: Project;
  event: InspectionEvent;
  points: InspectionPoint[];
  results: InspectionResult[];
}

/**
 * Word形式の点検報告書を生成
 *
 * 注意: この関数を使用する前に、以下の準備が必要です：
 * 1. tenkenhyou01.doc を tenkenhyou01.docx に変換
 * 2. テンプレート内にプレースホルダーを設定
 *    例: {customerName}, {address}, {year}, {inspectorName} など
 * 3. public/templates/tenkenhyou01.docx として配置
 */
export const generateWordReport = async (
  data: WordReportData
): Promise<void> => {
  const { project, event, points, results } = data;

  try {
    // テンプレートファイルを読み込み
    const templatePath = '/templates/tenkenhyou01.docx';
    const response = await fetch(templatePath);

    if (!response.ok) {
      throw new Error(`テンプレートファイルが見つかりません: ${templatePath}`);
    }

    const templateBuffer = await response.arrayBuffer();

    // PizZipでZIP形式として読み込み
    const zip = new PizZip(templateBuffer);

    // Docxtemplaterインスタンスを作成
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // 点検結果のステータスを取得
    const getResultStatus = (pointId: string): string => {
      const result = results.find((r) => r.pointId === pointId);
      if (!result || result.status === 'uninspected') {
        return '未点検';
      }
      return result.status === 'ok' ? '正常' : '異常';
    };

    // 点検記録の詳細を取得
    const getResultNotes = (pointId: string): string => {
      const result = results.find((r) => r.pointId === pointId);
      if (!result || result.records.length === 0) {
        return '';
      }

      // すべてのレコードのメモを結合
      return result.records
        .flatMap((record) =>
          record.itemResults
            .filter((item) => item.notes)
            .map((item) => `${record.userName} (${format(new Date(record.timestamp), 'yyyy/MM/dd HH:mm', { locale: ja })}): ${item.notes}`)
        )
        .join('\n');
    };

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

    // テンプレートに挿入するデータを準備
    const templateData = {
      // 基本情報
      customerName: project.customerName,
      address: project.address,
      year: format(new Date(event.startDate), 'yyyy年MM月', { locale: ja }),
      inspectorName: event.inspectorName,
      inspectionDate: format(new Date(event.startDate), 'yyyy年MM月dd日', { locale: ja }),
      reportCreatedDate: format(new Date(), 'yyyy年MM月dd日', { locale: ja }),

      // サマリー情報
      totalPoints: points.length,
      inspectedPoints: results.filter((r) => r.status !== 'uninspected').length,
      okPoints: results.filter((r) => r.status === 'ok').length,
      failPoints: results.filter((r) => r.status === 'fail').length,
      uninspectedPoints: points.length - results.filter((r) => r.status !== 'uninspected').length,

      // 点検詳細（繰り返し処理用）
      points: points.map((point) => ({
        name: point.name,
        type: equipmentTypeMap[point.type] || point.type,
        status: getResultStatus(point.id),
        notes: getResultNotes(point.id),
        hasConflict: results.find((r) => r.pointId === point.id)?.hasConflict || false,
      })),
    };

    // データをテンプレートに注入
    doc.setData(templateData);

    // レンダリング実行
    doc.render();

    // 出力用のBlobを生成
    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // ファイル名を生成してダウンロード
    const eventYearMonth = format(
      new Date(event.startDate),
      'yyyyMM',
      { locale: ja }
    );
    const fileName = `点検票_${project.customerName}_${eventYearMonth}_${format(new Date(), 'yyyyMMdd')}.docx`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Word報告書生成エラー:', error);
    throw new Error('Word報告書の生成に失敗しました。テンプレートファイルの配置やプレースホルダーの設定を確認してください。');
  }
};
