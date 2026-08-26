// ===========================================================================
// intake-calcs.ts — tính vi chất cho nhật ký dinh dưỡng hằng ngày (Agent 6J).
// Thuần TS, KHÔNG import lib/ai (AI nằm ở lib/ai/intake-estimator.ts riêng).
//
// Trách nhiệm:
//  1. `computeItemNutrition` — tính vi chất 1 item từ SỐ LIỆU THẬT:
//       meal  → computeMealNutrition (meals-data, 1 suất) × qty
//       food  → FOODS.per100g × amount_g/100
//       supplement → map tên TPCN → vi chất (keyword) × dose/pill × pills
//     Không tìm được → estimated=true, nutrients rỗng → giao AI ước tính.
//  2. `aggregateNutrients` — tổng vi chất nhiều item.
//  3. `trimesterForWeek` / `buildNutrientSummary` — so nhu cầu tuần thai
//     (nutrient-reference-data) → % đủ/thiếu cho UI.
//
// Đơn vị thống nhất theo nutrient-reference-data.ts:
//   energy kcal · protein/fiber/water(L) · folate/iodine/vitamin_b12 mcg ·
//   iron/calcium/zinc/choline/vitamin_c mg · vitamin_d IU (foods-data lưu mcg → ×40) ·
//   dha mg · vitamin_a mcg RAE.
// ===========================================================================

import type { FoodNutrition } from './foods-data'
import { getMeal } from './meals-data'
import { getFood } from './foods-data'
import { getNutrientReference, type Trimester } from './nutrient-reference-data'
import type {
  IntakeItemInput,
  NutrientId,
  NutrientSummary,
  NutrientTotal,
  NutrientValueMap,
} from '../data/api'

/** 15 vi chất chuẩn — khớp nutrient-reference-data.ts. */
export const NUTRIENT_IDS: readonly NutrientId[] = [
  'energy',
  'protein',
  'folate',
  'iron',
  'calcium',
  'vitamin_d',
  'dha',
  'iodine',
  'zinc',
  'vitamin_b12',
  'choline',
  'vitamin_c',
  'fiber',
  'water',
  'vitamin_a',
]

const round1 = (x: number): number => Math.round(x * 10) / 10

/** map FoodNutrition (foods-data / meal.nutrition) → NutrientValueMap. `scale` = hệ số khẩu phần. */
function foodToNutrients(f: FoodNutrition, scale: number): NutrientValueMap {
  const out: NutrientValueMap = {}
  out.energy = round1(f.kcal * scale)
  out.protein = round1(f.protein * scale)
  out.fiber = round1(f.fiber * scale)
  out.iron = round1(f.iron * scale)
  out.calcium = round1(f.calcium * scale)
  out.folate = round1(f.folate * scale)
  out.vitamin_c = round1(f.vitaminC * scale)
  out.vitamin_d = round1(f.vitaminD * 40 * scale) // foods-data lưu mcg → IU (×40)
  out.zinc = round1(f.zinc * scale)
  out.iodine = round1(f.iodine * scale)
  out.dha = round1(f.omega3 * scale) // omega3 = EPA+DHA (mg) → dha (mg)
  return out
}

// ---- Map TPCN → vi chất (theo tên, keyword tiếng Việt) ----
// ponytail: keyword thô — tên lạ không khớp → estimated=true, AI ước tính.
// `dose_mg` được hiểu là "hàm lượng mỗi viên theo đơn vị của vi chất đó"
// (VD viên sắt 27 = 27 mg; folate 400 = 400 mcg; vitamin D 400 = 400 IU).
const SUPPLEMENT_KEYWORDS: { id: NutrientId; words: string[] }[] = [
  { id: 'iron', words: ['sắt', 'iron', 'ferro', 'ferrous', 'fumarate'] },
  { id: 'folate', words: ['folate', 'folic', 'acid folic', 'axit folic'] },
  { id: 'calcium', words: ['canxi', 'calci', 'calcium'] },
  { id: 'vitamin_d', words: ['vitamin d', 'vit d', 'vitamin d3', ' d3', 'cholecalciferol', 'colecalciferol'] },
  { id: 'dha', words: ['dha', 'omega-3', 'omega 3', 'omega3', 'dầu cá', 'dau ca', 'epa', 'tảo'] },
  { id: 'iodine', words: ['i-ốt', 'iốt', 'iot', 'iodine', 'kali iodid'] },
  { id: 'zinc', words: ['kẽm', 'kem', 'zinc', 'zinc gluconat'] },
  { id: 'vitamin_b12', words: ['b12', 'vitamin b12', 'cobalamin', 'cyanocobalamin'] },
  { id: 'choline', words: ['choline', 'colin'] },
  { id: 'vitamin_c', words: ['vitamin c', 'vit c', 'ascorbic', 'acid ascorbic'] },
  { id: 'vitamin_a', words: ['vitamin a', 'retinol', 'beta-caroten', 'betacaroten'] },
  { id: 'protein', words: ['protein', 'đạm', 'dam', 'whey'] },
  { id: 'fiber', words: ['chất xơ', 'chat xo', 'fiber'] },
]

/** Map TPCN sang vi chất đơn lẻ theo tên + hàm lượng. Trả null nếu không nhận diện được. */
function mapSupplement(item: IntakeItemInput): NutrientValueMap | null {
  const name = item.name.toLocaleLowerCase('vi')
  const amount = (item.dose_mg ?? 0) * (item.pills ?? 1)
  if (amount <= 0) return null
  for (const s of SUPPLEMENT_KEYWORDS) {
    if (s.words.some((w) => name.includes(w))) return { [s.id]: round1(amount) }
  }
  return null
}

/**
 * Tính vi chất 1 item từ số liệu thật. Trả về `estimated`:
 *  - false khi dùng số liệu DB (MEALS/FOODS) hoặc TPCN nhận diện được.
 *  - true khi không có số liệu → caller gọi AI ước tính (estimated giữ nguyên true).
 */
export function computeItemNutrition(item: IntakeItemInput): {
  nutrients: NutrientValueMap
  estimated: boolean
} {
  if (item.kind === 'meal' && item.ref_id) {
    const meal = getMeal(item.ref_id)
    if (meal) return { nutrients: foodToNutrients(meal.nutrition, item.qty ?? 1), estimated: false }
  }
  if (item.kind === 'food' && item.ref_id && item.amount_g) {
    const food = getFood(item.ref_id)
    if (food) return { nutrients: foodToNutrients(food.per100g, item.amount_g / 100), estimated: false }
  }
  if (item.kind === 'supplement') {
    const mapped = mapSupplement(item)
    if (mapped) return { nutrients: mapped, estimated: false }
  }
  return { nutrients: {}, estimated: true }
}

/** Tổng vi chất nhiều item (item thiếu chất = 0, bỏ qua). */
export function aggregateNutrients(items: { nutrients: NutrientValueMap }[]): NutrientValueMap {
  const out: NutrientValueMap = {}
  for (const item of items) {
    for (const [id, v] of Object.entries(item.nutrients)) {
      const key = id as NutrientId
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[key] = round1((out[key] ?? 0) + v)
    }
  }
  return out
}

/** T1 = tuần 1–13 · T2 = 14–27 · T3 = 28–40 (chuẩn ACOG/WHO — tuần 27 = T2). */
export function trimesterForWeek(week: number): Trimester {
  if (week <= 13) return 'T1'
  if (week <= 27) return 'T2'
  return 'T3'
}

/**
 * So tổng vi chất một kỳ với nhu cầu tuần thai → bảng % đủ/thiếu.
 * `week = null` (chưa có thai kỳ) → `need = null`, `pct = null` (chỉ hiển thị số nạp).
 */
export function buildNutrientSummary(
  from: string,
  to: string,
  days: { date: string; nutrients: NutrientValueMap; itemCount: number }[],
  week: number | null,
): NutrientSummary {
  const trimester = week ? trimesterForWeek(week) : null
  const totals: NutrientTotal[] = NUTRIENT_IDS.map((id) => {
    const ref = getNutrientReference(id)
    const amount = round1(days.reduce((acc, d) => acc + (d.nutrients[id] ?? 0), 0))
    const need = trimester && ref ? ref.needs[trimester].value : null
    // need = 0 (năng lượng T1 "không cần tăng") → không tính %.
    const pct = need != null && need > 0 ? Math.round((amount / need) * 100) : null
    return { id, name: ref?.name ?? id, unit: ref?.unit ?? '', amount, need, pct }
  })
  return { from, to, days, totals, week }
}

/** Chất thiếu dai dẳng trong một kỳ (dùng cho mục "phân tích lịch sử" — không cần AI). */
export interface DeficiencySuggestion {
  id: NutrientId
  name: string
  unit: string
  total: number
  need: number | null
  pct: number | null
  /** số ngày nạp < ngưỡng (so nhu cầu ngày). */
  lowDays: number
  totalDays: number
  /** món/thực phẩm gợi ý (có nguồn trong nutrient-reference-data). */
  foodSuggestions: string[]
  note: string
}

/**
 * Nhận diện chất có `pct` chung kỳ < `thresholdPct` + đếm số ngày thiếu, kèm món
 * gợi ý (foodSources). Thuần TS, UI gọi trên `getNutrientSummary({from,to})` 3 tháng.
 */
export function analyzeDeficiencies(summary: NutrientSummary, thresholdPct = 80): DeficiencySuggestion[] {
  const totalDays = summary.days.length
  if (totalDays === 0) return []
  const out: DeficiencySuggestion[] = []
  for (const t of summary.totals) {
    if (t.need === null || t.pct === null || t.pct >= thresholdPct) continue
    // Chỉ kết luận "thiếu" cho vi chất NGƯỜI DÙNG THỰC SỰ THEO DÕI (có ngày nạp > 0).
    // Vi chất chưa track được (VD water, B12, choline — foods-data không có) → 0 tuyệt
    // đối mọi ngày → bỏ qua, tránh cảnh báo nhiễu.
    const tracked = summary.days.some((d) => (d.nutrients[t.id] ?? 0) > 0)
    if (!tracked) continue
    // Chốt `t.need` (đã narrowed number ở guard trên) vào const — TS không giữ
    // narrowed cho thuộc tính object bên trong callback (closure có thể gọi sau).
    const need = t.need
    const lowDays = summary.days.filter((d) => {
      const dayAmt = d.nutrients[t.id] ?? 0
      return dayAmt / need < thresholdPct / 100
    }).length
    const ref = getNutrientReference(t.id)
    out.push({
      id: t.id,
      name: t.name,
      unit: t.unit,
      total: t.amount,
      need: t.need,
      pct: t.pct,
      lowDays,
      totalDays,
      foodSuggestions: ref?.foodSources.slice(0, 4) ?? [],
      note: ref?.weekNotes ?? '',
    })
  }
  return out.sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))
}
