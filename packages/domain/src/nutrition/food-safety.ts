import type { FoodSafetyLevel } from './index'

// ===========================================================================
// An toàn thực phẩm thai kỳ — thực phẩm Việt theo mức avoid/limit/ok.
// Nội dung tham khảo, không phải chỉ định y khoa. Tuần thường chỉ áp dụng
// cho caffeine/đồ sống; phần còn lại áp dụng suốt thai kỳ.
// ===========================================================================

export interface FoodSafetyRule {
  food: string
  level: FoodSafetyLevel
  category:
    | 'protein'
    | 'dairy'
    | 'seafood'
    | 'caffeine'
    | 'alcohol'
    | 'herb'
    | 'processed'
    | 'other'
  reason: string
  /** Áp dụng trong khoảng tuần (nếu có). */
  week?: { from: number; to: number }
  limitNote?: string
}

export const FOOD_SAFETY_RULES: FoodSafetyRule[] = [
  { food: 'Tiết canh', level: 'avoid', category: 'protein', reason: 'Nguy cơ nhiễm khuẩn/liên cầu, toxoplasma từ máu sống.' },
  { food: 'Thịt sống, tái, gỏi', level: 'avoid', category: 'protein', reason: 'Nguy cơ toxoplasma, sán, nhiễm khuẩn.' },
  { food: 'Trứng sống, lòng đào', level: 'avoid', category: 'protein', reason: 'Nguy cơ salmonella.' },
  { food: 'Sữa tươi chưa tiệt trùng', level: 'avoid', category: 'dairy', reason: 'Nguy cơ listeria.' },
  { food: 'Phô mai mềm chưa tiệt trùng', level: 'avoid', category: 'dairy', reason: 'Nguy cơ listeria (brie, camembert, feta).' },
  { food: 'Pate (kể cả pate gan)', level: 'limit', category: 'protein', reason: 'Listeria; pate gan nhiều vitamin A.', limitNote: 'Hạn chế, nên làm chín kỹ.' },
  { food: 'Cá kiếm, cá ngừ đại dương, cá thu vua', level: 'limit', category: 'seafood', reason: 'Hàm lượng thủy ngân cao.', limitNote: 'Tối đa 1 khẩu phần/tuần.' },
  { food: 'Hải sản sống (hàu, sashimi)', level: 'avoid', category: 'seafood', reason: 'Nguy cơ vi khuẩn/vi rút, listeria.' },
  { food: 'Rượu, bia', level: 'avoid', category: 'alcohol', reason: 'Không có mức an toàn, ảnh hưởng thai nhi.' },
  { food: 'Cà phê, trà đậm', level: 'limit', category: 'caffeine', reason: 'Caffeine > 200mg/ngày liên quan nguy cơ nhẹ.', limitNote: 'Tối đa 2 ly cà phê (≈200mg)/ngày.', week: { from: 1, to: 42 } },
  { food: 'Rau mầm sống', level: 'limit', category: 'other', reason: 'Nguy cơ vi khuẩn từ hạt nảy mầm.', limitNote: 'Nấu chín trước khi ăn.' },
  { food: 'Gan động vật', level: 'limit', category: 'protein', reason: 'Quá nhiều vitamin A có hại.', limitNote: 'Dưới 100g/tuần.' },
  { food: 'Măng tươi, sắn tươi', level: 'avoid', category: 'other', reason: 'Có thể chứa cyanide; măng cần luộc bỏ nước kỹ.' },
  { food: 'Đu đủ xanh', level: 'limit', category: 'herb', reason: 'Nhựa đu đủ xanh (latex) có thể kích thích co bóp.', limitNote: 'Chỉ ăn đu đủ chín.' },
  { food: 'Lô hội (nha đam)', level: 'avoid', category: 'herb', reason: 'Chất anthraquinone kích thích tử cung.' },
  { food: 'Đồ hộp, thực phẩm chế biến mặn', level: 'limit', category: 'processed', reason: 'Nhiều muối, chất bảo quản.', limitNote: 'Hạn chế, ưu tiên tươi.' },
  { food: 'Nước uống có gas/chứa chất tạo ngọt nhân tạo', level: 'limit', category: 'processed', reason: 'Đường/hoá chất; nên dùng nước lọc.', limitNote: 'Hạn chế tần suất.' },
  { food: 'Trà thảo mộc (cúc La Mã, bạc hà lượng lớn)', level: 'limit', category: 'herb', reason: 'Ít dữ liệu an toàn ở liều cao.', limitNote: '1 tách/ngày là vừa.' },
]

/** Tra mức an toàn cho một thực phẩm (khớp từ khóa con, không phân biệt hoa thường). */
export function foodSafetyLevel(food: string, week?: number): FoodSafetyRule | undefined {
  const f = food.trim().toLowerCase()
  if (!f) return undefined
  return FOOD_SAFETY_RULES.find((r) => {
    // rule có thể gộp nhiều thực phẩm ("Cà phê, trà đậm") hoặc kèm chú thích
    // ("Pate (kể cả pate gan)") → tách token theo dấu phẩy/chấm phẩy/ngoặc mở
    const tokens = r.food
      .split(/[,;(]/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    const hit = tokens.some((t) => f.includes(t))
    if (!hit) return false
    if (!week || !r.week) return true
    return week >= r.week.from && week <= r.week.to
  })
}

/** Danh sách món cần lưu ý trong tuần (theo mức). */
export function riskyFoodsForWeek(week: number, level?: FoodSafetyLevel): FoodSafetyRule[] {
  return FOOD_SAFETY_RULES.filter((r) => {
    if (level && r.level !== level) return false
    if (!r.week) return true
    return week >= r.week.from && week <= r.week.to
  })
}

// ---------------------------------------------------------------------------
// demo
// ---------------------------------------------------------------------------
function demo(): void {
  const assert = (cond: boolean, msg: string): void => {
    if (!cond) throw new Error('food-safety.demo: ' + msg)
  }
  assert(foodSafetyLevel('tiết canh vịt')?.level === 'avoid', 'tiết canh → avoid')
  assert(foodSafetyLevel('Một ly cà phê sữa đá', 12)?.level === 'limit', 'cà phê → limit')
  assert(foodSafetyLevel('pate gan')?.level === 'limit', 'pate → limit')
  assert(foodSafetyLevel('rau muống') === undefined, 'không khớp → undefined')
  assert(riskyFoodsForWeek(10).some((r) => r.food === 'Tiết canh'), 'luôn có tiết canh')
  console.log('✅ food-safety.ts OK')
}

const isMain = (): boolean =>
  (globalThis as { process?: { argv?: string[] } }).process?.argv?.[1]?.endsWith('food-safety.ts') === true
if (isMain()) demo()
