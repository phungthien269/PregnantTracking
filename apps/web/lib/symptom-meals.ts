// ===========================================================================
// symptom-meals.ts — gợi ý món ăn theo triệu chứng ăn uống khi mang thai
// (buồn nôn, chán ăn, đổi khẩu vị, ợ nóng). Thuần TS, không React — self-check
// chạy bằng node đơn lẻ (xem symptom-meals.check.ts).
//
// Nguồn dữ liệu: lib/nutrition/meals-data.ts (MEALS — món Việt kèm mealType/
// tags/trimester/nutrition). KHÔNG sửa meals-data; chọn món theo tags + mealType
// + nguyên liệu sẵn có (VD món có gừng, thịt gà, chuối — giàu vitamin B6).
//
// LƯU Ý: đây là nội dung GIÁO DỤC dinh dưỡng, không phải chẩn đoán y khoa,
// không thay thế lời khuyên bác sĩ.
// ===========================================================================

import { MEALS, type Meal, type MealType } from './nutrition/meals-data'

export type EatingSymptom = 'nausea' | 'loss_appetite' | 'taste_change' | 'heartburn'

export interface EatingSymptomDef {
  id: EatingSymptom
  /** Nhãn tiếng Việt hiển thị. */
  label: string
  /** Từ khoá khớp (chuỗi con, đã loại dấu tiếng Việt) trong text triệu chứng. */
  keywords: string[]
  /** Loại bữa ưu tiên — nâng điểm. */
  mealTypePreference: MealType[]
  /** Tag món ưu tiên — nâng điểm. */
  preferredTags: string[]
  /** Tag cần tránh — trừ điểm. */
  avoidTags: string[]
  /** Nguyên liệu (foodId) ưu tiên — VD gừng / thực phẩm giàu B6. */
  preferredIngredients: string[]
  /** Nguyên liệu cần tránh — VD cay/chua khi ợ nóng. */
  avoidIngredients: string[]
  /** Giới thiệu ngắn hiển thị trong UI. */
  intro: string
  /** Lưu ý chuyên môn (giáo dục, không chẩn đoán). */
  advice: string
  /** Dấu hiệu nên liên hệ bác sĩ. */
  danger: string[]
}

/** Bỏ dấu tiếng Việt + lowercase + đ→d để so khớp dù nhập có dấu hay không. */
export function normalizeVn(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
}

// Thứ tự mảng = thứ tự ưu tiên khi một triệu chứng khớp nhiều nhóm
// (buồn nôn là gợi ý cụ thể nhất nên đặt đầu).
export const CATEGORIES: EatingSymptomDef[] = [
  {
    id: 'nausea',
    label: 'Buồn nôn / ốm nghén',
    keywords: ['buồn nôn', 'nôn', 'ói mửa', 'ốm nghén', 'buồn miệng'],
    mealTypePreference: ['breakfast', 'snack', 'drink'],
    preferredTags: ['dễ tiêu hóa', 'thanh đạm', 'món cháo'],
    avoidTags: ['món cá béo', 'món nướng'],
    preferredIngredients: ['gung', 'thit-ga-ta', 'chuoi'],
    avoidIngredients: ['ot'],
    intro: 'Chọn món nhẹ, dễ tiêu, chia nhỏ bữa — ưu tiên món có gừng và thực phẩm giàu vitamin B6 (chuối, thịt gà, cá).',
    advice:
      'Khi ốm nghén: ăn nhiều bữa nhỏ trong ngày, tránh để bụng quá đói; ưu tiên món nhạt, ít mùi, dễ tiêu; gừng và vitamin B6 có thể giúp giảm buồn nôn. Tránh đồ chiên rán, nhiều dầu mỡ và cay nóng.',
    danger: [
      'Nôn nhiều, không giữ được thức ăn/nước trong 24 giờ.',
      'Dấu hiệu mất nước: tiểu ít, nước tiểu vàng sẫm, khô môi, hoa mắt, chóng mặt khi đứng.',
      'Sụt cân từ 5% trọng lượng cơ thể trở lên so với trước mang thai.',
      'Nôn ra máu hoặc dịch màu xanh/vàng đậm.',
      'Đau bụng dữ dội kèm nôn.',
    ],
  },
  {
    id: 'heartburn',
    label: 'Ợ nóng / trào ngược',
    keywords: ['ợ nóng', 'ợ chua', 'trào ngược', 'khó tiêu', 'nóng rát'],
    mealTypePreference: ['breakfast', 'dinner'],
    preferredTags: ['thanh đạm', 'dễ tiêu hóa', 'món cháo'],
    avoidTags: ['món chiên', 'món nướng', 'món cá béo'],
    preferredIngredients: [],
    avoidIngredients: ['ot', 'chanh', 'ca-chua'],
    intro: 'Chọn món thanh đạm, ít dầu mỡ, không cay không chua; ăn chậm, không nằm ngay sau khi ăn.',
    advice:
      'Ợ nóng khi mang thai thường do hormone làm giãn cơ thắt thực quản. Nên ăn nhiều bữa nhỏ, tránh ăn no một lần, hạn chế đồ chiên rán, cay, chua và nước có ga; không nằm trong 1–2 giờ sau bữa ăn.',
    danger: [
      'Đau ngực dữ dội, khó thở, đau lan lên cổ/vai/cánh tay, vã mồ hôi — cần cấp cứu.',
      'Nôn ra máu hoặc đi ngoài phân đen.',
      'Khó nuốt hoặc đau khi nuốt.',
      'Ợ nóng kéo dài dù đã thay đổi ăn uống.',
    ],
  },
  {
    id: 'loss_appetite',
    label: 'Chán ăn',
    keywords: ['chán ăn', 'ăn không ngon', 'không muốn ăn', 'biếng ăn', 'mất cảm giác thèm ăn', 'ăn ít'],
    mealTypePreference: ['snack', 'breakfast', 'drink'],
    preferredTags: ['dễ tiêu hóa', 'thanh đạm', 'món cháo', 'nhanh gọn'],
    avoidTags: ['món chiên', 'món nướng'],
    preferredIngredients: ['chuoi'],
    avoidIngredients: ['ot'],
    intro: 'Chia nhỏ thành nhiều bữa phụ dễ ăn, ưu tiên món nhẹ, không ép bản thân ăn quá no.',
    advice:
      'Chán ăn trong thai kỳ khá phổ biến. Hãy ăn thành 5–6 bữa nhỏ, chọn món dễ nuốt, giàu chất dinh dưỡng; uống đủ nước giữa các bữa. Nếu mẹ ăn rất ít kéo dài, hãy trao đổi với bác sĩ để bổ sung dinh dưỡng phù hợp.',
    danger: [
      'Không ăn/uống được gì trong 24 giờ hoặc dấu hiệu mất nước.',
      'Sụt cân liên tục không rõ nguyên nhân.',
      'Chán ăn kèm sốt, đau bụng hoặc nôn nhiều.',
    ],
  },
  {
    id: 'taste_change',
    label: 'Đổi khẩu vị',
    keywords: ['đổi khẩu vị', 'thay đổi khẩu vị', 'thay đổi vị giác', 'kén ăn', 'ngán', 'ghét mùi'],
    mealTypePreference: ['breakfast', 'snack'],
    preferredTags: ['thanh đạm', 'dễ tiêu hóa', 'món cháo', 'nhiều rau'],
    avoidTags: ['món chiên', 'món nướng', 'món cá béo'],
    preferredIngredients: [],
    avoidIngredients: ['ot'],
    intro: 'Khẩu vị thay đổi do hormone là bình thường — thử nhiều món nhẹ, vị nhạt, ăn thành nhiều bữa nhỏ.',
    advice:
      'Một số mẹ thấy ngán món quen thuộc hoặc thèm vị lạ khi mang thai. Hãy linh hoạt thử các món khác nhau, chia nhỏ bữa; nếu món nào gây buồn nôn thì không ép ăn. Ưu tiên thức ăn đã nấu chín, an toàn thực phẩm.',
    danger: [
      'Sụt cân không rõ nguyên nhân do không ăn được.',
      'Không ăn/uống được gì trong 24 giờ hoặc dấu hiệu mất nước.',
      'Kèm đau bụng, sốt hoặc nôn nhiều.',
    ],
  },
]

export function getCategory(id: EatingSymptom): EatingSymptomDef {
  const def = CATEGORIES.find((c) => c.id === id)
  if (!def) throw new Error(`symptom-meals: không có nhóm "${id}"`)
  return def
}

/** So khớp từ khoá trong text đã normalize; 'nôn' (→ 'non') chặn nhầm 'nóng'/'nồng' (→ 'nong'). */
function keywordMatches(text: string, keyword: string): boolean {
  const k = normalizeVn(keyword)
  if (k === 'non') return /non(?!g)/.test(text)
  return text.includes(k)
}

/** Nhận diện nhóm triệu chứng ăn uống từ text (không phân biệt dấu/hoa thường). */
export function detectEatingSymptom(symptomText: string): EatingSymptom | null {
  const t = normalizeVn(symptomText)
  for (const def of CATEGORIES) {
    if (def.keywords.some((k) => keywordMatches(t, k))) return def.id
  }
  return null
}

/** Tuần thai → tam cá nguyệt theo quy ước meals-data (T1 = 1–13, T2 = 14–26, T3 = 27–42). */
export function trimesterOfWeek(week: number | null | undefined): '1' | '2' | '3' | null {
  if (week == null || week < 1) return null
  if (week <= 13) return '1'
  if (week <= 26) return '2'
  return '3'
}

function scoreMeal(meal: Meal, def: EatingSymptomDef, trimester: '1' | '2' | '3' | null): number {
  let s = 0
  if (trimester) s += meal.trimester.includes(trimester) ? 3 : -6
  if (def.mealTypePreference.includes(meal.mealType)) s += 2
  for (const tag of meal.tags) {
    if (def.preferredTags.includes(tag)) s += 2
    if (def.avoidTags.includes(tag)) s -= 4
  }
  const ing = new Set(meal.ingredients.map((i) => i.foodId))
  for (const f of def.preferredIngredients) if (ing.has(f)) s += 2
  for (const f of def.avoidIngredients) if (ing.has(f)) s -= 3
  return s
}

export interface MealSuggestion {
  meal: Meal
  score: number
}

/**
 * Gợi ý món cho một nhóm triệu chứng: lọc theo tam cá nguyệt (nếu có tuần),
 * chấm điểm theo tags/mealType/nguyên liệu, trả top `limit` món (score > 0).
 * Món trả về luôn là phần tử của MEALS (nguồn duy nhất).
 */
export function suggestMeals(
  category: EatingSymptom,
  opts: { week?: number | null; limit?: number } = {},
): MealSuggestion[] {
  const def = getCategory(category)
  const trimester = trimesterOfWeek(opts.week ?? null)
  const limit = Math.max(1, opts.limit ?? 4)
  return MEALS.map((meal) => ({ meal, score: scoreMeal(meal, def, trimester) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.meal.id.localeCompare(b.meal.id))
    .slice(0, limit)
}

export interface SymptomMealPlan {
  category: EatingSymptom
  def: EatingSymptomDef
  /** Các dòng triệu chứng đã khớp vào nhóm này. */
  matchedSymptoms: string[]
  suggestions: MealSuggestion[]
}

/**
 * Gộp danh sách triệu chứng đang active thành các nhóm ăn uống + gợi ý món.
 * Chỉ giữ triệu chứng thuộc nhóm ăn uống đã biết; triệu chứng khác bỏ qua.
 */
export function buildMealPlan(
  symptoms: Array<{ symptom: string }>,
  opts: { week?: number | null; limit?: number } = {},
): SymptomMealPlan[] {
  const seen = new Map<EatingSymptom, string[]>()
  for (const s of symptoms) {
    const c = detectEatingSymptom(s.symptom)
    if (!c) continue
    const arr = seen.get(c) ?? []
    arr.push(s.symptom)
    seen.set(c, arr)
  }
  return [...seen.entries()].map(([id, matched]) => ({
    category: id,
    def: getCategory(id),
    matchedSymptoms: matched,
    suggestions: suggestMeals(id, opts),
  }))
}
