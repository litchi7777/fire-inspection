import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  ClipboardCheck,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  WifiOff,
  Wifi,
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useDrawingStore } from '@/stores/useDrawingStore';
import { useInspectionEventStore } from '@/stores/useInspectionEventStore';
import { useInspectionPointStore } from '@/stores/useInspectionPointStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { getFileURL } from '@/services/firebase/storage';
import { saveInspectionResultOffline, getInspectionResultsOffline } from '@/services/firebase/offlineFirestore';
import { uploadBase64Photo } from '@/services/firebase/storage';
import { deleteInspectionRecord } from '@/services/firebase/firestore';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { isOnline } from '@/services/sync/syncService';
import { Header } from '@/components/common/Header';
import { InspectionRecordModal } from './InspectionRecordModal';
import { EquipmentType, InspectionPoint, InspectionResult } from '@/types';
import { EQUIPMENT_CATEGORIES, getCategoryById } from '@/utils/equipmentCategories';

type Mode = 'edit' | 'inspect';

const equipmentTypes: Array<{
  type: EquipmentType;
  label: string;
  iconPath: string;
  color: string;
}> = [
  { type: 'heat_sensor_2', label: '煙感2種', iconPath: '/icons/kemurikanchiki_2shu.svg', color: 'gray' },
  { type: 'heat_sensor_3', label: '煙感3種', iconPath: '/icons/kemurikanchiki_3shu.svg', color: 'gray' },
  { type: 'fire_extinguisher', label: '消火器', iconPath: '/icons/syoukaki.svg', color: 'red' },
  { type: 'indoor_hydrant', label: 'アラーム弁', iconPath: '/icons/ara-muben.svg', color: 'blue' },
  { type: 'fire_door', label: '分電盤', iconPath: '/icons/bundenban.svg', color: 'green' },
  { type: 'emergency_light', label: '誘導灯', iconPath: '/icons/yuudoutou.svg', color: 'yellow' },
  { type: 'emergency_light_arrow', label: '矢印誘導灯', iconPath: '/icons/yuudoutou_yazirushiari.svg', color: 'yellow' },
  { type: 'fire_alarm_waterproof', label: '火報（防水）', iconPath: '/icons/kasaihouchiki_bousui.svg', color: 'red' },
  { type: 'fire_alarm_2', label: '火報2種', iconPath: '/icons/kasaihouchiki_nishu.svg', color: 'red' },
  { type: 'fire_alarm_special', label: '火報特種', iconPath: '/icons/kasaihouchiki_tokushu.svg', color: 'red' },
  { type: 'emergency_alarm', label: '非常警報', iconPath: '/icons/hizyoukeihousouchi.svg', color: 'orange' },
  { type: 'receiver', label: '受信機', iconPath: '/icons/jushinki.svg', color: 'blue' },
  { type: 'sub_receiver', label: '副受信機', iconPath: '/icons/hukujushinki.svg', color: 'blue' },
  { type: 'p_transmitter', label: 'P型発信機', iconPath: '/icons/pgata_hassinki.svg', color: 'red' },
  { type: 'bell', label: 'ベル', iconPath: '/icons/beru.svg', color: 'orange' },
  { type: 'siren', label: 'サイレン', iconPath: '/icons/sairen.svg', color: 'orange' },
  { type: 'speaker', label: 'スピーカー', iconPath: '/icons/speaker.svg', color: 'blue' },
  { type: 'indicator', label: '表示灯', iconPath: '/icons/hyojito.svg', color: 'yellow' },
];

export const InspectionScreen = (): JSX.Element => {
  const navigate = useNavigate();
  const { projectId, eventId } = useParams<{
    projectId: string;
    eventId: string;
  }>();

  const { drawings, fetchDrawings } = useDrawingStore();
  const { currentEvent, fetchEvent } = useInspectionEventStore();
  const { points, fetchPoints, createPoint, updatePoint, deletePoint } = useInspectionPointStore();
  const { user } = useAuthStore();

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [mode, setMode] = useState<Mode>('inspect');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEquipmentType, setSelectedEquipmentType] =
    useState<EquipmentType | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<InspectionPoint | null>(
    null
  );
  const [selectedPointForEdit, setSelectedPointForEdit] = useState<string | null>(null);
  const [draggedEquipmentType, setDraggedEquipmentType] =
    useState<EquipmentType | null>(null);
  const [draggedPoint, setDraggedPoint] = useState<InspectionPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [pointToDelete, setPointToDelete] = useState<InspectionPoint | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [inspectionResults, setInspectionResults] = useState<InspectionResult[]>([]);
  const [online, setOnline] = useState(isOnline());
  const imageRef = useRef<HTMLImageElement>(null);

  // オンライン状態の監視
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (projectId && eventId) {
      fetchDrawings(projectId);
      fetchEvent(eventId);

      // リアルタイム同期のセットアップ
      const unsubscribe = setupRealtimeSync();

      return () => {
        // クリーンアップ
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [projectId, eventId]);

  const setupRealtimeSync = () => {
    if (!projectId || !eventId) return;

    // オフライン対応: IndexedDBから初期データを読み込み
    const loadOfflineResults = async () => {
      try {
        const results = await getInspectionResultsOffline(projectId, eventId);
        setInspectionResults(results);
      } catch (error) {
        console.error('オフラインデータ読み込みエラー:', error);
      }
    };

    // 初期データ読み込み
    loadOfflineResults();

    // オンライン時のみFirestoreのリアルタイム監視を設定
    if (!isOnline()) {
      console.log('オフラインモード: リアルタイム同期は無効');
      return undefined;
    }

    // Firestore onSnapshotでリアルタイム監視
    const resultsRef = collection(
      db,
      `projects/${projectId}/inspectionEvents/${eventId}/results`
    );

    const unsubscribe = onSnapshot(resultsRef, (snapshot) => {
      const results: InspectionResult[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          eventId: data.eventId || eventId,
          pointId: data.pointId || doc.id,
          status: data.status || 'uninspected',
          hasConflict: data.hasConflict || false,
          isResolved: data.isResolved || false,
          records: data.records?.map((record: any) => ({
            ...record,
            timestamp: record.timestamp?.toDate() || new Date(),
          })) || [],
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        } as InspectionResult;
      });

      setInspectionResults(results);
    }, (error) => {
      console.error('リアルタイム同期エラー:', error);
      // エラー時はオフラインデータにフォールバック
      loadOfflineResults();
    });

    return unsubscribe;
  };

  const currentDrawing = drawings[currentPageIndex];

  useEffect(() => {
    const loadImage = async () => {
      if (currentDrawing?.storagePath) {
        try {
          const url = await getFileURL(currentDrawing.storagePath);
          setImageUrl(url);
        } catch (error) {
          console.error('画像読み込みエラー:', error);
        }
      }
    };

    if (currentDrawing && projectId) {
      loadImage();
      fetchPoints(projectId, currentDrawing.id);
    }
  }, [currentDrawing, projectId]);

  const handleBack = (): void => {
    navigate(`/projects/${projectId}/events/${eventId}`);
  };

  const handlePrevPage = (): void => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleNextPage = (): void => {
    if (currentPageIndex < drawings.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handleDragStart = (e: React.DragEvent, equipmentType: EquipmentType) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEquipmentType(equipmentType);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (mode !== 'edit' || !currentDrawing || !projectId) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    try {
      if (draggedPoint) {
        // 既存ポイントの移動
        await updatePoint(projectId, currentDrawing.id, draggedPoint.id, { x, y });
        setDraggedPoint(null);
      } else if (draggedEquipmentType) {
        // 新規ポイントの作成
        const pointName = `${equipmentTypes.find((t) => t.type === draggedEquipmentType)?.label || '設備'} ${points.length + 1}`;
        await createPoint(projectId, currentDrawing.id, {
          x,
          y,
          type: draggedEquipmentType,
          name: pointName,
        });
        setDraggedEquipmentType(null);
      }
    } catch (error) {
      console.error('ドロップ処理エラー:', error);
    }
  };

  // タッチイベント：設備ボタンのタッチ開始
  const handleEquipmentTouchStart = (e: React.TouchEvent, equipmentType: EquipmentType) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setDraggedEquipmentType(equipmentType);
  };

  const handleEquipmentTouchEnd = () => {
    setTouchStartPos(null);
  };

  // タッチイベント：画像上でのタッチ移動（スクロール防止）
  const handleImageTouchMove = (e: React.TouchEvent) => {
    if (draggedEquipmentType || draggedPoint) {
      e.preventDefault();
    }
  };

  // タッチイベント：画像上でのタッチ終了（ドロップ処理）
  const handleImageTouchEnd = async (e: React.TouchEvent) => {
    if (!draggedEquipmentType && !draggedPoint) return;
    if (mode !== 'edit' || !currentDrawing || !projectId) return;

    const touch = e.changedTouches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;

    try {
      if (draggedPoint) {
        await updatePoint(projectId, currentDrawing.id, draggedPoint.id, { x, y });
        setDraggedPoint(null);
        setSelectedPointForEdit(null);
      } else if (draggedEquipmentType) {
        const pointName = `${equipmentTypes.find((t) => t.type === draggedEquipmentType)?.label || '設備'} ${points.length + 1}`;
        await createPoint(projectId, currentDrawing.id, {
          x,
          y,
          type: draggedEquipmentType,
          name: pointName,
        });
        setDraggedEquipmentType(null);
      }
    } catch (error) {
      console.error('タッチドロップ処理エラー:', error);
    } finally {
      setTouchStartPos(null);
      setIsDragging(false);
    }
  };

  // タッチイベント：既存アイコンのタッチ開始
  const handlePointTouchStart = (e: React.TouchEvent, point: InspectionPoint) => {
    if (mode === 'edit') {
      if (selectedPointForEdit === point.id) {
        // 選択済みの場合：ドラッグ準備と長押し検出
        const touch = e.touches[0];
        setTouchStartPos({ x: touch.clientX, y: touch.clientY });
        setDraggedPoint(point);

        // 長押し検出（500ms）
        const timer = setTimeout(() => {
          setPointToDelete(point);
          setDraggedPoint(null);
          setTouchStartPos(null);
        }, 500);
        setLongPressTimer(timer);

        e.stopPropagation();
      }
    }
  };

  // タッチイベント：既存アイコンのタッチ移動
  const handlePointTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer && touchStartPos) {
      const touch = e.touches[0];
      const moveDistance = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.x, 2) +
        Math.pow(touch.clientY - touchStartPos.y, 2)
      );

      // 10px以上動いたら長押しキャンセル、ドラッグ開始
      if (moveDistance > 10) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
        setIsDragging(true);
      }
    }
  };

  // タッチイベント：既存アイコンのタッチ終了
  const handlePointTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (mode !== 'edit' || !currentDrawing || !projectId || !selectedEquipmentType) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const pointName = `${equipmentTypes.find((t) => t.type === selectedEquipmentType)?.label || '設備'} ${points.length + 1}`;

    try {
      await createPoint(projectId, currentDrawing.id, {
        x,
        y,
        type: selectedEquipmentType,
        name: pointName,
      });
    } catch (error) {
      console.error('ポイント作成エラー:', error);
    }
  };

  // タッチイベント：画像のタッチでアイコン配置
  const handleImageTouch = async (e: React.TouchEvent<HTMLImageElement>) => {
    if (mode !== 'edit' || !currentDrawing || !projectId || !selectedEquipmentType) {
      return;
    }

    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;

    const pointName = `${equipmentTypes.find((t) => t.type === selectedEquipmentType)?.label || '設備'} ${points.length + 1}`;

    try {
      await createPoint(projectId, currentDrawing.id, {
        x,
        y,
        type: selectedEquipmentType,
        name: pointName,
      });
    } catch (error) {
      console.error('ポイント作成エラー:', error);
    }
  };

  const handleDeletePoint = async () => {
    if (!pointToDelete || !projectId || !currentDrawing) return;

    try {
      await deletePoint(projectId, currentDrawing.id, pointToDelete.id);
      setPointToDelete(null);
      setSelectedPointForEdit(null);
    } catch (error) {
      console.error('ポイント削除エラー:', error);
    }
  };

  const getEquipmentIcon = (type: EquipmentType) => {
    const equipment = equipmentTypes.find((e) => e.type === type);
    return equipment || equipmentTypes[0];
  };

  const getPointInspectionStatus = (pointId: string) => {
    const result = inspectionResults.find((r) => r.pointId === pointId);
    if (!result) {
      return { status: 'uninspected', hasConflict: false };
    }
    return {
      status: result.status,
      hasConflict: result.hasConflict,
    };
  };

  if (drawings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">図面がありません</p>
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-700"
          >
            点検イベント詳細に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header
        title={`点検作業 - ${currentEvent?.year || ''}年度`}
        subtitle={`${currentDrawing?.pdfName || ''} (${currentPageIndex + 1}/${drawings.length})`}
        onBack={handleBack}
        backLabel="点検イベント詳細に戻る"
      />

      {/* ツールバー */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* ページ切り替え */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              className="p-2 text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white text-sm px-3">
              {currentPageIndex + 1} / {drawings.length}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPageIndex === drawings.length - 1}
              className="p-2 text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* オンライン状態とモード切り替え */}
          <div className="flex items-center gap-2">
            {/* オンライン状態インジケーター */}
            <div className={`flex items-center gap-1 px-3 py-1 rounded text-xs ${
              online ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
            }`}>
              {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{online ? 'オンライン' : 'オフライン'}</span>
            </div>

            <button
              onClick={() => {
                setMode('edit');
                setSelectedEquipmentType(null);
                setSelectedPointForEdit(null);
              }}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                mode === 'edit'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Edit className="w-4 h-4" />
              編集
            </button>
            <button
              onClick={() => {
                setMode('inspect');
                setSelectedEquipmentType(null);
                setSelectedPointForEdit(null);
              }}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                mode === 'inspect'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              点検
            </button>
          </div>
        </div>

        {/* 編集モード時の設備選択（2段階） */}
        {mode === 'edit' && (
          <div className="mt-3 space-y-2">
            {/* カテゴリー選択 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {EQUIPMENT_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedEquipmentType(null);
                  }}
                  className={`px-3 py-2 rounded whitespace-nowrap border ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category.label.replace(/^[^\s]+\s/, '')}
                </button>
              ))}
            </div>

            {/* 設備選択 */}
            {selectedCategory && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {getCategoryById(selectedCategory)?.equipmentTypes.map((type) => {
                  const equipment = equipmentTypes.find((e) => e.type === type);
                  if (!equipment) return null;
                  return (
                    <button
                      key={equipment.type}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, equipment.type)}
                      onTouchStart={(e) => handleEquipmentTouchStart(e, equipment.type)}
                      onTouchEnd={handleEquipmentTouchEnd}
                      onClick={() => setSelectedEquipmentType(equipment.type)}
                      className={`px-3 py-2 rounded flex items-center gap-2 whitespace-nowrap cursor-move ${
                        selectedEquipmentType === equipment.type
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <img src={equipment.iconPath} alt={equipment.label} className="w-6 h-6" />
                      {equipment.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 図面表示エリア */}
      <div className="flex-1 relative overflow-hidden">
        {mode === 'edit' ? (
          // 編集モード: ズーム無効、ドラッグアンドドロップ有効
          <div className="relative w-full h-full overflow-auto">
            <div className="relative w-full h-full flex items-center justify-center p-4">
                  {imageUrl && (
                    <div
                      className="relative inline-block"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onTouchMove={handleImageTouchMove}
                      onTouchEnd={handleImageTouchEnd}
                      style={{
                        cursor: mode === 'edit' ? 'crosshair' : 'default',
                      }}
                    >
                      <img
                        ref={imageRef}
                        src={imageUrl}
                        alt={currentDrawing?.pdfName}
                        className="max-w-full max-h-full object-contain"
                        onClick={handleImageClick}
                        onTouchStart={handleImageTouch}
                        style={{ display: 'block' }}
                      />

                      {/* 配置済みポイント表示 */}
                      {points.map((point) => {
                        const equipment = getEquipmentIcon(point.type);
                        const { status, hasConflict } = getPointInspectionStatus(point.id);
                        return (
                          <div
                            key={point.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                            style={{
                              left: `${point.x}%`,
                              top: `${point.y}%`,
                            }}
                            draggable={mode === 'edit' && selectedPointForEdit === point.id}
                            onDragStart={(e) => {
                              if (mode === 'edit' && selectedPointForEdit === point.id) {
                                e.dataTransfer.effectAllowed = 'move';
                                setDraggedPoint(point);
                                setIsDragging(true);
                              } else {
                                e.preventDefault();
                              }
                            }}
                            onDragEnd={() => {
                              if (draggedPoint) {
                                setSelectedPointForEdit(null);
                              }
                              setIsDragging(false);
                            }}
                            onTouchStart={(e) => handlePointTouchStart(e, point)}
                            onTouchMove={handlePointTouchMove}
                            onTouchEnd={handlePointTouchEnd}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDragging) {
                                return;
                              }
                              if (mode === 'edit') {
                                if (selectedPointForEdit === point.id) {
                                  return;
                                }
                                setSelectedPointForEdit(point.id);
                              } else if (mode === 'inspect') {
                                setSelectedPoint(point);
                              }
                            }}
                            onDoubleClick={(e) => {
                              if (mode === 'edit') {
                                e.stopPropagation();
                                if (selectedPointForEdit === point.id) {
                                  setPointToDelete(point);
                                } else {
                                  setSelectedPointForEdit(null);
                                }
                              }
                            }}
                          >
                            <div className="relative">
                              <div
                                className={`transition-transform ${
                                  mode === 'edit' && selectedPointForEdit === point.id
                                    ? 'ring-4 ring-blue-500 ring-offset-2 scale-110'
                                    : 'hover:scale-110'
                                }`}
                                style={{
                                  cursor: mode === 'edit' ? (selectedPointForEdit === point.id ? 'move' : 'pointer') : 'pointer',
                                  userSelect: 'none',
                                  pointerEvents: 'none',
                                }}
                              >
                                <img
                                  src={equipment.iconPath}
                                  alt={equipment.label}
                                  className="w-12 h-12 drop-shadow-lg"
                                  style={{
                                    filter: mode === 'edit' && selectedPointForEdit === point.id
                                      ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
                                      : status === 'ok'
                                      ? 'drop-shadow(0 0 4px rgba(34, 197, 94, 1)) brightness(1.3)'
                                      : status === 'fail'
                                      ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 1)) brightness(1.3)'
                                      : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
                                  }}
                                />
                              </div>
                              {/* 競合マーク */}
                              {hasConflict && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 border-2 border-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                  <AlertTriangle className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
            </div>
          </div>
        ) : (
          // 閲覧・点検モード: ズーム有効
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit
            wheel={{ disabled: true }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* ズームコントロール */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                  <button
                    onClick={() => zoomIn()}
                    className="p-2 bg-white rounded shadow hover:bg-gray-100"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className="p-2 bg-white rounded shadow hover:bg-gray-100"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="p-2 bg-white rounded shadow hover:bg-gray-100"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                <TransformComponent
                  wrapperStyle={{
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    {imageUrl && (
                      <div className="relative inline-block">
                        <img
                          ref={imageRef}
                          src={imageUrl}
                          alt={currentDrawing?.pdfName}
                          className="max-w-full max-h-full object-contain"
                        />

                        {/* 配置済みポイント表示 */}
                        {points.map((point) => {
                          const equipment = getEquipmentIcon(point.type);
                          const { status, hasConflict } = getPointInspectionStatus(point.id);
                          return (
                            <div
                              key={point.id}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2"
                              style={{
                                left: `${point.x}%`,
                                top: `${point.y}%`,
                                cursor: mode === 'inspect' ? 'pointer' : 'default',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (mode === 'inspect') {
                                  setSelectedPoint(point);
                                }
                              }}
                            >
                              <div className="relative">
                                <div className="transition-transform hover:scale-110">
                                  <img
                                    src={equipment.iconPath}
                                    alt={equipment.label}
                                    className="w-12 h-12 drop-shadow-lg"
                                    style={{
                                      filter: status === 'ok'
                                        ? 'drop-shadow(0 0 4px rgba(34, 197, 94, 1)) brightness(1.3)'
                                        : status === 'fail'
                                        ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 1)) brightness(1.3)'
                                        : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
                                    }}
                                  />
                                </div>
                                {/* 競合マーク */}
                                {hasConflict && (
                                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 border-2 border-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                    <AlertTriangle className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}
      </div>

      {/* ステータスバー */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-300">
          <div>
            {mode === 'edit' && (
              <span>
                {selectedPointForEdit
                  ? '選択中のアイコンをドラッグして移動 / ダブルクリック（長押し）で削除'
                  : selectedEquipmentType
                  ? '図面をクリック（タップ）またはドラッグ＆ドロップで設備を配置'
                  : '設備ボタンを選択してから図面上に配置してください'}
              </span>
            )}
            {mode === 'inspect' && (
              <span>設備アイコンをクリックして点検を記録してください</span>
            )}
          </div>
          <div>配置済み: {points.length}件</div>
        </div>
      </div>

      {/* 点検記録モーダル */}
      {selectedPoint && (
        <InspectionRecordModal
          point={selectedPoint}
          projectId={projectId}
          pointId={selectedPoint.id}
          currentYear={currentEvent?.year}
          eventId={eventId}
          onClose={() => setSelectedPoint(null)}
          onSave={async (data) => {
            if (!projectId || !eventId || !user) {
              console.error('点検結果保存エラー: 必要な情報が不足しています');
              return;
            }

            try {
              // デバイスIDを取得（MACアドレス相当）
              const deviceId = user.devices?.[0]?.deviceId || 'unknown-device';

              // 写真をアップロード（オンライン時のみ）
              let photoUrls: string[] = [];
              if (data.photos.length > 0 && isOnline()) {
                photoUrls = await Promise.all(
                  data.photos.map(async (photo) => {
                    try {
                      return await uploadBase64Photo(projectId, eventId, selectedPoint.id, photo);
                    } catch (error) {
                      console.error('写真アップロードエラー:', error);
                      return '';
                    }
                  })
                );
                // エラーでアップロードできなかった写真を除外
                photoUrls = photoUrls.filter((url) => url !== '');
              }

              // InspectionRecordデータを構築
              const recordData = {
                userId: user.id,
                userName: user.name,
                deviceId,
                inputMethod: 'manual' as const,
                itemResults: [
                  {
                    itemName: '点検結果',
                    status: data.status,
                    notes: data.notes,
                  },
                ],
                photos: photoUrls,
                deleted: false,
              };

              // オフライン対応の保存関数を使用
              await saveInspectionResultOffline(projectId, eventId, selectedPoint.id, recordData);

              // オフライン時はIndexedDBから最新データを再読み込み
              if (!isOnline()) {
                const results = await getInspectionResultsOffline(projectId, eventId);
                setInspectionResults(results);
              }

              setSelectedPoint(null);
            } catch (error) {
              console.error('点検結果保存エラー:', error);
              alert('点検結果の保存に失敗しました');
            }
          }}
          onDeleteRecord={async (deleteEventId: string, recordIndex: number) => {
            if (!projectId || !selectedPoint || !user) {
              console.error('点検記録削除エラー: 必要な情報が不足しています');
              return;
            }

            try {
              await deleteInspectionRecord(projectId, deleteEventId, selectedPoint.id, recordIndex, user.id);

              // 削除後、点検結果を再読み込み
              if (!isOnline()) {
                const results = await getInspectionResultsOffline(projectId, eventId!);
                setInspectionResults(results);
              }
            } catch (error) {
              console.error('点検記録削除エラー:', error);
              alert('点検記録の削除に失敗しました');
            }
          }}
        />
      )}

      {/* 削除確認モーダル */}
      {pointToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              設備を削除しますか？
            </h3>
            <div className="mb-6 space-y-3">
              <p className="text-gray-600">
                {pointToDelete.name} を削除します。この操作は取り消せません。
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">警告</p>
                    <p>この設備の点検履歴（すべての年度）も削除されます。</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPointToDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeletePoint}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
