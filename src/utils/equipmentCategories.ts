import { EquipmentCategoryInfo, EquipmentType } from '@/types';

/**
 * 設備カテゴリーの定義
 */
export const EQUIPMENT_CATEGORIES: EquipmentCategoryInfo[] = [
  {
    id: 'sensor',
    label: '🔥 感知器',
    icon: '🔥',
    equipmentTypes: [
      'heat_sensor_2',
      'heat_sensor_3',
      'fire_alarm_waterproof',
      'fire_alarm_2',
      'fire_alarm_special',
    ],
  },
  {
    id: 'control',
    label: '🎛️ 受信機・制御盤',
    icon: '🎛️',
    equipmentTypes: ['receiver', 'sub_receiver', 'fire_door'],
  },
  {
    id: 'alarm',
    label: '📢 警報設備',
    icon: '📢',
    equipmentTypes: [
      'bell',
      'siren',
      'speaker',
      'indicator',
      'emergency_alarm',
      'p_transmitter',
    ],
  },
  {
    id: 'fire_fighting',
    label: '🧯 消火設備',
    icon: '🧯',
    equipmentTypes: ['fire_extinguisher', 'indoor_hydrant'],
  },
  {
    id: 'evacuation',
    label: '💡 避難設備',
    icon: '💡',
    equipmentTypes: ['emergency_light', 'emergency_light_arrow'],
  },
];

/**
 * 設備タイプからカテゴリーを取得
 */
export const getEquipmentCategory = (
  equipmentType: EquipmentType
): EquipmentCategoryInfo | undefined => {
  return EQUIPMENT_CATEGORIES.find((category) =>
    category.equipmentTypes.includes(equipmentType)
  );
};

/**
 * カテゴリーIDからカテゴリー情報を取得
 */
export const getCategoryById = (
  categoryId: string
): EquipmentCategoryInfo | undefined => {
  return EQUIPMENT_CATEGORIES.find((category) => category.id === categoryId);
};
