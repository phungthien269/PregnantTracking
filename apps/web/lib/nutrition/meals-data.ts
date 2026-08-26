// ===========================================================================
// meals-data.ts — cơ sở dữ liệu món ăn Việt (bữa chính + bữa phụ) cho thai kỳ.
// Dinh dưỡng mỗi món được TÍNH TỰ ĐỘNG từ nguyên liệu (quy về foods-data.ts).
// Thuần TS (không dependency) để self-check chạy bằng node đơn lẻ.
//
// Cách dùng: tổng dinh dưỡng = Σ(food.per100g × lượng g / 100), làm tròn 1 số lẻ.
// Lượng nguyên liệu là phần ăn được (đã nấu chín) — giá trị tham khảo cho 1 suất.
// Mốc phù hợp tam cá nguyệt: T1 = tuần 1–13, T2 = tuần 14–26, T3 = tuần 27–40 (KB GĐ2).
// ===========================================================================

import { FOODS, type FoodNutrition } from './foods-data'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink'

export const MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'drink']

export type Trimester = '1' | '2' | '3'

export const TRIMESTERS: readonly Trimester[] = ['1', '2', '3']

export interface MealIngredient {
  /** Trỏ tới `FoodItem.id` trong foods-data.ts. */
  foodId: string
  /** Lượng dùng (g) cho 1 suất. */
  amountG: number
}

/** Dinh dưỡng tổng của món (1 suất) — cùng trường với FoodNutrition. */
export type MealNutrition = FoodNutrition

export interface Meal {
  id: string
  name: string
  /** breakfast= sáng · lunch= trưa · dinner= tối · snack= phụ · drink= đồ uống. */
  mealType: MealType
  /** Mô tả khẩu phần tham khảo. */
  serving: string
  ingredients: MealIngredient[]
  /** Tổng dinh dưỡng tính từ nguyên liệu (đã làm tròn). */
  nutrition: MealNutrition
  tags: string[]
  trimester: Trimester[]
  note: string
}

function round1(x: number): number {
  return Math.round(x * 10) / 10
}

function zeroNutrition(): MealNutrition {
  return {
    kcal: 0,
    protein: 0,
    carb: 0,
    fat: 0,
    fiber: 0,
    iron: 0,
    calcium: 0,
    folate: 0,
    vitaminC: 0,
    vitaminD: 0,
    zinc: 0,
    iodine: 0,
    omega3: 0,
    sodium: 0,
    sugar: 0,
  }
}

/**
 * Tính dinh dưỡng tổng từ danh sách nguyên liệu.
 * Ném lỗi nếu có nguyên liệu trỏ tới food id không tồn tại — bảo vệ tính toàn vẹn dữ liệu.
 */
export function computeMealNutrition(ingredients: MealIngredient[]): MealNutrition {
  const out = zeroNutrition()
  for (const ing of ingredients) {
    const food = getFoodOrThrow(ing.foodId)
    const k = ing.amountG / 100
    out.kcal += food.per100g.kcal * k
    out.protein += food.per100g.protein * k
    out.carb += food.per100g.carb * k
    out.fat += food.per100g.fat * k
    out.fiber += food.per100g.fiber * k
    out.iron += food.per100g.iron * k
    out.calcium += food.per100g.calcium * k
    out.folate += food.per100g.folate * k
    out.vitaminC += food.per100g.vitaminC * k
    out.vitaminD += food.per100g.vitaminD * k
    out.zinc += food.per100g.zinc * k
    out.iodine += food.per100g.iodine * k
    out.omega3 += food.per100g.omega3 * k
    out.sodium += food.per100g.sodium * k
    out.sugar += food.per100g.sugar * k
  }
  for (const key of Object.keys(out) as (keyof MealNutrition)[]) {
    out[key] = round1(out[key])
  }
  return out
}

function getFoodOrThrow(foodId: string) {
  const food = FOODS.find((f) => f.id === foodId)
  if (!food) {
    throw new Error(`meals-data: nguyên liệu trỏ tới thực phẩm không tồn tại "${foodId}"`)
  }
  return food
}

/** Dựng một món: tính dinh dưỡng tự động từ nguyên liệu. */
function meal(m: Omit<Meal, 'nutrition'>): Meal {
  return { ...m, nutrition: computeMealNutrition(m.ingredients) }
}

// ===========================================================================
// 47 MÓN ĂN VIỆT — bữa chính + bữa phụ
// ===========================================================================
export const MEALS: Meal[] = [
  // ---- BỮA SÁNG (breakfast) ----
  meal({
    id: 'pho-bo',
    name: 'Phở bò',
    mealType: 'breakfast',
    serving: '1 tô (khoảng 500 g)',
    ingredients: [
      { foodId: 'banh-pho', amountG: 200 },
      { foodId: 'thit-bo-nac', amountG: 80 },
      { foodId: 'hanh-la', amountG: 10 },
      { foodId: 'gung', amountG: 5 },
      { foodId: 'rau-thom', amountG: 10 },
      { foodId: 'nuoc-mam', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 2 },
    ],
    tags: ['món bún-phở', 'giàu sắt', 'giàu protein', 'dễ tiêu hóa'],
    trimester: ['1', '2', '3'],
    note: 'Phở bò đủ đạm + sắt heme; nhớ ăn kèm rau thơm và ít quất/chanh để tăng hấp thu sắt.',
  }),
  meal({
    id: 'pho-ga',
    name: 'Phở gà',
    mealType: 'breakfast',
    serving: '1 tô (khoảng 500 g)',
    ingredients: [
      { foodId: 'banh-pho', amountG: 200 },
      { foodId: 'thit-ga-ta', amountG: 80 },
      { foodId: 'hanh-la', amountG: 10 },
      { foodId: 'gung', amountG: 5 },
      { foodId: 'rau-thom', amountG: 10 },
      { foodId: 'nuoc-mam', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 2 },
    ],
    tags: ['món bún-phở', 'giàu protein', 'dễ tiêu hóa', 'thanh đạm'],
    trimester: ['1', '2', '3'],
    note: 'Lựa chọn ít béo hơn phở bò, dễ ăn cho mẹ ốm nghén.',
  }),
  meal({
    id: 'bun-rieu',
    name: 'Bún riêu cua',
    mealType: 'breakfast',
    serving: '1 tô (khoảng 500 g)',
    ingredients: [
      { foodId: 'bun-tuoi', amountG: 200 },
      { foodId: 'cua', amountG: 50 },
      { foodId: 'tom', amountG: 40 },
      { foodId: 'ca-chua', amountG: 60 },
      { foodId: 'dau-phu', amountG: 30 },
      { foodId: 'rau-thom', amountG: 10 },
      { foodId: 'nuoc-mam', amountG: 10 },
      { foodId: 'muoi-iot', amountG: 2 },
    ],
    tags: ['món bún-phở', 'giàu kẽm', 'giàu protein'],
    trimester: ['1', '2', '3'],
    note: 'Cua + tôm cho kẽm, protein; nước dùng chua nhẹ dễ ăn.',
  }),
  meal({
    id: 'chao-ca',
    name: 'Cháo cá',
    mealType: 'breakfast',
    serving: '1 bát (khoảng 350 g)',
    ingredients: [
      { foodId: 'gao-trang', amountG: 50 },
      { foodId: 'ca-loc', amountG: 60 },
      { foodId: 'gung', amountG: 3 },
      { foodId: 'hanh-la', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 2 },
      { foodId: 'dau-an-thuc-vat', amountG: 3 },
    ],
    tags: ['dễ tiêu hóa', 'món cháo', 'thanh đạm', 'giàu protein'],
    trimester: ['1', '2', '3'],
    note: 'Cháo mềm dễ tiêu — lựa chọn tốt cho mẹ ốm nghén T1.',
  }),
  meal({
    id: 'chao-trung-thit-bam',
    name: 'Cháo trứng thịt băm',
    mealType: 'breakfast',
    serving: '1 bát (khoảng 350 g)',
    ingredients: [
      { foodId: 'gao-trang', amountG: 50 },
      { foodId: 'trung-ga', amountG: 50 },
      { foodId: 'thit-lon-nac', amountG: 40 },
      { foodId: 'hanh-la', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 2 },
    ],
    tags: ['dễ tiêu hóa', 'món cháo', 'giàu protein', 'giàu choline'],
    trimester: ['1', '2', '3'],
    note: 'Trứng + thịt băm cho choline và đạm; cháo ít dầu mỡ.',
  }),
  meal({
    id: 'xoi-dau-xanh',
    name: 'Xôi đậu xanh',
    mealType: 'breakfast',
    serving: '1 đĩa (khoảng 200 g)',
    ingredients: [
      { foodId: 'gao-nep', amountG: 100 },
      { foodId: 'dau-xanh-hat', amountG: 30 },
      { foodId: 'duong-trang', amountG: 10 },
      { foodId: 'vung', amountG: 5 },
    ],
    tags: ['giàu folate', 'giàu năng lượng', 'món xôi'],
    trimester: ['1', '2', '3'],
    note: 'Đậu xanh giàu folate; xôi no lâu — phù hợp T2/T3 khi cần tăng năng lượng.',
  }),
  meal({
    id: 'banh-mi-trung',
    name: 'Bánh mì trứng',
    mealType: 'breakfast',
    serving: '1 ổ (khoảng 200 g)',
    ingredients: [
      { foodId: 'banh-mi-trang', amountG: 70 },
      { foodId: 'trung-ga', amountG: 50 },
      { foodId: 'dua-chuot', amountG: 30 },
      { foodId: 'ca-chua', amountG: 30 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 1 },
    ],
    tags: ['nhanh gọn', 'giàu protein', 'giàu choline'],
    trimester: ['1', '2', '3'],
    note: 'Trứng nấu chín kỹ; thêm rau để tăng chất xơ.',
  }),
  meal({
    id: 'banh-mi-thit',
    name: 'Bánh mì thịt',
    mealType: 'breakfast',
    serving: '1 ổ (khoảng 200 g)',
    ingredients: [
      { foodId: 'banh-mi-trang', amountG: 70 },
      { foodId: 'thit-lon-nac', amountG: 50 },
      { foodId: 'dua-chuot', amountG: 30 },
      { foodId: 'ca-chua', amountG: 30 },
      { foodId: 'rau-thom', amountG: 10 },
      { foodId: 'nuoc-mam', amountG: 5 },
      { foodId: 'dau-an-thuc-vat', amountG: 3 },
    ],
    tags: ['nhanh gọn', 'giàu protein', 'giàu năng lượng'],
    trimester: ['1', '2', '3'],
    note: 'Chọn thịt nạc nướng/áp chảo ít mỡ; ít sốt béo.',
  }),
  meal({
    id: 'bun-bo-hue',
    name: 'Bún bò Huế',
    mealType: 'breakfast',
    serving: '1 tô (khoảng 550 g)',
    ingredients: [
      { foodId: 'bun-tuoi', amountG: 200 },
      { foodId: 'thit-bo-nac', amountG: 70 },
      { foodId: 'hanh-tay', amountG: 10 },
      { foodId: 'rau-thom', amountG: 10 },
      { foodId: 'ot', amountG: 2 },
      { foodId: 'nuoc-mam', amountG: 10 },
      { foodId: 'muoi-iot', amountG: 2 },
    ],
    tags: ['món bún-phở', 'giàu sắt', 'giàu protein'],
    trimester: ['2', '3'],
    note: 'Đậm đà, cay nhẹ — mẹ bị ợ nóng/ốm nghén T1 nên chọn món thanh hơn.',
  }),
  meal({
    id: 'mi-quang',
    name: 'Mì Quảng',
    mealType: 'breakfast',
    serving: '1 tô (khoảng 450 g)',
    ingredients: [
      { foodId: 'mi-soi', amountG: 150 },
      { foodId: 'thit-ga-ta', amountG: 60 },
      { foodId: 'tom', amountG: 30 },
      { foodId: 'dau-phong', amountG: 10 },
      { foodId: 'vung', amountG: 5 },
      { foodId: 'rau-thom', amountG: 10 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
      { foodId: 'nuoc-mam', amountG: 10 },
    ],
    tags: ['món bún-phở', 'giàu protein', 'giàu canxi'],
    trimester: ['1', '2', '3'],
    note: 'Mì Quảng đủ đạm; bánh tráng nướng ăn kèm nên hạn chế vì muối.',
  }),
  meal({
    id: 'banh-cuon',
    name: 'Bánh cuốn',
    mealType: 'breakfast',
    serving: '1 đĩa (khoảng 300 g)',
    ingredients: [
      { foodId: 'banh-pho', amountG: 150 },
      { foodId: 'thit-lon-nac', amountG: 50 },
      { foodId: 'nam-mo', amountG: 20 },
      { foodId: 'dua-chuot', amountG: 30 },
      { foodId: 'gia-do', amountG: 20 },
      { foodId: 'nuoc-mam', amountG: 10 },
      { foodId: 'dau-an-thuc-vat', amountG: 3 },
    ],
    tags: ['dễ tiêu hóa', 'thanh đạm', 'món bánh'],
    trimester: ['1', '2', '3'],
    note: 'Giá đỗ nên chần chín; nước chấm ít mặn.',
  }),
  meal({
    id: 'chao-yen-mach',
    name: 'Cháo yến mạch trái cây',
    mealType: 'breakfast',
    serving: '1 bát (khoảng 300 g)',
    ingredients: [
      { foodId: 'yen-mach-kho', amountG: 40 },
      { foodId: 'sua-bo-tuoi', amountG: 150 },
      { foodId: 'chuoi', amountG: 50 },
      { foodId: 'vung', amountG: 5 },
      { foodId: 'mat-ong', amountG: 10 },
    ],
    tags: ['giàu chất xơ', 'giàu canxi', 'món ngũ cốc'],
    trimester: ['1', '2', '3'],
    note: 'Yến mạch giàu chất xơ hòa tan — tốt cho tiêu hóa và kiểm soát đường huyết.',
  }),

  // ---- BỮA TRƯA (lunch) ----
  meal({
    id: 'com-ca-kho',
    name: 'Cơm cá kho',
    mealType: 'lunch',
    serving: '1 suất (cơm ~250 g)',
    ingredients: [
      { foodId: 'com-trang', amountG: 250 },
      { foodId: 'ca-thu', amountG: 100 },
      { foodId: 'nuoc-mam', amountG: 10 },
      { foodId: 'gung', amountG: 3 },
      { foodId: 'ot', amountG: 2 },
      { foodId: 'duong-trang', amountG: 5 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
      { foodId: 'hanh-la', amountG: 5 },
    ],
    tags: ['món cá béo', 'giàu DHA', 'giàu protein'],
    trimester: ['2', '3'],
    note: 'Cá thu giàu DHA — nhấn mạnh cho T2/T3 (não thai nhi phát triển).',
  }),
  meal({
    id: 'com-thit-kho-trung',
    name: 'Cơm thịt kho trứng',
    mealType: 'lunch',
    serving: '1 suất (cơm ~250 g)',
    ingredients: [
      { foodId: 'com-trang', amountG: 250 },
      { foodId: 'thit-lon-nac', amountG: 80 },
      { foodId: 'trung-ga', amountG: 50 },
      { foodId: 'nuoc-mam', amountG: 10 },
      { foodId: 'duong-trang', amountG: 5 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
      { foodId: 'hanh-la', amountG: 5 },
    ],
    tags: ['giàu protein', 'giàu choline', 'món mặn'],
    trimester: ['1', '2', '3'],
    note: 'Trứng + thịt cho choline và đạm; kho ít mỡ để giảm natri.',
  }),
  meal({
    id: 'com-ga-kho-gung',
    name: 'Cơm gà kho gừng',
    mealType: 'lunch',
    serving: '1 suất (cơm ~250 g)',
    ingredients: [
      { foodId: 'com-trang', amountG: 250 },
      { foodId: 'thit-ga-ta', amountG: 100 },
      { foodId: 'gung', amountG: 10 },
      { foodId: 'nuoc-mam', amountG: 10 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
      { foodId: 'hanh-la', amountG: 5 },
    ],
    tags: ['giàu protein', 'thanh đạm', 'món mặn'],
    trimester: ['1', '2', '3'],
    note: 'Gừng giúp dễ tiêu, ấm bụng — hợp mẹ ốm nghén.',
  }),
  meal({
    id: 'com-tam-suon-nuong',
    name: 'Cơm tấm sườn nướng',
    mealType: 'lunch',
    serving: '1 suất (cơm ~200 g)',
    ingredients: [
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'thit-lon-nac', amountG: 80 },
      { foodId: 'dua-chuot', amountG: 30 },
      { foodId: 'ca-chua', amountG: 30 },
      { foodId: 'hanh-la', amountG: 5 },
      { foodId: 'nuoc-mam', amountG: 10 },
      { foodId: 'duong-trang', amountG: 5 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
    ],
    tags: ['giàu protein', 'giàu năng lượng', 'món nướng'],
    trimester: ['2', '3'],
    note: 'Sườn nướng hạn chế phần cháy; ăn kèm dưa leo để cân bằng.',
  }),
  meal({
    id: 'bun-thit-nuong',
    name: 'Bún thịt nướng',
    mealType: 'lunch',
    serving: '1 tô (khoảng 450 g)',
    ingredients: [
      { foodId: 'bun-tuoi', amountG: 200 },
      { foodId: 'thit-lon-nac', amountG: 80 },
      { foodId: 'dua-chuot', amountG: 50 },
      { foodId: 'gia-do', amountG: 30 },
      { foodId: 'ca-rot', amountG: 20 },
      { foodId: 'rau-thom', amountG: 10 },
      { foodId: 'dau-phong', amountG: 10 },
      { foodId: 'nuoc-mam', amountG: 15 },
      { foodId: 'duong-trang', amountG: 5 },
    ],
    tags: ['món bún-phở', 'giàu protein', 'nhiều rau'],
    trimester: ['2', '3'],
    note: 'Giá đỗ nên chần chín; nước mắm pha loãng để giảm muối.',
  }),
  meal({
    id: 'bun-cha',
    name: 'Bún chả',
    mealType: 'lunch',
    serving: '1 suất (khoảng 450 g)',
    ingredients: [
      { foodId: 'bun-tuoi', amountG: 200 },
      { foodId: 'thit-lon-nac', amountG: 80 },
      { foodId: 'dua-chuot', amountG: 50 },
      { foodId: 'ca-rot', amountG: 20 },
      { foodId: 'rau-thom', amountG: 10 },
      { foodId: 'nuoc-mam', amountG: 15 },
      { foodId: 'duong-trang', amountG: 5 },
    ],
    tags: ['món bún-phở', 'giàu protein', 'món mặn'],
    trimester: ['2', '3'],
    note: 'Chả nướng vừa chín tới, không cháy; ăn kèm rau sống đã rửa kỹ.',
  }),
  meal({
    id: 'com-rang-dua-bo',
    name: 'Cơm rang dưa bò',
    mealType: 'lunch',
    serving: '1 đĩa (khoảng 400 g)',
    ingredients: [
      { foodId: 'com-trang', amountG: 250 },
      { foodId: 'thit-bo-nac', amountG: 50 },
      { foodId: 'trung-ga', amountG: 50 },
      { foodId: 'dua-chuot', amountG: 30 },
      { foodId: 'ca-rot', amountG: 30 },
      { foodId: 'dau-an-thuc-vat', amountG: 10 },
      { foodId: 'hanh-la', amountG: 10 },
      { foodId: 'nuoc-mam', amountG: 5 },
    ],
    tags: ['giàu sắt', 'giàu năng lượng', 'món cơm'],
    trimester: ['1', '2', '3'],
    note: 'Cơm rang dùng dầu vừa phải; thịt bò cho sắt heme.',
  }),
  meal({
    id: 'mi-xao-bo',
    name: 'Mì xào bò',
    mealType: 'lunch',
    serving: '1 đĩa (khoảng 400 g)',
    ingredients: [
      { foodId: 'mi-soi', amountG: 150 },
      { foodId: 'thit-bo-nac', amountG: 60 },
      { foodId: 'sup-lo-xanh', amountG: 50 },
      { foodId: 'ca-rot', amountG: 30 },
      { foodId: 'hanh-tay', amountG: 10 },
      { foodId: 'dau-an-thuc-vat', amountG: 10 },
      { foodId: 'nuoc-mam', amountG: 10 },
    ],
    tags: ['giàu sắt', 'giàu protein', 'món xào'],
    trimester: ['1', '2', '3'],
    note: 'Bông cải + cà rốt cho chất xơ và beta-caroten; ít dầu hơn ngoài hàng.',
  }),

  // ---- BỮA TỐI (dinner) ----
  meal({
    id: 'canh-rau-ngot-thit-bam',
    name: 'Canh rau ngót thịt băm',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + canh)',
    ingredients: [
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'rau-ngot', amountG: 150 },
      { foodId: 'thit-lon-nac', amountG: 50 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 2 },
      { foodId: 'hanh-la', amountG: 5 },
    ],
    tags: ['giàu sắt', 'giàu folate', 'thanh đạm', 'giàu vitamin C'],
    trimester: ['1', '2', '3'],
    note: 'Rau ngót giàu sắt + folate — tốt cho T1; nấu chín kỹ.',
  }),
  meal({
    id: 'canh-chua-ca-loc',
    name: 'Canh chua cá lóc',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + canh)',
    ingredients: [
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'ca-loc', amountG: 100 },
      { foodId: 'ca-chua', amountG: 50 },
      { foodId: 'gia-do', amountG: 30 },
      { foodId: 'rau-thom', amountG: 10 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
      { foodId: 'duong-trang', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 2 },
    ],
    tags: ['giàu protein', 'giàu vitamin C', 'thanh đạm', 'món canh'],
    trimester: ['2', '3'],
    note: 'Canh chua dễ ăn nhưng mẹ bị ợ nóng/ốm nghén T1 nên ăn ít.',
  }),
  meal({
    id: 'ca-hoi-nuong-chanh',
    name: 'Cá hồi nướng chanh',
    mealType: 'dinner',
    serving: '1 suất (cá 150 g + cơm + rau)',
    ingredients: [
      { foodId: 'ca-hoi', amountG: 150 },
      { foodId: 'chanh', amountG: 10 },
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'rau-muong', amountG: 100 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 2 },
    ],
    tags: ['món cá béo', 'giàu DHA', 'giàu vitamin D', 'thanh đạm'],
    trimester: ['2', '3'],
    note: 'Cá hồi giàu DHA + vitamin D — 2 phần/tuần cho não & xương thai nhi.',
  }),
  meal({
    id: 'ca-thu-kho-to',
    name: 'Cá thu kho tộ',
    mealType: 'dinner',
    serving: '1 suất (cá 100 g + cơm + rau)',
    ingredients: [
      { foodId: 'ca-thu', amountG: 100 },
      { foodId: 'nuoc-mam', amountG: 10 },
      { foodId: 'duong-trang', amountG: 5 },
      { foodId: 'gung', amountG: 5 },
      { foodId: 'ot', amountG: 2 },
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'rau-muong', amountG: 100 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
    ],
    tags: ['món cá béo', 'giàu DHA', 'giàu protein', 'món mặn'],
    trimester: ['2', '3'],
    note: 'Cá thu kho đậm đà; ăn kèm rau luộc để cân bằng natri.',
  }),
  meal({
    id: 'tom-kho-thit',
    name: 'Tôm kho thịt',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + món kho)',
    ingredients: [
      { foodId: 'tom', amountG: 80 },
      { foodId: 'thit-lon-nac', amountG: 50 },
      { foodId: 'nuoc-mam', amountG: 10 },
      { foodId: 'duong-trang', amountG: 5 },
      { foodId: 'hanh-la', amountG: 5 },
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'rau-muong', amountG: 100 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
    ],
    tags: ['giàu canxi', 'giàu kẽm', 'giàu protein', 'món mặn'],
    trimester: ['1', '2', '3'],
    note: 'Tôm kho cả vỏ tăng canxi; ăn kèm rau xanh.',
  }),
  meal({
    id: 'thit-bo-xao-sup-lo',
    name: 'Thịt bò xào bông cải',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + món xào)',
    ingredients: [
      { foodId: 'thit-bo-nac', amountG: 80 },
      { foodId: 'sup-lo-xanh', amountG: 150 },
      { foodId: 'toi', amountG: 5 },
      { foodId: 'dau-an-thuc-vat', amountG: 10 },
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'nuoc-mam', amountG: 5 },
    ],
    tags: ['giàu sắt', 'giàu folate', 'giàu vitamin C'],
    trimester: ['1', '2', '3'],
    note: 'Bò + bông cải cho sắt heme + folate; vitamin C tăng hấp thu sắt.',
  }),
  meal({
    id: 'ga-xao-gung',
    name: 'Gà xào gừng',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + món xào)',
    ingredients: [
      { foodId: 'thit-ga-ta', amountG: 100 },
      { foodId: 'gung', amountG: 10 },
      { foodId: 'hanh-la', amountG: 10 },
      { foodId: 'dau-an-thuc-vat', amountG: 10 },
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'rau-ngot', amountG: 100 },
      { foodId: 'nuoc-mam', amountG: 5 },
    ],
    tags: ['giàu protein', 'thanh đạm', 'giàu sắt'],
    trimester: ['1', '2', '3'],
    note: 'Gà + rau ngót cho đạm và sắt; gừng ấm bụng.',
  }),
  meal({
    id: 'dau-phu-sot-ca-chua',
    name: 'Đậu phụ sốt cà chua',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + món sốt)',
    ingredients: [
      { foodId: 'dau-phu', amountG: 150 },
      { foodId: 'ca-chua', amountG: 100 },
      { foodId: 'hanh-tay', amountG: 10 },
      { foodId: 'dau-an-thuc-vat', amountG: 10 },
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'nuoc-mam', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 2 },
    ],
    tags: ['giàu canxi', 'giàu protein', 'món chay', 'thanh đạm'],
    trimester: ['1', '2', '3'],
    note: 'Đậu phụ đông đặc canxi — nguồn canxi tốt cho mẹ không uống sữa.',
  }),
  meal({
    id: 'com-ca-loc-kho-to',
    name: 'Cơm cá lóc kho tộ',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + cá 100 g)',
    ingredients: [
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'ca-loc', amountG: 100 },
      { foodId: 'nuoc-mam', amountG: 10 },
      { foodId: 'gung', amountG: 5 },
      { foodId: 'ot', amountG: 2 },
      { foodId: 'duong-trang', amountG: 5 },
      { foodId: 'rau-muong', amountG: 100 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
    ],
    tags: ['giàu protein', 'thanh đạm', 'món mặn'],
    trimester: ['1', '2', '3'],
    note: 'Cá lóc nước ngọt ít béo, dễ tiêu; ăn kèm rau luộc.',
  }),
  meal({
    id: 'com-trung-chien-ca-chua',
    name: 'Cơm trứng chiên cà chua',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + trứng 2 quả)',
    ingredients: [
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'trung-ga', amountG: 100 },
      { foodId: 'ca-chua', amountG: 80 },
      { foodId: 'hanh-tay', amountG: 10 },
      { foodId: 'dau-an-thuc-vat', amountG: 10 },
      { foodId: 'rau-ngot', amountG: 100 },
      { foodId: 'nuoc-mam', amountG: 5 },
    ],
    tags: ['giàu choline', 'giàu protein', 'giàu vitamin C'],
    trimester: ['1', '2', '3'],
    note: '2 trứng cho ~294 mg choline (~65% nhu cầu); cà chua + rau ngót cho vitamin C.',
  }),
  meal({
    id: 'com-ga-hap-hanh',
    name: 'Cơm gà hấp hành',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + gà 120 g)',
    ingredients: [
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'thit-ga-ta', amountG: 120 },
      { foodId: 'hanh-tay', amountG: 20 },
      { foodId: 'gung', amountG: 5 },
      { foodId: 'rau-muong', amountG: 100 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
      { foodId: 'nuoc-mam', amountG: 5 },
    ],
    tags: ['giàu protein', 'thanh đạm', 'dễ tiêu hóa'],
    trimester: ['1', '2', '3'],
    note: 'Gà hấp ít dầu mỡ — dễ tiêu, tốt cho mẹ ốm nghén.',
  }),
  meal({
    id: 'canh-bi-do-thit-bam',
    name: 'Canh bí đỏ thịt băm',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + canh)',
    ingredients: [
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'bi-do', amountG: 150 },
      { foodId: 'thit-lon-nac', amountG: 50 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 2 },
      { foodId: 'hanh-la', amountG: 5 },
    ],
    tags: ['giàu beta-caroten', 'thanh đạm', 'giàu protein'],
    trimester: ['1', '2', '3'],
    note: 'Bí đỏ giàu beta-caroten (tiền vitamin A an toàn).',
  }),
  meal({
    id: 'canh-muop-thit-bam',
    name: 'Canh mướp thịt băm',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + canh)',
    ingredients: [
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'muop', amountG: 150 },
      { foodId: 'thit-lon-nac', amountG: 50 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 2 },
      { foodId: 'hanh-la', amountG: 5 },
    ],
    tags: ['thanh đạm', 'dễ tiêu hóa', 'món canh'],
    trimester: ['1', '2', '3'],
    note: 'Mướp mát, dễ tiêu — hợp bữa tối.',
  }),
  meal({
    id: 'com-ca-basa-chien',
    name: 'Cơm cá basa chiên',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + cá 100 g)',
    ingredients: [
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'ca-basa', amountG: 100 },
      { foodId: 'ca-chua', amountG: 50 },
      { foodId: 'dau-an-thuc-vat', amountG: 10 },
      { foodId: 'rau-muong', amountG: 100 },
      { foodId: 'nuoc-mam', amountG: 10 },
    ],
    tags: ['giàu protein', 'thanh đạm', 'món chiên'],
    trimester: ['1', '2', '3'],
    note: 'Cá basa chiên ít béo hơn các món chiên khác; ăn kèm rau.',
  }),
  meal({
    id: 'com-tom-rang-thit',
    name: 'Cơm tôm rang thịt',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + món rang)',
    ingredients: [
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'tom', amountG: 80 },
      { foodId: 'thit-lon-nac', amountG: 50 },
      { foodId: 'hanh-la', amountG: 10 },
      { foodId: 'dau-an-thuc-vat', amountG: 10 },
      { foodId: 'rau-muong', amountG: 100 },
      { foodId: 'nuoc-mam', amountG: 10 },
    ],
    tags: ['giàu canxi', 'giàu kẽm', 'giàu protein'],
    trimester: ['1', '2', '3'],
    note: 'Tôm + thịt cho kẽm, canxi; ăn kèm rau muống luộc.',
  }),
  meal({
    id: 'dau-phu-nhoi-thit',
    name: 'Đậu phụ nhồi thịt sốt cà chua',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + món sốt)',
    ingredients: [
      { foodId: 'dau-phu', amountG: 150 },
      { foodId: 'thit-lon-nac', amountG: 50 },
      { foodId: 'ca-chua', amountG: 100 },
      { foodId: 'hanh-tay', amountG: 10 },
      { foodId: 'dau-an-thuc-vat', amountG: 10 },
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'nuoc-mam', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 2 },
    ],
    tags: ['giàu canxi', 'giàu protein', 'món mặn'],
    trimester: ['1', '2', '3'],
    note: 'Đậu phụ + thịt băm cho canxi và đạm đầy đủ.',
  }),
  meal({
    id: 'com-ca-moi-kho',
    name: 'Cơm cá mòi kho',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + cá 80 g)',
    ingredients: [
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'ca-moi', amountG: 80 },
      { foodId: 'nuoc-mam', amountG: 10 },
      { foodId: 'gung', amountG: 5 },
      { foodId: 'duong-trang', amountG: 5 },
      { foodId: 'rau-muong', amountG: 100 },
      { foodId: 'dau-an-thuc-vat', amountG: 5 },
    ],
    tags: ['giàu canxi', 'giàu DHA', 'món mặn'],
    trimester: ['2', '3'],
    note: 'Cá mòi kho ăn cả xương — giàu canxi cho T2/T3.',
  }),
  meal({
    id: 'canh-rong-bien-dau-phu',
    name: 'Canh rong biển đậu phụ',
    mealType: 'dinner',
    serving: '1 suất (cơm ~200 g + canh)',
    ingredients: [
      { foodId: 'com-trang', amountG: 200 },
      { foodId: 'rong-bien', amountG: 15 },
      { foodId: 'dau-phu', amountG: 100 },
      { foodId: 'hanh-la', amountG: 5 },
      { foodId: 'muoi-iot', amountG: 2 },
      { foodId: 'dau-an-thuc-vat', amountG: 3 },
    ],
    tags: ['giàu canxi', 'giàu i-ốt', 'thanh đạm'],
    trimester: ['1', '2', '3'],
    note: 'Rong biển dùng lượng nhỏ (i-ốt cao) — canh 15 g/suất là vừa, không ăn hàng ngày.',
  }),

  // ---- BỮA PHỤ (snack) ----
  meal({
    id: 'goi-cuon',
    name: 'Gỏi cuốn',
    mealType: 'snack',
    serving: '2 cuốn (khoảng 180 g)',
    ingredients: [
      { foodId: 'banh-trang', amountG: 20 },
      { foodId: 'tom', amountG: 40 },
      { foodId: 'thit-lon-nac', amountG: 30 },
      { foodId: 'bun-tuoi', amountG: 50 },
      { foodId: 'xa-lach', amountG: 20 },
      { foodId: 'gia-do', amountG: 20 },
      { foodId: 'rau-thom', amountG: 10 },
      { foodId: 'dau-phong', amountG: 10 },
      { foodId: 'nuoc-mam', amountG: 10 },
    ],
    tags: ['nhiều rau', 'giàu protein', 'ít calo'],
    trimester: ['1', '2', '3'],
    note: 'Giá đỗ và rau sống nên rửa kỹ/chần; nước chấm ít mặn.',
  }),
  meal({
    id: 'che-dau-xanh',
    name: 'Chè đậu xanh',
    mealType: 'snack',
    serving: '1 bát (khoảng 250 g)',
    ingredients: [
      { foodId: 'dau-xanh-hat', amountG: 40 },
      { foodId: 'duong-trang', amountG: 20 },
      { foodId: 'vung', amountG: 5 },
    ],
    tags: ['giàu folate', 'món chè', 'giàu chất xơ'],
    trimester: ['1', '2', '3'],
    note: 'Đậu xanh giàu folate; hạn chế đường nếu tiểu đường thai kỳ.',
  }),
  meal({
    id: 'che-dau-do',
    name: 'Chè đậu đỏ',
    mealType: 'snack',
    serving: '1 bát (khoảng 250 g)',
    ingredients: [
      { foodId: 'dau-do', amountG: 50 },
      { foodId: 'duong-trang', amountG: 20 },
    ],
    tags: ['giàu folate', 'giàu chất xơ', 'món chè'],
    trimester: ['1', '2', '3'],
    note: 'Đậu đỏ giàu folate và chất xơ; ăn kèm ít đường.',
  }),
  meal({
    id: 'sinh-to-bo',
    name: 'Sinh tố bơ',
    mealType: 'snack',
    serving: '1 ly (khoảng 250 ml)',
    ingredients: [
      { foodId: 'bo', amountG: 100 },
      { foodId: 'sua-bo-tuoi', amountG: 100 },
      { foodId: 'duong-trang', amountG: 10 },
    ],
    tags: ['giàu folate', 'chất béo lành', 'món sinh tố'],
    trimester: ['1', '2', '3'],
    note: 'Bơ giàu folate và chất béo lành mạnh — tốt cho phát triển thai nhi.',
  }),
  meal({
    id: 'sinh-to-du-du',
    name: 'Sinh tố đu đủ',
    mealType: 'snack',
    serving: '1 ly (khoảng 250 ml)',
    ingredients: [
      { foodId: 'du-du', amountG: 150 },
      { foodId: 'sua-bo-tuoi', amountG: 100 },
      { foodId: 'duong-trang', amountG: 10 },
    ],
    tags: ['giàu vitamin C', 'giàu folate', 'món sinh tố'],
    trimester: ['1', '2', '3'],
    note: 'Đu đủ chín giàu vitamin C + beta-caroten; dùng đu đủ CHÍN.',
  }),
  meal({
    id: 'sua-chua-hoa-qua',
    name: 'Sữa chua hoa quả',
    mealType: 'snack',
    serving: '1 hộp (khoảng 200 g)',
    ingredients: [
      { foodId: 'sua-chua', amountG: 150 },
      { foodId: 'chuoi', amountG: 50 },
      { foodId: 'dau-phong', amountG: 10 },
    ],
    tags: ['giàu canxi', 'món sữa', 'nhanh gọn'],
    trimester: ['1', '2', '3'],
    note: 'Sữa chua giàu canxi + lợi khuẩn; chuối cho kali.',
  }),
  meal({
    id: 'khoai-lang-luoc',
    name: 'Khoai lang luộc',
    mealType: 'snack',
    serving: '1 củ (khoảng 200 g)',
    ingredients: [
      { foodId: 'khoai-lang', amountG: 200 },
      { foodId: 'vung', amountG: 5 },
    ],
    tags: ['giàu chất xơ', 'giàu beta-caroten', 'thanh đạm'],
    trimester: ['1', '2', '3'],
    note: 'Khoai lang no lâu, giàu chất xơ — tốt chống táo bón T3.',
  }),
  meal({
    id: 'ngo-luoc',
    name: 'Ngô luộc',
    mealType: 'snack',
    serving: '1 bắp (khoảng 180 g)',
    ingredients: [{ foodId: 'ngo-luoc', amountG: 180 }],
    tags: ['giàu chất xơ', 'thanh đạm', 'nhanh gọn'],
    trimester: ['1', '2', '3'],
    note: 'Ngô luộc là bữa phụ ít béo, giàu chất xơ.',
  }),
  meal({
    id: 'ngucoc-trai-cay',
    name: 'Ngũ cốc yến mạch trái cây',
    mealType: 'snack',
    serving: '1 bát (khoảng 250 g)',
    ingredients: [
      { foodId: 'yen-mach-kho', amountG: 40 },
      { foodId: 'sua-bo-tuoi', amountG: 150 },
      { foodId: 'chuoi', amountG: 80 },
      { foodId: 'hat-dieu', amountG: 10 },
      { foodId: 'mat-ong', amountG: 10 },
    ],
    tags: ['giàu chất xơ', 'giàu canxi', 'món ngũ cốc'],
    trimester: ['1', '2', '3'],
    note: 'Yến mạch + sữa + hạt cho chất xơ, canxi và đạm — bữa phụ no lâu.',
  }),

  // ---- ĐỒ UỐNG (drink) ----
  meal({
    id: 'nuoc-cam-ep',
    name: 'Nước cam ép',
    mealType: 'drink',
    serving: '1 ly (khoảng 200 ml)',
    ingredients: [{ foodId: 'cam', amountG: 200 }],
    tags: ['giàu vitamin C', 'giàu folate', 'món nước'],
    trimester: ['1', '2', '3'],
    note: 'Cam tươi giàu vitamin C — hỗ trợ hấp thu sắt; uống không thêm đường.',
  }),
  meal({
    id: 'sua-bo-nong',
    name: 'Sữa bò nóng',
    mealType: 'drink',
    serving: '1 ly (250 ml)',
    ingredients: [{ foodId: 'sua-bo-tuoi', amountG: 250 }],
    tags: ['giàu canxi', 'giàu protein', 'món nước'],
    trimester: ['1', '2', '3'],
    note: '1 ly sữa ~300 mg canxi — nhắm 2–3 phần sữa/ngày.',
  }),
]

/** Tra nhanh món theo id. Trả undefined nếu không tồn tại. */
export function getMeal(id: string): Meal | undefined {
  return MEALS.find((m) => m.id === id)
}
