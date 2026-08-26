// ===========================================================================
// CSV helpers + catalog bảng (Agent 7 C.5 — polish I/6).
// - csvCell/toCsv: escape RFC4180 (quote "", dấu phẩy, xuống dòng).
// - TABLE_ORDER/COLUMNS/VI/TABLE_LABELS: catalog bảng, cột ổn định, tiếng Việt.
// - assembleCsv: ghép toàn bộ thành CSV có BOM (Excel Windows đọc đúng dấu).
// Tách khỏi route để self-check (export-csv.check.ts) chạy được bằng node.
// ===========================================================================

export type Row = Record<string, unknown>

/** BOM UTF-8 — cần để Excel nhận dạng tiếng Việt (UTF-8). */
export const BOM = '﻿'

/** Nhãn tiếng Việt cho từng cột (fallback: tên field gốc). */
export const VI: Record<string, string> = {
  id: 'ID',
  family_id: 'Mã gia đình',
  private_owner_id: 'Chủ sở hữu',
  created_at: 'Tạo lúc',
  updated_at: 'Cập nhật lúc',
  source: 'Nguồn',
  pregnancy_id: 'Mã thai kỳ',
  lmp: 'Kỳ kinh cuối (LMP)',
  edd: 'Ngày dự sinh (EDD)',
  status: 'Trạng thái',
  notes: 'Ghi chú',
  name: 'Tên',
  sex: 'Giới tính',
  birth_order: 'Thứ tự sinh',
  type: 'Loại',
  value: 'Giá trị',
  unit: 'Đơn vị',
  diastolic: 'Huyết áp tâm trương',
  taken_at: 'Lúc đo',
  note: 'Ghi chú',
  symptom: 'Triệu chứng',
  severity: 'Mức độ',
  started_at: 'Bắt đầu',
  ended_at: 'Kết thúc',
  scheduled_at: 'Thời gian',
  location: 'Địa điểm',
  doctor: 'Bác sĩ',
  summary_before: 'Tóm tắt trước',
  outcome: 'Kết quả',
  followup_at: 'Tái khám',
  meal_type: 'Bữa',
  logged_at: 'Thời gian ghi',
  calories: 'Năng lượng (kcal)',
  amount_ml: 'Lượng (ml)',
  amount_mg: 'Lượng (mg)',
  birth_date: 'Ngày sinh',
  birth_weight_kg: 'Cân nặng (kg)',
  birth_length_cm: 'Chiều dài (cm)',
  head_circumference_cm: 'Vòng đầu (cm)',
  blood_type: 'Nhóm máu',
  allergies: 'Dị ứng',
  title: 'Tiêu đề',
  description: 'Mô tả',
  due_date: 'Hạn',
  assignee_id: 'Người phụ trách',
  completed_at: 'Hoàn thành lúc',
  category: 'Danh mục',
  quantity: 'Số lượng',
  estimated_price: 'Giá dự kiến',
  actual_price: 'Giá thực tế',
  amount: 'Số tiền',
  occurred_at: 'Ngày phát sinh',
  quiz_question_id: 'Mã câu hỏi',
  reporter_id: 'Người báo lỗi',
  reason: 'Lý do',
}

/** Thứ tự cột ổn định theo từng bảng — key = tên bảng trong export. */
export const COLUMNS: Record<string, string[]> = {
  pregnancy: ['id', 'lmp', 'edd', 'status', 'notes', 'source', 'created_at', 'updated_at'],
  fetuses: ['id', 'name', 'sex', 'birth_order', 'notes', 'created_at', 'updated_at'],
  measurements: ['id', 'type', 'value', 'unit', 'diastolic', 'taken_at', 'note', 'source', 'created_at', 'updated_at'],
  symptoms: ['id', 'symptom', 'severity', 'started_at', 'ended_at', 'note', 'source', 'created_at', 'updated_at'],
  appointments: ['id', 'type', 'scheduled_at', 'location', 'doctor', 'summary_before', 'outcome', 'followup_at', 'notes', 'created_at', 'updated_at'],
  meals: ['id', 'meal_type', 'name', 'logged_at', 'calories', 'note', 'source', 'created_at', 'updated_at'],
  hydration_logs: ['id', 'logged_at', 'amount_ml', 'source', 'created_at', 'updated_at'],
  caffeine_logs: ['id', 'logged_at', 'amount_mg', 'source', 'created_at', 'updated_at'],
  children: ['id', 'name', 'sex', 'birth_date', 'birth_weight_kg', 'birth_length_cm', 'head_circumference_cm', 'blood_type', 'allergies', 'created_at', 'updated_at'],
  tasks: ['id', 'title', 'description', 'status', 'due_date', 'assignee_id', 'completed_at', 'created_at', 'updated_at'],
  shopping: ['id', 'name', 'category', 'quantity', 'unit', 'estimated_price', 'actual_price', 'status', 'note', 'created_at', 'updated_at'],
  budget: ['id', 'title', 'amount', 'type', 'category', 'occurred_at', 'note', 'created_at', 'updated_at'],
  question_reports: ['id', 'quiz_question_id', 'reporter_id', 'reason', 'status', 'created_at', 'updated_at'],
}

/** Thứ tự bảng ổn định trong file xuất. */
export const TABLE_ORDER: string[] = [
  'pregnancy',
  'fetuses',
  'measurements',
  'symptoms',
  'appointments',
  'meals',
  'hydration_logs',
  'caffeine_logs',
  'children',
  'tasks',
  'shopping',
  'budget',
  'question_reports',
]

/** Tiêu đề tiếng Việt cho từng bảng. */
export const TABLE_LABELS: Record<string, string> = {
  pregnancy: 'Thai kỳ',
  fetuses: 'Thai nhi',
  measurements: 'Đo lường mẹ',
  symptoms: 'Triệu chứng',
  appointments: 'Lịch hẹn khám',
  meals: 'Bữa ăn',
  hydration_logs: 'Nước uống',
  caffeine_logs: 'Caffeine',
  children: 'Bé',
  tasks: 'Việc cần làm',
  shopping: 'Mua sắm',
  budget: 'Chi tiêu',
  question_reports: 'Báo lỗi câu hỏi',
}

/** Cell theo RFC4180: có phẩy/ngoặc kép/xuống dòng → bọc `"…"`, nhân đôi `"`. */
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Ghép mảng dòng thành CSV. `columns` (nếu có) quyết định thứ tự cột + header
 * tiếng Việt; không có thì suy header từ chính dữ liệu (tên field gốc).
 */
export function toCsv(rows: Row[], columns?: string[]): string {
  if (!rows.length) return ''
  const headers = columns ?? [...new Set(rows.flatMap((r) => Object.keys(r)))]
  const labels = columns ? headers.map((h) => VI[h] ?? h) : headers
  return [labels.join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))].join('\n')
}

/** Ghép các bảng thành một file CSV hoàn chỉnh: BOM + từng `# Bảng` + nội dung. */
export function assembleCsv(tables: Record<string, Row[]>): string {
  const parts: string[] = []
  for (const name of TABLE_ORDER) {
    const rows = tables[name] ?? []
    const section = `# ${TABLE_LABELS[name] ?? name}`
    const body = toCsv(rows, COLUMNS[name])
    parts.push(body ? `${section}\n${body}` : section)
  }
  return BOM + parts.join('\n\n')
}
