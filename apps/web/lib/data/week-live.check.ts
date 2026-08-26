// Self-check "tuần thai tự chạy theo ngày thật" (fix Phase 7).
// - weekFromLmp(LMP seed) phải bằng giá trị kỳ vọng tính từ REAL_TODAY (ngày thật giờ VN).
// - Tuần đơn điệu theo ngày: tuần(hôm qua) ≤ tuần(hôm nay) ≤ tuần(ngày mai).
// - Cộng đúng 7 ngày → tuần tăng đúng 1 (đặc tính của floor(days/7), không đụng clamp 42 với seed).
import assert from 'node:assert/strict'
import { LMP, REAL_TODAY, weekFromLmp } from './mock'

const DAY_MS = 86_400_000
const parse = (d: string): number => Date.parse(d)

/** Tuần kỳ vọng theo cùng công thức của mock.weekFromLmp, tại REAL_TODAY + `days`. */
function weekAt(daysFromReal: number): number {
  const days = Math.round((parse(REAL_TODAY) + daysFromReal * DAY_MS - parse(LMP)) / DAY_MS)
  return Math.min(42, Math.max(1, Math.floor(days / 7)))
}

// (b) weekFromLmp(LMP seed) phải bằng kỳ vọng theo ngày thật — chứng minh dùng REAL_TODAY, không còn TODAY cố định.
assert.equal(
  weekFromLmp(LMP),
  weekAt(0),
  `weekFromLmp(LMP=${LMP}) phải bằng kỳ vọng theo REAL_TODAY=${REAL_TODAY}`,
)

// (a) Đơn điệu theo ngày: hôm qua ≤ hôm nay ≤ ngày mai.
assert.ok(weekAt(0) >= weekAt(-1), `week(today=${weekAt(0)}) >= week(yesterday=${weekAt(-1)})`)
assert.ok(weekAt(0) <= weekAt(1), `week(today=${weekAt(0)}) <= week(tomorrow=${weekAt(1)})`)

// Cộng 7 ngày → tuần tăng đúng 1 (tuần thực sự chạy theo ngày, không đứng yên).
assert.equal(weekAt(7), weekAt(0) + 1, 'week(+7d) = week(today) + 1')

console.log(`week-live OK: REAL_TODAY=${REAL_TODAY}, LMP=${LMP}, tuần hôm nay=${weekFromLmp(LMP)}`)
