// ===========================================================================
// week.ts — toán "chọn tuần thai" (thuần, không React).
//
// Neo vào `anchorDate`: mốc 'hôm nay' mà dashboard dùng để suy tuần từ LMP.
// - Mock: `mock.getDashboard()` suy tuần từ LMP với mốc cố định TODAY
//   (2026-08-03) bằng `Math.floor((TODAY - lmp)/7)` → để dashboard hiển thị
//   đúng tuần N sau khi lưu, cần LMP = anchor − N×7 ngày.
// - Công thức (khớp Naegele của `updatePregnancy`): EDD = anchor + (40−N)×7,
//   LMP = EDD − 280 ngày.
// ===========================================================================
import { eddFromLmp, lmpFromEdd } from './pregnancy-math'

const DAY_MS = 86_400_000
export const MAX_WEEK = 42
export const PREGNANCY_WEEKS = 40
export const PREGNANCY_DAYS = 280

export type WeekTrimester = 'first' | 'second' | 'third'

function toUtc(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y!, m! - 1, d!)
}

function toIso(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

function clampWeek(w: number): number {
  return Math.min(MAX_WEEK, Math.max(1, w))
}

/** Cộng/trừ ngày (UTC, dạng yyyy-MM-dd). */
export function addDays(iso: string, days: number): string {
  return toIso(toUtc(iso) + days * DAY_MS)
}

/** EDD khi mẹ chọn tuần N: anchor + (40 − N)×7 ngày. */
export function eddForWeek(week: number, anchorDate: string): string {
  return addDays(anchorDate, (PREGNANCY_WEEKS - clampWeek(week)) * 7)
}

/** LMP khi mẹ chọn tuần N: EDD − 280 ngày (Naegele ngược). */
export function lmpForWeek(week: number, anchorDate: string): string {
  return addDays(eddForWeek(week, anchorDate), -PREGNANCY_DAYS)
}

/** Suy anchor 'hôm nay' từ dashboard (do dueDate = anchor + (40 − week)×7). */
export function anchorFromDashboard(dueDate: string, week: number): string {
  return addDays(dueDate, -(PREGNANCY_WEEKS - clampWeek(week)) * 7)
}

/** Tam cá nguyệt theo tuần (khớp `trimesterOf` trong mock). */
export function trimesterOf(week: number): WeekTrimester {
  const w = clampWeek(week)
  if (w <= 13) return 'first'
  if (w <= 27) return 'second'
  return 'third'
}

/** Self-check — chạy: `cd code && node --experimental-strip-types --import scripts/test-web-loader.mjs apps/web/lib/week.check.ts`. */
export function selfCheck(): void {
  const assert = (c: boolean, m: string) => {
    if (!c) throw new Error(`week.ts selfCheck: ${m}`)
  }
  const anchor = '2026-08-03' // mock TODAY
  // Seed: tuần 20 → LMP 2026-03-16, EDD 2026-12-21 (khớp mock.ts / supabase seed).
  assert(lmpForWeek(20, anchor) === '2026-03-16', 'week20 → LMP = seed LMP')
  assert(eddForWeek(20, anchor) === '2026-12-21', 'week20 → EDD = seed EDD')
  // Naegele round-trip cho tuần lẻ.
  assert(eddFromLmp(lmpForWeek(13, anchor)) === eddForWeek(13, anchor), 'LMP→EDD round-trip tuần 13')
  assert(lmpFromEdd(eddForWeek(13, anchor)) === lmpForWeek(13, anchor), 'EDD→LMP round-trip tuần 13')
  // Biên: tuần 1 và 42.
  assert(lmpForWeek(1, anchor) === addDays(anchor, -7), 'tuần 1 → LMP = anchor − 7')
  assert(eddForWeek(42, anchor) === addDays(anchor, -14), 'tuần 42 → EDD = anchor − 14')
  // anchorFromDashboard nghịch đảo eddForWeek.
  assert(anchorFromDashboard(eddForWeek(20, anchor), 20) === anchor, 'anchorFromDashboard nghịch đảo')
  // Clamp và tam cá nguyệt.
  assert(lmpForWeek(99, anchor) === lmpForWeek(42, anchor), 'clamp tuần >42')
  assert(trimesterOf(13) === 'first' && trimesterOf(14) === 'second' && trimesterOf(28) === 'third', 'tam cá nguyệt theo tuần')
  console.log('✅ week selfCheck OK — tuần→LMP/EDD khớp Naegele + dashboard mock')
}
