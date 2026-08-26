import type { Gender } from '../core'

// ===========================================================================
// Tăng trưởng 0–24 tháng theo WHO Child Growth Standards (percentile 3/15/50/85/97).
// Đo: weight (kg), height (cm), head — vòng đầu (cm).
// Dữ liệu là giá trị tham chiếu tại các tháng mốc, nội suy tuyến tính giữa mốc.
// Nguồn head: WHO Child Growth Standards — Head circumference-for-age (0–24 tháng),
// tính từ tham số LMS chính thức (L=1: HC = M·(1+S·z)) tại mốc tháng → P3/15/50/85/97.
// ponytail: weight/height là tham chiếu gần đúng — THAY bằng bảng chính thức WHO
// trước khi phát hành y khoa; cấu trúc + nội suy đã sẵn sàng.
// ===========================================================================

export const GROWTH_PERCENTILES = [3, 15, 50, 85, 97] as const
export type GrowthPercentile = (typeof GROWTH_PERCENTILES)[number]

/** Tháng mốc 0,1,3,6,9,12,18,24. */
const ANCHOR_MONTHS = [0, 1, 3, 6, 9, 12, 18, 24] as const

type Measure = 'weight' | 'height' | 'head'

interface AnchorRow {
  [percentile: number]: number
}

// Giá trị tham chiếu: [tháng] → {3,15,50,85,97}
const WEIGHT_BOY: Record<number, AnchorRow> = {
  0: { 3: 2.5, 15: 2.9, 50: 3.3, 85: 3.8, 97: 4.3 },
  1: { 3: 3.4, 15: 3.9, 50: 4.5, 85: 5.1, 97: 5.7 },
  3: { 3: 5.0, 15: 5.7, 50: 6.4, 85: 7.2, 97: 8.0 },
  6: { 3: 6.4, 15: 7.1, 50: 7.9, 85: 8.8, 97: 9.7 },
  9: { 3: 7.1, 15: 7.9, 50: 8.9, 85: 9.9, 97: 11.0 },
  12: { 3: 7.7, 15: 8.6, 50: 9.6, 85: 10.7, 97: 11.9 },
  18: { 3: 8.8, 15: 9.8, 50: 10.9, 85: 12.2, 97: 13.5 },
  24: { 3: 9.7, 15: 10.8, 50: 12.2, 85: 13.6, 97: 15.3 },
}
const LENGTH_BOY: Record<number, AnchorRow> = {
  0: { 3: 46.3, 15: 48.0, 50: 49.9, 85: 51.8, 97: 53.4 },
  1: { 3: 50.8, 15: 52.8, 50: 54.7, 85: 56.7, 97: 58.6 },
  3: { 3: 57.3, 15: 59.2, 50: 61.4, 85: 63.7, 97: 65.8 },
  6: { 3: 63.3, 15: 65.4, 50: 67.6, 85: 69.9, 97: 71.9 },
  9: { 3: 67.5, 15: 69.7, 50: 72.0, 85: 74.3, 97: 76.4 },
  12: { 3: 70.8, 15: 73.1, 50: 75.7, 85: 78.2, 97: 80.4 },
  18: { 3: 76.0, 15: 78.5, 50: 81.5, 85: 84.4, 97: 86.9 },
  24: { 3: 79.7, 15: 82.4, 50: 85.7, 85: 88.8, 97: 91.6 },
}
const WEIGHT_GIRL: Record<number, AnchorRow> = {
  0: { 3: 2.4, 15: 2.8, 50: 3.2, 85: 3.7, 97: 4.2 },
  1: { 3: 3.2, 15: 3.6, 50: 4.2, 85: 4.8, 97: 5.5 },
  3: { 3: 4.5, 15: 5.2, 50: 5.8, 85: 6.6, 97: 7.4 },
  6: { 3: 5.8, 15: 6.4, 50: 7.3, 85: 8.2, 97: 9.1 },
  9: { 3: 6.5, 15: 7.3, 50: 8.2, 85: 9.2, 97: 10.2 },
  12: { 3: 7.0, 15: 7.9, 50: 8.9, 85: 10.1, 97: 11.2 },
  18: { 3: 8.1, 15: 9.1, 50: 10.2, 85: 11.6, 97: 12.9 },
  24: { 3: 9.0, 15: 10.1, 50: 11.5, 85: 13.1, 97: 14.8 },
}
const LENGTH_GIRL: Record<number, AnchorRow> = {
  0: { 3: 45.6, 15: 47.3, 50: 49.1, 85: 51.0, 97: 52.7 },
  1: { 3: 50.0, 15: 51.7, 50: 53.7, 85: 55.6, 97: 57.4 },
  3: { 3: 55.6, 15: 57.6, 50: 59.8, 85: 62.1, 97: 64.3 },
  6: { 3: 61.2, 15: 63.3, 50: 65.7, 85: 68.1, 97: 70.3 },
  9: { 3: 65.5, 15: 67.8, 50: 70.1, 85: 72.6, 97: 74.8 },
  12: { 3: 68.9, 15: 71.3, 50: 74.0, 85: 76.6, 97: 79.0 },
  18: { 3: 74.0, 15: 76.7, 50: 79.9, 85: 82.8, 97: 85.7 },
  24: { 3: 78.0, 15: 80.7, 50: 84.1, 85: 87.2, 97: 90.2 },
}
// Vòng đầu (cm) 0–24 tháng theo WHO Head Circumference-for-age (P3/15/50/85/97).
const HEAD_BOY: Record<number, AnchorRow> = {
  0: { 3: 32.1, 15: 33.1, 50: 34.5, 85: 35.8, 97: 36.9 },
  1: { 3: 35.0, 15: 36.0, 50: 37.2, 85: 38.5, 97: 39.4 },
  3: { 3: 38.3, 15: 39.3, 50: 40.5, 85: 41.7, 97: 42.7 },
  6: { 3: 41.0, 15: 42.1, 50: 43.3, 85: 44.6, 97: 45.6 },
  9: { 3: 42.6, 15: 43.7, 50: 45.0, 85: 46.3, 97: 47.4 },
  12: { 3: 43.6, 15: 44.7, 50: 46.1, 85: 47.4, 97: 48.5 },
  18: { 3: 44.9, 15: 46.0, 50: 47.4, 85: 48.7, 97: 49.9 },
  24: { 3: 45.7, 15: 46.8, 50: 48.3, 85: 49.7, 97: 50.8 },
}
const HEAD_GIRL: Record<number, AnchorRow> = {
  0: { 3: 31.7, 15: 32.7, 50: 33.9, 85: 35.1, 97: 36.1 },
  1: { 3: 34.3, 15: 35.3, 50: 36.5, 85: 37.7, 97: 38.7 },
  3: { 3: 37.2, 15: 38.2, 50: 39.5, 85: 40.8, 97: 41.9 },
  6: { 3: 39.8, 15: 40.9, 50: 42.2, 85: 43.6, 97: 44.7 },
  9: { 3: 41.3, 15: 42.4, 50: 43.8, 85: 45.2, 97: 46.3 },
  12: { 3: 42.3, 15: 43.5, 50: 44.9, 85: 46.3, 97: 47.4 },
  18: { 3: 43.6, 15: 44.8, 50: 46.2, 85: 47.7, 97: 48.8 },
  24: { 3: 44.6, 15: 45.7, 50: 47.2, 85: 48.6, 97: 49.8 },
}

function table(sex: Gender, measure: Measure): Record<number, AnchorRow> {
  if (measure === 'head') return sex === 'male' ? HEAD_BOY : HEAD_GIRL
  if (measure === 'height') return sex === 'male' ? LENGTH_BOY : LENGTH_GIRL
  return sex === 'male' ? WEIGHT_BOY : WEIGHT_GIRL
}

function clampMonth(month: number): number {
  return Math.min(24, Math.max(0, month))
}

/** Giá trị percentile tại tháng (nội suy tuyến tính giữa 2 mốc). */
export function percentileValue(
  sex: Gender,
  measure: Measure,
  month: number,
  percentile: GrowthPercentile,
): number {
  const m = clampMonth(month)
  const t = table(sex, measure)
  let lo = ANCHOR_MONTHS[0] as number
  for (const anchor of ANCHOR_MONTHS) {
    if (m <= (anchor as number)) break
    lo = anchor as number
  }
  const hi = (ANCHOR_MONTHS.find((a) => (a as number) >= m) ?? 24) as number
  if (lo === hi) return (t[lo] as AnchorRow)[percentile] as number
  const f = (m - lo) / (hi - lo)
  const vLo = (t[lo] as AnchorRow)[percentile] as number
  const vHi = (t[hi] as AnchorRow)[percentile] as number
  return Math.round((vLo + (vHi - vLo) * f) * 10) / 10
}

/** Xếp bé vào percentile gần nhất: '<p3' | 'p3' | 'p15' | 'p50' | 'p85' | 'p97' | '>p97'. */
export function growthPercentile(
  sex: Gender,
  measure: Measure,
  month: number,
  value: number,
): string {
  const m = clampMonth(month)
  const t = table(sex, measure)
  const lo = (ANCHOR_MONTHS.find((a) => (a as number) >= m) ?? 0) as number
  const row = t[lo] as AnchorRow
  if (value < (row[3] as number)) return '<p3'
  if (value > (row[97] as number)) return '>p97'
  let label: string = 'p3'
  for (const p of GROWTH_PERCENTILES) {
    if (value >= (row[p] as number)) label = 'p' + p
  }
  return label
}

// ---- Mốc phát triển theo giai đoạn ----
export const DEVELOPMENT_STAGES = ['newborn', 'age_1_6m', 'age_6_12m', 'age_12_24m'] as const
export type DevelopmentStage = (typeof DEVELOPMENT_STAGES)[number]

export const MILESTONES_BY_STAGE: Record<DevelopmentStage, { name: string; typicalMonth: number }[]> = {
  newborn: [
    { name: 'Mở mắt nhìn theo đồ vật gần', typicalMonth: 0 },
    { name: 'Ngóc đầu khi nằm sấp vài giây', typicalMonth: 1 },
  ],
  age_1_6m: [
    { name: 'Cười thành tiếng với người quen', typicalMonth: 3 },
    { name: 'Lẫy lật sấp–ngửa', typicalMonth: 5 },
    { name: 'Với tay cầm đồ vật', typicalMonth: 4 },
    { name: 'Ngồi có chống tay', typicalMonth: 6 },
  ],
  age_6_12m: [
    { name: 'Ngồi vững không chống', typicalMonth: 8 },
    { name: 'Bò trườn', typicalMonth: 9 },
    { name: 'Đứng bám vịn', typicalMonth: 10 },
    { name: 'Gọi "ba", "mẹ"', typicalMonth: 11 },
  ],
  age_12_24m: [
    { name: 'Đi vững', typicalMonth: 14 },
    { name: 'Nói từ đơn rõ nghĩa', typicalMonth: 15 },
    { name: 'Tự xúc ăn', typicalMonth: 16 },
    { name: 'Chạy nhảy', typicalMonth: 20 },
  ],
}

export function milestonesForStage(stage: DevelopmentStage): string[] {
  return MILESTONES_BY_STAGE[stage].map((m) => `${m.name} (tháng ${m.typicalMonth})`)
}

// ---------------------------------------------------------------------------
// demo
// ---------------------------------------------------------------------------
function demo(): void {
  const assert = (cond: boolean, msg: string): void => {
    if (!cond) throw new Error('growth.demo: ' + msg)
  }
  assert(percentileValue('male', 'weight', 0, 50) === 3.3, 'P50 bé trai 0m = 3.3kg')
  assert(percentileValue('female', 'height', 12, 50) === 74.0, 'P50 bé gái 12m = 74cm')
  assert(percentileValue('male', 'weight', 24, 97) === 15.3, 'P97 bé trai 24m = 15.3kg')
  assert(percentileValue('male', 'head', 12, 50) === 46.1, 'P50 vòng đầu bé trai 12m = 46.1cm')
  assert(percentileValue('female', 'head', 0, 50) === 33.9, 'P50 vòng đầu bé gái 0m = 33.9cm')
  assert(percentileValue('male', 'head', 24, 3) === 45.7, 'P3 vòng đầu bé trai 24m = 45.7cm')
  assert(growthPercentile('male', 'head', 6, 43.3) === 'p50', 'vòng đầu 43.3cm nam 6m → p50')
  assert(growthPercentile('female', 'head', 12, 46.5) === 'p85', 'vòng đầu 46.5cm nữ 12m → p85')
  assert(growthPercentile('male', 'head', 0, 31.0) === '<p3', 'vòng đầu 31.0cm nam 0m → <p3')
  assert(growthPercentile('male', 'weight', 0, 3.1) === 'p15', '3.1kg trong khoảng p15')
  assert(growthPercentile('male', 'weight', 0, 3.5) === 'p50', '3.5kg trong khoảng p50')
  assert(growthPercentile('male', 'weight', 0, 2.0) === '<p3', '2.0kg → <p3')
  assert(growthPercentile('male', 'weight', 0, 5.0) === '>p97', '5.0kg → >p97')
  assert(milestonesForStage('age_12_24m').length === 4, 'mốc 12–24m')
  console.log('✅ growth.ts OK')
}

const isMain = (): boolean =>
  (globalThis as { process?: { argv?: string[] } }).process?.argv?.[1]?.endsWith('growth.ts') === true
if (isMain()) demo()
