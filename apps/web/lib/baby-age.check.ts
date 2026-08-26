// Self-check baby-age.ts — chạy: cd code && scripts/test-web.sh
// (hoặc node --experimental-strip-types --import scripts/test-web-loader.mjs apps/web/lib/baby-age.check.ts)
import assert from 'node:assert/strict'
import { babyAge, babyPhase } from './baby-age'

// Ngày sinh 1/1/2026 + hôm nay 5/8/2026 → 7 tháng 4 ngày.
const a = babyAge('2026-01-01', '2026-08-05')
assert.equal(a.months, 7)
assert.equal(a.days, 4)
assert.equal(a.label, '7 tháng 4 ngày')

// Bé chưa đủ 1 tháng → "ngày tuổi".
const nb = babyAge('2026-08-01', '2026-08-05')
assert.equal(nb.months, 0)
assert.equal(nb.days, 4)
assert.equal(nb.label, '4 ngày tuổi')

// Cuối tháng: 31/1 → 1/2 = 1 ngày tuổi.
const eom = babyAge('2026-01-31', '2026-02-01')
assert.equal(eom.months, 0)
assert.equal(eom.days, 1)

// Ngày lẻ âm: 15/1 → 5/8 = 6 tháng 21 ngày.
const neg = babyAge('2026-01-15', '2026-08-05')
assert.equal(neg.months, 6)
assert.equal(neg.days, 21)

// Ngày sinh trong tương lai → "—".
const fut = babyAge('2027-01-01', '2026-08-05')
assert.equal(fut.label, '—')

// Giai đoạn: dưới 1 tháng & 9 tháng → infant; 18 & 24 tháng → toddler.
assert.equal(babyPhase(0), 'infant')
assert.equal(babyPhase(9), 'infant')
assert.equal(babyPhase(11), 'infant')
assert.equal(babyPhase(12), 'toddler')
assert.equal(babyPhase(18), 'toddler')
assert.equal(babyPhase(24), 'toddler')

console.log('✅ baby-age.check: PASS')
