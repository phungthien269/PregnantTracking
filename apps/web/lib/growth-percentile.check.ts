import { growthPercentile, percentileValue } from '@mevabe/domain'
import { buildGrowthView, percentileOf, referenceAt } from './growth-percentile'

// ===========================================================================
// Check P7 — nối VÒNG ĐẦU (head) vào percentile UI theo chuẩn WHO 0–24 tháng.
// Chạy qua: bash scripts/test-web.sh
// ===========================================================================
const assert = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error('growth-percentile.check: ' + msg)
}

// Domain head đã sẵn (P2) — bé trai 12m đầu 46.1cm là P50 WHO.
assert(growthPercentile('male', 'head', 12, 46.1) === 'p50', 'trai 12m đầu 46.1 → p50 (WHO)')
assert(growthPercentile('female', 'head', 6, 42.2) === 'p50', 'gái 6m đầu 42.2 → p50')
assert(growthPercentile('female', 'head', 6, 44.7) === 'p97', 'gái 6m đầu 44.7 → p97')

// percentileOf: app → domain, head giờ có chuẩn; sex unknown → null.
assert(percentileOf('male', 'head', 12, 46.1) === 'p50', 'percentileOf head trai 12m → p50')
assert(percentileOf('female', 'head', 12, 47.4) === 'p97', 'percentileOf head gái 12m → p97')
assert(percentileOf('unknown', 'head', 12, 46.1) === null, 'sex unknown head → null')

// referenceAt: đường chuẩn head để vẽ nền P3/P97.
assert(referenceAt('male', 'head', 12, 50) === 46.1, 'P50 vòng đầu trai 12m = 46.1')
assert(referenceAt('female', 'head', 6, 3) === 39.8, 'P3 vòng đầu gái 6m = 39.8')
assert(referenceAt('unknown', 'head', 6, 50) === null, 'unknown → null ref')

// buildGrowthView: head được decorate pct + sinh cảnh báo trụt kênh.
const girl = { sex: 'female' as const, birth_date: '2026-01-15' }
const view = buildGrowthView(girl, [
  { date: '2026-04-16', headCm: 35 }, // 3 tháng → <p3
  { date: '2026-07-16', headCm: 40.9 }, // 6 tháng → p15
])
assert(view.points[0]!.head!.pct === '<p3', 'head 3m <p3')
assert(view.points[1]!.head!.pct === 'p15', 'head 6m p15')
assert(view.points[1]!.head!.value === 40.9, 'head giữ giá trị cm')
assert(view.warnings.some((w) => w.measure === 'head'), 'có cảnh báo head')

console.log('✅ growth-percentile.check.ts OK')
