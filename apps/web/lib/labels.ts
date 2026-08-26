// Nhãn tiếng Việt cho enum domain (core.ts đã có, schema entity do Agent 2 thêm).
import {
  BIRTH_TYPES,
  MEAL_TYPES,
  MEASUREMENT_TYPES,
  SYMPTOM_SEVERITIES,
  FETAL_MOVEMENT_FEELINGS,
  APPOINTMENT_TYPES,
  DIAPER_TYPES,
  FEEDING_METHODS,
  SLEEP_PLACES,
  MILESTONE_STATUSES,
  TRIMESTERS,
  TASK_STATUSES,
  SHOPPING_STATUSES,
  SUPPLEMENT_STATUSES,
  CONDITION_TYPES,
  REMINDER_FREQUENCIES,
} from '@mevabe/domain'
import type {
  BirthType,
  MealType,
  MeasurementType,
  SymptomSeverity,
  FetalMovementFeeling,
  AppointmentType,
  DiaperType,
  FeedingMethod,
  SleepPlace,
  MilestoneStatus,
  Trimester,
  TaskStatus,
  ShoppingStatus,
  SupplementStatus,
  ConditionType,
  ReminderFrequency,
} from '@mevabe/domain'

export const BIRTH_LABELS: Record<BirthType, string> = {
  vaginal: 'Sinh thường',
  c_section: 'Sinh mổ',
  assisted: 'Sinh can thiệp hỗ trợ',
}

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Bữa sáng',
  lunch: 'Bữa trưa',
  dinner: 'Bữa tối',
  snack: 'Bữa phụ',
  drink: 'Đồ uống',
}

export const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  weight: 'Cân nặng',
  blood_pressure: 'Huyết áp',
  blood_glucose: 'Đường huyết',
  waist_circumference: 'Vòng eo',
  bmi: 'BMI',
  fundal_height: 'Chiều cao tử cung',
  heart_rate: 'Nhịp tim',
  activity: 'Bước chân',
  sleep: 'Giấc ngủ',
}

export const MEASUREMENT_UNITS: Record<MeasurementType, string> = {
  weight: 'kg',
  blood_pressure: 'mmHg',
  blood_glucose: 'mmol/L',
  waist_circumference: 'cm',
  bmi: '',
  fundal_height: 'cm',
  heart_rate: 'lần/phút',
  activity: 'bước',
  sleep: 'giờ',
}

export const SEVERITY_LABELS: Record<SymptomSeverity, string> = {
  mild: 'Nhẹ',
  moderate: 'Vừa',
  severe: 'Nặng',
}

export const MOVEMENT_LABELS: Record<FetalMovementFeeling, string> = {
  normal: 'Bình thường',
  reduced: 'Giảm',
  absent: 'Không cảm nhận',
  strong: 'Mạnh',
}

export const APPOINTMENT_LABELS: Record<AppointmentType, string> = {
  first_visit: 'Khám lần đầu',
  prenatal: 'Khám thai',
  ultrasound: 'Siêu âm',
  blood_test: 'Xét nghiệm máu',
  screening: 'Sàng lọc',
  vaccination: 'Tiêm chủng',
  postpartum_check: 'Khám hậu sản',
  baby_check: 'Khám cho bé',
}

export const DIAPER_LABELS: Record<DiaperType, string> = {
  pee: 'Tè',
  poo: 'Ỉa',
  mixed: 'Cả hai',
}

export const FEEDING_METHOD_LABELS: Record<FeedingMethod, string> = {
  breast: 'Bú mẹ',
  pumped_milk: 'Sữa mẹ vắt',
  formula: 'Sữa công thức',
  mixed: 'Hỗn hợp',
}

export const SLEEP_PLACE_LABELS: Record<SleepPlace, string> = {
  cot: 'Cũi',
  bassinet: 'Nôi',
  co_sleeping: 'Ngủ chung',
  carrier: 'Địu',
  stroller: 'Xe đẩy',
  other: 'Khác',
}

export const MILESTONE_LABELS: Record<MilestoneStatus, string> = {
  achieved: 'Đạt',
  not_yet: 'Chưa',
  questionable: 'Cần theo dõi',
}

export const TRIMESTER_LABELS: Record<Trimester, string> = {
  first: 'Tam cá nguyệt thứ nhất',
  second: 'Tam cá nguyệt thứ hai',
  third: 'Tam cá nguyệt thứ ba',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Đã xong',
  cancelled: 'Đã hủy',
}

export const SHOPPING_STATUS_LABELS: Record<ShoppingStatus, string> = {
  pending: 'Cần mua',
  bought: 'Đã mua',
  cancelled: 'Bỏ',
}

export const SUPPLEMENT_STATUS_LABELS: Record<SupplementStatus, string> = {
  prescribed: 'Theo chỉ định',
  confirmed: 'Đã xác nhận',
  taken: 'Đã uống',
  skipped: 'Bỏ qua',
}

/** Nhãn tiếng Việt cho 7 loại tình trạng đặc biệt thai kỳ (Phase 4A). */
export const CONDITION_LABELS: Record<ConditionType, string> = {
  gestational_diabetes: 'Tiểu đường thai kỳ',
  hypertension: 'Tăng huyết áp',
  preeclampsia_risk: 'Nguy cơ tiền sản giật',
  hypothyroidism: 'Tuyến giáp (suy giáp)',
  hyperemesis: 'Nôn nghén nặng',
  anemia: 'Thiếu máu',
  cholestasis: 'Ứ mật thai kỳ',
}

export const REMINDER_FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  once: 'Một lần',
  daily: 'Hằng ngày',
  weekly: 'Hằng tuần',
  monthly: 'Hằng tháng',
  custom: 'Tùy chỉnh',
}

/** Chỉ số phù hợp + đơn vị + tần suất gợi ý cho từng tình trạng (UI lịch đo). */
export interface ConditionMetric {
  measurementType: MeasurementType
  label: string
  unit: string
  frequency: 'daily' | 'weekly'
}

export const CONDITION_METRICS: Record<ConditionType, ConditionMetric[]> = {
  gestational_diabetes: [
    { measurementType: 'blood_glucose', label: 'Đường huyết', unit: 'mmol/L', frequency: 'daily' },
  ],
  hypertension: [
    { measurementType: 'blood_pressure', label: 'Huyết áp', unit: 'mmHg', frequency: 'daily' },
  ],
  preeclampsia_risk: [
    { measurementType: 'blood_pressure', label: 'Huyết áp', unit: 'mmHg', frequency: 'daily' },
  ],
  // Không có type hemoglobin trong MEASUREMENT_TYPES → dùng cân nặng làm chỉ số gần nhất
  // (thay đổi cân nặng là một tín hiệu theo dõi cho anemia/hyperemesis).
  hypothyroidism: [
    { measurementType: 'weight', label: 'Cân nặng', unit: 'kg', frequency: 'weekly' },
  ],
  hyperemesis: [
    { measurementType: 'weight', label: 'Cân nặng', unit: 'kg', frequency: 'weekly' },
  ],
  anemia: [
    { measurementType: 'weight', label: 'Cân nặng', unit: 'kg', frequency: 'weekly' },
  ],
  cholestasis: [
    { measurementType: 'weight', label: 'Cân nặng', unit: 'kg', frequency: 'weekly' },
  ],
}

// ---- Option cho select ----
export const MEAL_OPTIONS = MEAL_TYPES.map((t) => ({ value: t, label: MEAL_LABELS[t] }))
export const MEASUREMENT_OPTIONS = MEASUREMENT_TYPES.map((t) => ({ value: t, label: MEASUREMENT_LABELS[t] }))
export const SEVERITY_OPTIONS = SYMPTOM_SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABELS[s] }))
export const MOVEMENT_OPTIONS = FETAL_MOVEMENT_FEELINGS.map((m) => ({ value: m, label: MOVEMENT_LABELS[m] }))
export const APPOINTMENT_OPTIONS = APPOINTMENT_TYPES.map((a) => ({ value: a, label: APPOINTMENT_LABELS[a] }))
export const DIAPER_OPTIONS = DIAPER_TYPES.map((d) => ({ value: d, label: DIAPER_LABELS[d] }))
export const FEEDING_METHOD_OPTIONS = FEEDING_METHODS.map((m) => ({ value: m, label: FEEDING_METHOD_LABELS[m] }))
export const SLEEP_PLACE_OPTIONS = SLEEP_PLACES.map((p) => ({ value: p, label: SLEEP_PLACE_LABELS[p] }))
export const CONDITION_OPTIONS = CONDITION_TYPES.map((c) => ({ value: c, label: CONDITION_LABELS[c] }))
export const REMINDER_FREQUENCY_OPTIONS = REMINDER_FREQUENCIES.map((f) => ({
  value: f,
  label: REMINDER_FREQUENCY_LABELS[f],
}))
