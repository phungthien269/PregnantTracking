// ===========================================================================
// condition-thresholds.ts — mốc tham khảo thai kỳ cho mô-đun "Tình trạng".
// Chỉ số NGOÀI MỐC → hiển thị ngữ cảnh + gợi ý trao đổi bác sĩ.
// KHÔNG phải chẩn đoán, KHÔNG cảnh báo khẩn (rule engine khẩn là Phase 6 riêng).
// Mốc lấy từ khuyến cáo tham khảo phổ biến (ACOG/NICE/IADPSG) — ghi rõ "tham khảo".
// Thuần TS (không import `@/`) để .check.ts chạy bằng node đơn lẻ.
// ===========================================================================

import type { MeasurementType } from '@mevabe/domain'

export interface ThresholdRule {
  measurementType: MeasurementType
  /** Trả true khi chỉ số ngoài mốc tham khảo → cần trao đổi bác sĩ. */
  outOfRange: (value: number, diastolic?: number) => boolean
  /** Ngữ cảnh hiển thị khi ngoài mốc (tiếng Việt). */
  context: string
  /** Mốc chi tiết + nguồn tham khảo (hiển thị nhỏ). */
  reference: string
  unit: string
}

export const PREGNANCY_THRESHOLDS: ThresholdRule[] = [
  {
    measurementType: 'blood_pressure',
    outOfRange: (value, diastolic) => value >= 140 || (diastolic ?? 0) >= 90,
    context: 'Huyết áp từ 140/90 mmHg trở lên',
    reference: 'Mốc tham khảo tăng huyết áp thai kỳ (ACOG/NICE). Không phải chẩn đoán.',
    unit: 'mmHg',
  },
  {
    measurementType: 'blood_glucose',
    outOfRange: (value) => value >= 5.1,
    context: 'Đường huyết lúc đói từ 5.1 mmol/L trở lên',
    reference: 'Ngưỡng chẩn đoán tiểu đường thai kỳ lúc đói ≥5.1 mmol/L (IADPSG tham khảo).',
    unit: 'mmol/L',
  },
  {
    measurementType: 'heart_rate',
    outOfRange: (value) => value >= 100,
    context: 'Nhịp tim từ 100 lần/phút trở lên (lúc nghỉ)',
    reference: 'Nhịp tim nhanh lúc nghỉ — mốc tham khảo, cần hỏi bác sĩ.',
    unit: 'lần/phút',
  },
]

/**
 * Kiểm tra một chỉ số có ngoài mốc tham khảo không.
 * Trả về rule đầu tiên khớp; không có → null (trong giới hạn tham khảo).
 */
export function checkMeasurement(
  type: MeasurementType,
  value: number,
  diastolic?: number,
): ThresholdRule | null {
  return (
    PREGNANCY_THRESHOLDS.find(
      (r) => r.measurementType === type && r.outOfRange(value, diastolic),
    ) ?? null
  )
}
