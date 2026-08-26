import { growthPercentile, percentileValue } from '@mevabe/domain'
import type { Gender } from '@mevabe/domain'

// ===========================================================================
// Helper thuần (không React, không data layer) — gộp getGrowth + WHO percentile
// cho trang Tăng trưởng. Chạy được bằng node (demo() ở cuối file).
// - ageInMonths: tuổi TRÒN tháng (0 = mới sinh), clamp >= 0.
// - percentileOf: 'weight'|'height'|'head' → who.growthPercentile; sex unknown → null.
// - referenceAt: giá trị đường chuẩn P3/P97 tại tháng — vẽ nền biểu đồ.
// - buildGrowthView: decorate từng điểm + cảnh báo trụt kênh (đơn thuần, test được).
// ===========================================================================

export interface GrowthPointLike {
  date: string
  weightKg?: number | null
  heightCm?: number | null
  headCm?: number | null
}

export interface ChildLike {
  sex: Gender
  birth_date: string
}

export type GrowthMeasure = 'weight' | 'height' | 'head'

/** Số tháng tròn tuổi của bé tại onDate (theo lịch, chưa đủ ngày → chưa tròn tháng). */
export function ageInMonths(birthDate: string, onDate: string): number {
  const b = new Date(birthDate + 'T00:00:00')
  const d = new Date(onDate + 'T00:00:00')
  if (Number.isNaN(b.getTime()) || Number.isNaN(d.getTime())) return 0
  let m = (d.getFullYear() - b.getFullYear()) * 12 + (d.getMonth() - b.getMonth())
  if (d.getDate() < b.getDate()) m -= 1
  return Math.max(0, m)
}

/** Xếp bé vào đường percentile ('<p3' | 'p3' | ... | '>p97'); sex unknown → null. */
export function percentileOf(sex: Gender, measure: GrowthMeasure, month: number, value: number): string | null {
  if (sex === 'unknown') return null
  return growthPercentile(sex, measure, month, value)
}

/** Giá trị đường chuẩn percentile (P3/P97...) tại tháng — nền biểu đồ. sex unknown → null. */
export function referenceAt(
  sex: Gender,
  measure: GrowthMeasure,
  month: number,
  percentile: 3 | 15 | 50 | 85 | 97,
): number | null {
  if (sex === 'unknown') return null
  return percentileValue(sex, measure, month, percentile)
}

export const PCT_LABEL: Record<string, string> = {
  '<p3': 'Dưới P3',
  p3: 'P3',
  p15: 'P15',
  p50: 'P50',
  p85: 'P85',
  p97: 'P97',
  '>p97': 'Trên P97',
}

const PCT_RANK: Record<string, number> = {
  '<p3': -1,
  p3: 0,
  p15: 1,
  p50: 2,
  p85: 3,
  p97: 4,
  '>p97': 5,
}

export interface MeasurePercentile {
  value: number
  pct: string | null
}

export interface DecoratedPoint extends GrowthPointLike {
  month: number
  weight: MeasurePercentile | null
  height: MeasurePercentile | null
  head: MeasurePercentile | null
}

export interface GrowthWarning {
  date: string
  month: number
  measure: GrowthMeasure
  from: string | null
  to: string
  message: string
}

export interface GrowthView {
  points: DecoratedPoint[]
  warnings: GrowthWarning[]
}

function decorate(child: ChildLike, p: GrowthPointLike): DecoratedPoint {
  const month = ageInMonths(child.birth_date, p.date)
  const weight = p.weightKg != null ? { value: p.weightKg, pct: percentileOf(child.sex, 'weight', month, p.weightKg) } : null
  const height = p.heightCm != null ? { value: p.heightCm, pct: percentileOf(child.sex, 'height', month, p.heightCm) } : null
  const head = p.headCm != null ? { value: p.headCm, pct: percentileOf(child.sex, 'head', month, p.headCm) } : null
  return { date: p.date, month, weightKg: p.weightKg, heightCm: p.heightCm, headCm: p.headCm, weight, height, head }
}

function collectWarnings(points: DecoratedPoint[]): GrowthWarning[] {
  const warnings: GrowthWarning[] = []
  const prev: Partial<Record<GrowthMeasure, { pct: string; rank: number }>> = {}
  for (const pt of points) {
    for (const measure of ['weight', 'height', 'head'] as const) {
      const m = pt[measure]
      if (!m?.pct) continue
      const rank = PCT_RANK[m.pct]
      if (rank === undefined) continue
      const before = prev[measure]
      if (rank < 0) {
        warnings.push({
          date: pt.date,
          month: pt.month,
          measure,
          from: before?.pct ?? null,
          to: m.pct,
          message: 'Dưới đường P3 — mức thấp nhất của chuẩn WHO',
        })
      } else if (before && rank <= before.rank - 2) {
        warnings.push({
          date: pt.date,
          month: pt.month,
          measure,
          from: before.pct,
          to: m.pct,
          message: `Trụt kênh: ${PCT_LABEL[before.pct] ?? before.pct} → ${PCT_LABEL[m.pct] ?? m.pct}`,
        })
      }
      prev[measure] = { pct: m.pct, rank }
    }
  }
  return warnings
}

/** Sắp theo ngày tăng dần, decorate từng điểm + tập cảnh báo trụt kênh. */
export function buildGrowthView(child: ChildLike, raw: GrowthPointLike[]): GrowthView {
  const points = raw
    .map((p) => ({ ...p }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => decorate(child, p))
  return { points, warnings: collectWarnings(points) }
}

// ---------------------------------------------------------------------------
// demo / self-check (chạy: node --experimental-strip-types --import scripts/test-web-loader.mjs <file>)
// ---------------------------------------------------------------------------
function demo(): void {
  const assert = (cond: boolean, msg: string): void => {
    if (!cond) throw new Error('growth-percentile: ' + msg)
  }
  // Tuổi tháng
  assert(ageInMonths('2026-01-15', '2026-03-14') === 1, 'chưa đủ ngày → 1 tháng')
  assert(ageInMonths('2026-01-15', '2026-03-15') === 2, 'đủ ngày → 2 tháng')
  assert(ageInMonths('2026-01-15', '2026-01-10') === 0, 'trước ngày sinh → clamp 0')
  assert(ageInMonths('2025-12-31', '2026-02-01') === 1, '31/12 → 01/02 = 1 tháng')

  // WHO percentile cho giá trị mẫu (bảng bé gái 0 tháng: p3=2.4, p15=2.8, p50=3.2, p97=4.2)
  assert(percentileOf('female', 'weight', 0, 2.3) === '<p3', '2.3kg nữ 0m → <p3')
  assert(percentileOf('female', 'weight', 0, 2.8) === 'p15', '2.8kg nữ 0m → p15')
  assert(percentileOf('female', 'weight', 0, 3.2) === 'p50', '3.2kg nữ 0m → p50')
  assert(percentileOf('female', 'weight', 0, 4.5) === '>p97', '4.5kg nữ 0m → >p97')
  assert(percentileOf('male', 'weight', 0, 3.1) === 'p15', '3.1kg nam 0m → p15 (theo growth.ts)')
  assert(percentileOf('unknown', 'weight', 0, 3.2) === null, 'sex unknown → null')
  // Vòng đầu WHO 0–24 tháng (domain growth.ts đã có bảng head)
  assert(percentileOf('female', 'head', 0, 34) === 'p50', 'vòng đầu 34cm nữ 0m → p50')
  assert(percentileOf('male', 'head', 12, 46.1) === 'p50', 'vòng đầu 46.1cm nam 12m → p50 (WHO)')
  assert(percentileOf('female', 'head', 6, 42.2) === 'p50', 'vòng đầu 42.2cm nữ 6m → p50')
  assert(percentileOf('female', 'head', 6, 44.7) === 'p97', 'vòng đầu 44.7cm nữ 6m → p97')
  assert(percentileOf('unknown', 'head', 12, 46.1) === null, 'sex unknown head → null')

  // Đường tham chiếu
  assert(referenceAt('male', 'weight', 0, 3) === 2.5, 'P3 nam 0m = 2.5kg')
  assert(referenceAt('male', 'weight', 24, 97) === 15.3, 'P97 nam 24m = 15.3kg')
  assert(referenceAt('male', 'head', 12, 50) === 46.1, 'P50 vòng đầu nam 12m = 46.1cm')
  assert(referenceAt('unknown', 'weight', 0, 3) === null, 'unknown → null ref')

  // buildGrowthView + cảnh báo trụt kênh
  const girl = { sex: 'female' as Gender, birth_date: '2026-01-15' }
  const view = buildGrowthView(girl, [
    { date: '2026-01-16', weightKg: 3.2 }, // 0 tháng → p50
    { date: '2026-02-16', weightKg: 3.3 }, // 1 tháng → p3 (trụt 2 kênh p50→p3)
    { date: '2026-03-16', weightKg: 2.9 }, // 2 tháng → <p3 (dưới P3)
    { date: '2026-04-16', headCm: 35 }, // vòng đầu chỉ hiển thị
  ])
  assert(view.points.length === 4, '4 điểm đo')
  assert(view.points[0]!.weight!.pct === 'p50', 'điểm 0 → p50')
  assert(view.points[1]!.weight!.pct === 'p3', 'điểm 1 → p3')
  assert(view.points[2]!.weight!.pct === '<p3', 'điểm 2 → <p3')
  assert(view.points[3]!.head!.value === 35, 'vòng đầu giữ giá trị')
  assert(view.points[3]!.head!.pct === '<p3', 'vòng đầu 35cm nữ 3m → <p3')
  assert(view.warnings.length === 3, '3 cảnh báo (trụt kênh + dưới P3 + head dưới P3)')
  assert(view.warnings[0]!.message.includes('Trụt kênh: P50 → P3'), 'cảnh báo trụt kênh đúng nhãn')
  assert(view.warnings[1]!.message.includes('Dưới đường P3'), 'cảnh báo dưới P3 đúng nhãn')
  assert(view.warnings[2]!.measure === 'head', 'cảnh báo head dưới P3')

  console.log('✅ growth-percentile.ts OK')
}

const isMain = (): boolean =>
  (globalThis as { process?: { argv?: string[] } }).process?.argv?.[1]?.endsWith('growth-percentile.ts') === true
if (isMain()) demo()
