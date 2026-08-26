// Barrel re-export dữ liệu dinh dưỡng — import gọn từ '@/lib/nutrition'.
export * from './foods-data'
export * from './meals-data'
export * from './nutrient-reference-data'
export * from './weekly-focus-data'
export * from './food-safety-data'
export * from './supplement-data'
export * from './supplement-plan'

// Tên trùng giữa các module bị `export *` bỏ qua (ambiguous) → re-export tường minh.
// `Citation` giống hệt nhau ở 4 file; `Trimester` ở meals-data ('1'|'2'|'3') khác
// với bản 'T1'|'T2'|'T3' ở nutrient-reference/weekly-focus/food-safety.
export type { Citation } from './food-safety-data'
export type { Trimester } from './meals-data'
