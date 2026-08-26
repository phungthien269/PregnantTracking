import type { AppointmentType, Trimester } from '../core'

// ===========================================================================
// Quy tắc thai kỳ — thuần hàm, không phụ thuộc runtime nào.
// Ngày dạng 'YYYY-MM-DD', tính theo UTC để tránh lệch múi giờ; hiển thị theo
// Asia/Ho_Chi_Minh (ADR-006) ở lớp UI.
// ===========================================================================

const DAY_MS = 86_400_000
/** Naegele: 40 tuần = 280 ngày. */
const GESTATION_DAYS = 280
/** Dung sai LMP–EDD (EDD có thể được siêu âm điều chỉnh ±2 tuần). */
const LMP_EDD_TOLERANCE_DAYS = 14

export function parseDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y as number, (m as number) - 1, d as number))
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Ngày dự sinh theo quy tắc Naegele: LMP + 280 ngày. */
export function eddFromLmp(lmp: string): string {
  const d = parseDate(lmp)
  d.setUTCDate(d.getUTCDate() + GESTATION_DAYS)
  return formatDate(d)
}

/** Ngược lại: EDD − 280 ngày. */
export function lmpFromEdd(edd: string): string {
  const d = parseDate(edd)
  d.setUTCDate(d.getUTCDate() - GESTATION_DAYS)
  return formatDate(d)
}

/**
 * Tuần thai tại thời điểm `at` (mặc định hôm nay) — QUY ƯỚC completed-weeks thống nhất
 * với web (lib/pregnancy-math + mock): 0 = trước LMP; ngày LMP = tuần 1 (clamp min 1);
 * EDD (LMP + 280 ngày) = tuần 40. `Math.floor(days/7)` KHÔNG cộng 1.
 */
export function weekOfPregnancy(lmp: string, at: Date = new Date()): number {
  const days = Math.floor((at.getTime() - parseDate(lmp).getTime()) / DAY_MS)
  if (days < 0) return 0
  return Math.min(42, Math.max(1, Math.floor(days / 7)))
}

export function trimester(week: number): Trimester {
  if (week <= 13) return 'first'
  if (week <= 27) return 'second'
  return 'third'
}

/** Kiểm tra mâu thuẫn LMP–EDD khi nhập cả hai. */
export function validateLmpEdd(lmp: string, edd: string): { ok: boolean; reason?: string } {
  const diff = Math.abs(parseDate(edd).getTime() - parseDate(eddFromLmp(lmp)).getTime()) / DAY_MS
  if (diff <= LMP_EDD_TOLERANCE_DAYS) return { ok: true }
  return {
    ok: false,
    reason: `Ngày dự sinh lệch ${Math.round(diff)} ngày so với LMP + 280 ngày.`,
  }
}

export interface MilestoneAppointment {
  week: number
  type: AppointmentType
  title: string
  note: string
}

/** Lịch khám mẫu theo mốc Việt Nam; người dùng chỉnh sửa theo bác sĩ sau đó. */
export const DEFAULT_APPOINTMENT_SCHEDULE: MilestoneAppointment[] = [
  { week: 8, type: 'first_visit', title: 'Khám lần đầu', note: 'Xác nhận thai, siêu âm, xét nghiệm máu cơ bản.' },
  { week: 12, type: 'screening', title: 'Sàng lọc quý 1 (Double test)', note: 'Đo độ mờ da gáy, tầm soát dị tật.' },
  { week: 16, type: 'blood_test', title: 'Xét nghiệm quý 2 (Quad test)', note: 'Tầm soát dị tật thai nhi.' },
  { week: 20, type: 'ultrasound', title: 'Siêu âm hình thái học', note: 'Đánh giá cấu trúc các cơ quan thai.' },
  { week: 24, type: 'blood_test', title: 'Nghiệm pháp dung nạp glucose', note: 'Tầm soát tiểu đường thai kỳ.' },
  { week: 28, type: 'prenatal', title: 'Khám định kỳ + tiêm phòng', note: 'Tiêm uốn ván (nếu theo lịch), theo dõi tăng trưởng.' },
  { week: 32, type: 'prenatal', title: 'Khám định kỳ', note: 'Theo dõi ngôi thai, chỉ số ối.' },
  { week: 36, type: 'prenatal', title: 'Khám định kỳ + xét nghiệm liên cầu B', note: 'Tầm soát GBS, xác định kế hoạch sinh.' },
  { week: 38, type: 'prenatal', title: 'Khám tuần cuối', note: 'Theo dõi sát, sẵn sàng chuyển dạ.' },
]

export function appointmentsForWeek(week: number): MilestoneAppointment[] {
  return DEFAULT_APPOINTMENT_SCHEDULE.filter((a) => a.week === week)
}

/** Hỗ trợ đa thai: nhiều hồ sơ thai nhi trong một hành trình. */
export function isMultiplePregnancy(fetuses: unknown[]): boolean {
  return fetuses.length > 1
}

// ---------------------------------------------------------------------------
// demo — tự kiểm tra nhanh (chạy: node --experimental-strip-types rules.ts)
// ---------------------------------------------------------------------------
function demo(): void {
  const assert = (cond: boolean, msg: string): void => {
    if (!cond) throw new Error('rules.demo: ' + msg)
  }
  assert(eddFromLmp('2026-01-01') === '2026-10-08', 'Naegele: 01-01 + 280d = 08-10')
  assert(lmpFromEdd(eddFromLmp('2026-03-15')) === '2026-03-15', 'lmpFromEdd là nghịch đảo')
  assert(weekOfPregnancy('2026-01-01', new Date(Date.UTC(2026, 0, 8))) === 1, '7 ngày → tuần 1 (completed weeks)')
  assert(weekOfPregnancy('2026-01-01', new Date(Date.UTC(2026, 2, 1))) === 8, '59 ngày → tuần 8')
  assert(weekOfPregnancy('2026-01-01', new Date(Date.UTC(2026, 0, 1))) === 1, 'ngày LMP → tuần 1')
  assert(trimester(5) === 'first' && trimester(20) === 'second' && trimester(30) === 'third', 'tam cá nguyệt')
  assert(validateLmpEdd('2026-01-01', '2026-10-01').ok, 'LMP-EDD nhất quán')
  assert(!validateLmpEdd('2026-01-01', '2026-08-01').ok, 'LMP-EDD mâu thuẫn')
  assert(appointmentsForWeek(12).length === 1, 'có lịch khám tuần 12')
  assert(isMultiplePregnancy([{}, {}]) && !isMultiplePregnancy([{}]), 'đa thai')
  console.log('✅ pregnancy/rules.ts OK')
}

const isMain = (): boolean =>
  (globalThis as { process?: { argv?: string[] } }).process?.argv?.[1]?.endsWith('rules.ts') === true
if (isMain()) demo()
