// User types
export type UserRole = 'admin' | 'inspector' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  companyId: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  devices: Device[];
  createdAt: Date;
  createdBy: string;
  lastLogin: Date | null;
}

export interface Device {
  deviceId: string;
  lastUsed: Date;
}

// Company types
export interface Company {
  id: string;
  name: string;
  address: string;
  adminUsers: string[];
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Project types
export interface Project {
  id: string;
  customerName: string;
  address: string;
  companyId: string;
  nextInspectionDate?: Date; // 次回点検予定日
  lastInspectionDate?: Date; // 最終点検日（完了した点検イベントの最新日）
  deleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Drawing types
export interface Drawing {
  id: string;
  projectId: string;
  pdfName: string;
  pdfStoragePath: string;
  pageNumber: number;
  displayOrder: number;
  storagePath: string;
  deleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
}

// Inspection Point types
export type EquipmentType =
  | 'heat_sensor_2'        // 煙感知器2種
  | 'heat_sensor_3'        // 煙感知器3種
  | 'fire_extinguisher'    // 消火器
  | 'indoor_hydrant'       // 屋内消火栓（アラム弁）
  | 'fire_door'            // 分電盤
  | 'emergency_light'      // 誘導灯
  | 'emergency_light_arrow' // 誘導灯（矢印あり）
  | 'fire_alarm_waterproof' // 火災報知器（防水）
  | 'fire_alarm_2'         // 火災報知器2種
  | 'fire_alarm_special'   // 火災報知器特種
  | 'emergency_alarm'      // 非常警報装置
  | 'receiver'             // 受信機
  | 'sub_receiver'         // 副受信機
  | 'p_transmitter'        // P型発信機
  | 'bell'                 // ベル
  | 'siren'                // サイレン
  | 'speaker'              // スピーカー
  | 'indicator';           // 表示灯

export type EquipmentCategory = 'sensor' | 'control' | 'alarm' | 'fire_fighting' | 'evacuation';

export interface EquipmentCategoryInfo {
  id: EquipmentCategory;
  label: string;
  icon: string;
  equipmentTypes: EquipmentType[];
}

export interface InspectionItem {
  itemName: string;
  required: boolean;
}

export interface InspectionPoint {
  id: string;
  drawingId: string;
  x: number;
  y: number;
  type: EquipmentType;
  name: string;
  inspectionItems: InspectionItem[];
  deleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Inspection Event types
export interface InspectionEvent {
  id: string;
  projectId: string;
  year: number;
  inspectorName: string;
  startDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  deleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Inspection Result types
export type InspectionStatus = 'ok' | 'fail' | 'uninspected';
export type InputMethod = 'voice' | 'manual';

export interface ItemResult {
  itemName: string;
  status: InspectionStatus;
  notes: string;
}

export interface InspectionRecord {
  userId: string;
  userName: string;
  deviceId: string;
  inputMethod: InputMethod;
  itemResults: ItemResult[];
  photos: string[];
  timestamp: Date;
  deleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface InspectionResult {
  id: string;
  eventId: string;
  pointId: string;
  status: InspectionStatus;
  records: InspectionRecord[];
  hasConflict: boolean;
  isResolved: boolean;
  lastUpdated: Date;
}

// Auth types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}
