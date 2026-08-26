// Toán thai kỳ thuần (chỉ xử lý ngày yyyy-MM-dd, tính bằng UTC để tránh lệch múi giờ).
import { todayStr } from './format'

const DAY_MS = 86_400_000
const WEEKS = 40
const MAX_WEEK = 42

function toUtc(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Date.UTC(y!, m! - 1, d!)
}

function toIso(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

/** Ngày dự sinh = LMP + 280 ngày (40 tuần). */
export function eddFromLmp(lmp: string): string {
  return toIso(toUtc(lmp) + 280 * DAY_MS)
}

/** LMP ước tính từ EDD. */
export function lmpFromEdd(edd: string): string {
  return toIso(toUtc(edd) - 280 * DAY_MS)
}

/**
 * Tuần thai từ LMP (1..42) — QUY ƯỚC THỐNG NHẤT toàn app (khớp mock seed + WEEKS 0–41):
 * completed weeks = floor(số ngày/7). Ngày LMP = tuần 1 (clamp min 1, không hiện tuần 0);
 * EDD (LMP + 280 ngày) = tuần 40. Mọi trang (dashboard, /tuan, dinh dưỡng, onboarding…)
 * phải gọi hàm này (hoặc bản uỷ thác trong mock) để ra cùng một tuần.
 */
export function weekFromLmp(lmp: string, today: string = todayStr()): number {
  const days = Math.floor((toUtc(today) - toUtc(lmp)) / DAY_MS)
  return Math.min(MAX_WEEK, Math.max(1, Math.floor(days / 7)))
}

/** LMP và EDD nhập cả hai có mâu thuẫn? (chênh trên 14 ngày). */
export function lmpEddConflict(lmp?: string, edd?: string): boolean {
  if (!lmp || !edd) return false
  return Math.abs(toUtc(edd) - toUtc(eddFromLmp(lmp))) > 14 * DAY_MS
}

/** Self-check nhỏ — chạy: tsc module + node. */
export function selfCheck(): void {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error(`pregnancy-math: ${msg}`)
  }
  assert(eddFromLmp('2025-01-01') === '2025-10-08', 'eddFromLmp +280d')
  assert(lmpFromEdd('2025-10-08') === '2025-01-01', 'lmpFromEdd -280d')
  assert(weekFromLmp('2025-01-01', '2025-03-01') === 8, '59 ngày -> tuần 8 (completed weeks)')
  assert(weekFromLmp('2025-01-01', '2025-01-01') === 1, 'ngày LMP = tuần 1 (clamp min 1)')
  assert(weekFromLmp('2025-01-01', '2026-01-01') === 42, 'clamp tối đa 42')
  assert(lmpEddConflict('2025-01-01', '2025-11-01') === true, 'mâu thuẫn >14 ngày')
  assert(lmpEddConflict('2025-01-01', '2025-10-15') === false, 'chấp nhận trong 14 ngày')
  assert(WEEKS === 40, '40 tuần thai')
  console.log('pregnancy-math selfCheck OK')
}
