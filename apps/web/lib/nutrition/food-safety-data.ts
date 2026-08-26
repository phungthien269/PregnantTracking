// ===========================================================================
// food-safety-data.ts — an toàn thực phẩm thai kỳ theo tam cá nguyệt (Phase 6B).
// Danh sách TRÁNH (cá thủy ngân cao, sữa tươi sống, pâté, trứng sống, thịt sống,
// hải sản sống, gan, rượu...) và HẠN CHẾ (caffeine ≤200 mg, cá ngừ/cá béo số phần,
// đồ ngọt...). Mỗi mục kèm lý do + nguồn. severity dùng để app hiển thị "cảnh báo"
// đúng lúc (high = luôn hiển thị; medium = hiển thị theo ngữ cảnh).
// Chuẩn chính: NHS/ACOG (caffeine + an toàn), FDA/EPA (cá). Thuần TS, không import.
// ===========================================================================

export interface Citation {
  org: string
  title: string
  url: string
}

export type Trimester = 'T1' | 'T2' | 'T3'

export type FoodSafetyCategory = 'avoid' | 'limit'

export type FoodSafetySeverity = 'high' | 'medium'

export interface FoodSafetyItem {
  id: string
  category: FoodSafetyCategory
  /** Tên thực phẩm (tiếng Việt). */
  item: string
  /** Lý do tránh/hạn chế. */
  reason: string
  /** Mức hiển thị cảnh báo: high = luôn nhấn; medium = theo ngữ cảnh. */
  severity: FoodSafetySeverity
  /** Áp dụng cho tam cá nguyệt nào; 'all' = cả thai kỳ. */
  appliesTo: 'all' | Trimester[]
  /** Mức tối đa nếu là mục "hạn chế" (VD caffeine ≤200 mg/ngày). */
  maxAmount?: string
  citations: Citation[]
}

export const FOOD_SAFETY_ITEMS: FoodSafetyItem[] = [
  {
    id: 'alcohol',
    category: 'avoid',
    item: 'Rượu, bia và mọi đồ uống có cồn',
    reason: 'Không có mức an toàn — cồn qua nhau thai gây hội chứng rượu bào thai, dị tật bẩm sinh, chậm phát triển não.',
    severity: 'high',
    appliesTo: 'all',
    citations: [
      { org: 'NHS', title: 'Foods to avoid in pregnancy (alcohol)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    id: 'high_mercury_fish',
    category: 'avoid',
    item: 'Cá thủy ngân cao: cá mập, cá kiếm, cá thu vua, marlin, cá đá (tilefish), orange roughy, cá ngừ mắt to',
    reason: 'Thủy ngân tích lũy gây tổn thương hệ thần kinh đang phát triển của thai nhi.',
    severity: 'high',
    appliesTo: 'all',
    citations: [
      { org: 'FDA/EPA', title: 'Advice About Eating Fish', url: 'https://www.fda.gov/food/consumers/advice-about-eating-fish' },
      { org: 'NHS', title: 'Foods to avoid in pregnancy (fish)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
    ],
  },
  {
    id: 'raw_milk',
    category: 'avoid',
    item: 'Sữa tươi sống (chưa tiệt trùng) và phô mai mốc/mềm làm từ sữa tươi',
    reason: 'Nguy cơ nhiễm Listeria → sảy thai, sinh non, nhiễm trùng sơ sinh nặng.',
    severity: 'high',
    appliesTo: 'all',
    citations: [
      { org: 'NHS', title: 'Foods to avoid in pregnancy (dairy)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    id: 'pate',
    category: 'avoid',
    item: 'Pâté (kể cả pâté gan)',
    reason: 'Nguy cơ Listeria + gan chứa nhiều vitamin A (retinol) — thừa retinol gây quái thai.',
    severity: 'high',
    appliesTo: 'all',
    citations: [
      { org: 'NHS', title: 'Foods to avoid in pregnancy (pâté)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
      { org: 'UK COT', title: 'Vitamin A and pregnancy (liver)', url: 'https://cot.food.gov.uk/' },
    ],
  },
  {
    id: 'raw_eggs',
    category: 'avoid',
    item: 'Trứng sống, trứng chần lòng đào, sốt mayonnaise/tráng miệng làm từ trứng sống',
    reason: 'Nguy cơ nhiễm Salmonella → nôn, tiêu chảy, sốt, nguy hiểm cho thai phụ.',
    severity: 'high',
    appliesTo: 'all',
    citations: [
      { org: 'NHS', title: 'Foods to avoid in pregnancy (eggs)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
    ],
  },
  {
    id: 'raw_meat',
    category: 'avoid',
    item: 'Thịt sống/tái: nem chua, tiết canh, gỏi, thịt bò tái, thịt chưa nấu chín',
    reason: 'Nguy cơ Toxoplasma, Salmonella, E. coli → nhiễm trùng, ảnh hưởng thai.',
    severity: 'high',
    appliesTo: 'all',
    citations: [
      { org: 'NHS', title: 'Foods to avoid in pregnancy (meat)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
    ],
  },
  {
    id: 'raw_seafood',
    category: 'avoid',
    item: 'Hải sản sống: sushi, sashimi, hàu sống, gỏi hải sản',
    reason: 'Nguy cơ Listeria, ký sinh trùng, vi khuẩn → ngộ độc, nhiễm trùng thai kỳ.',
    severity: 'high',
    appliesTo: 'all',
    citations: [
      { org: 'NHS', title: 'Foods to avoid in pregnancy (raw shellfish)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
    ],
  },
  {
    id: 'raw_sprouts',
    category: 'avoid',
    item: 'Giá sống, rau sống chưa rửa kỹ (salad chưa đảm bảo vệ sinh)',
    reason: 'Giá sống dễ nhiễm vi khuẩn (Salmonella, E. coli); rau sống cần rửa kỹ dưới vòi nước.',
    severity: 'medium',
    appliesTo: 'all',
    citations: [
      { org: 'NHS', title: 'Foods to avoid in pregnancy (salad)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
    ],
  },
  {
    id: 'liver',
    category: 'avoid',
    item: 'Gan và sản phẩm từ gan (gan gà/heo/bò, pate gan)',
    reason: 'Quá nhiều vitamin A (retinol): 100 g gan gà ≈ 3.000–4.000 mcg RAE — đã chạm/ngấp ngưỡng UL cả ngày; thừa retinol T1 gây dị tật bẩm sinh.',
    severity: 'high',
    appliesTo: 'all',
    citations: [
      { org: 'NHS', title: 'Foods to avoid in pregnancy (liver)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
      { org: 'UK COT', title: 'Vitamin A and pregnancy (liver)', url: 'https://cot.food.gov.uk/' },
    ],
  },
  {
    id: 'caffeine',
    category: 'limit',
    item: 'Caffeine (cà phê, trà đen/xanh, nước tăng lực, cola, cacao/sô-cô-la)',
    reason: 'Caffeine qua nhau thai, thai chuyển hóa rất chậm → tích lũy; liều cao liên quan giảm cân nặng sơ sinh.',
    severity: 'medium',
    appliesTo: 'all',
    maxAmount: '≤200 mg/ngày (≈2 ly cà phê hòa tan · 2–3 ly trà · 5 lon cola)',
    citations: [
      { org: 'ACOG', title: 'Moderate Caffeine Consumption During Pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2010/08/moderate-caffeine-consumption-during-pregnancy' },
      { org: 'NHS', title: 'Foods to avoid in pregnancy (caffeine)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
    ],
  },
  {
    id: 'tuna',
    category: 'limit',
    item: 'Cá ngừ (vì có thủy ngân dù thấp hơn cá lớn)',
    reason: 'Giới hạn số phần để tránh tích lũy thủy ngân — NHS khuyến cáo không quá 2 phần cá ngừ tươi/tuần hoặc 4 hộp/tuần.',
    severity: 'medium',
    appliesTo: 'all',
    maxAmount: '≤2 phần tươi/tuần hoặc ≤4 hộp/tuần (NHS); cá ngừ trắng albacore ≤1 phần/tuần (FDA)',
    citations: [
      { org: 'NHS', title: 'Foods to avoid in pregnancy (fish)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
      { org: 'FDA/EPA', title: 'Advice About Eating Fish', url: 'https://www.fda.gov/food/consumers/advice-about-eating-fish' },
    ],
  },
  {
    id: 'oily_fish',
    category: 'limit',
    item: 'Cá béo (cá thu, cá hồi, cá mòi, cá trích, cá cơm)',
    reason: 'Giàu DHA/omega-3 tốt cho não thai nhưng có thể chứa chất ô nhiễm môi trường → giới hạn số phần/tuần.',
    severity: 'medium',
    appliesTo: 'all',
    maxAmount: '2 phần/tuần (mỗi phần ~100 g) — FDA/EPA',
    citations: [
      { org: 'FDA/EPA', title: 'Advice About Eating Fish', url: 'https://www.fda.gov/food/consumers/advice-about-eating-fish' },
      { org: 'ACOG', title: 'Update on Seafood Consumption During Pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/01/update-on-seafood-consumption-during-pregnancy' },
    ],
  },
  {
    id: 'sweets',
    category: 'limit',
    item: 'Đồ ngọt, nước ngọt có ga/đường, nước ép đóng chai nhiều đường',
    reason: 'Calo rỗng → tăng cân quá mức, tiểu đường thai kỳ, thai to; không đóng góp dưỡng chất.',
    severity: 'medium',
    appliesTo: 'all',
    maxAmount: 'Hạn chế tối đa — ưu tiên trái cây nguyên quả + nước lọc',
    citations: [
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    id: 'seaweed',
    category: 'limit',
    item: 'Rong biển (biển khô/tươi, canh rong biển hằng ngày)',
    reason: 'Hàm lượng i-ốt biến thiên rất lớn — có thể >1.000 mcg/khẩu phần; thừa i-ốt gây rối loạn tuyến giáp. ATA: tránh sản phẩm i-ốt >500 mcg/ngày.',
    severity: 'medium',
    appliesTo: 'all',
    maxAmount: 'Dùng rất vừa phải, không hằng ngày',
    citations: [
      { org: 'ATA', title: 'Iodine Supplementation for Pregnancy and Lactation', url: 'https://www.thyroid.org/iodine-supplementation-pregnancy-lactation/' },
      { org: 'NIH/ODS', title: 'Iodine — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/' },
    ],
  },
  {
    id: 'herbal_tea',
    category: 'limit',
    item: 'Trà thảo mộc (trà lá, trà giảm cân, trà lợi tiểu)',
    reason: 'Một số thảo mộc chưa an toàn cho thai kỳ; không dùng thay nước lọc. Chọn loại đã xác nhận an toàn, hỏi bác sĩ nếu phân vân.',
    severity: 'medium',
    appliesTo: 'all',
    maxAmount: 'Chỉ dùng loại an toàn đã biết, số lượng vừa phải',
    citations: [
      { org: 'NHS', title: 'Foods to avoid in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
    ],
  },
  {
    id: 'listeria_risk_food',
    category: 'limit',
    item: 'Thực phẩm chế biến sẵn bảo quản lạnh lâu (deli meat, hot dog chưa hâm nóng kỹ)',
    reason: 'Nguy cơ Listeria — hâm nóng kỹ đến khi bốc hơi trước khi ăn.',
    severity: 'medium',
    appliesTo: 'all',
    maxAmount: 'Chỉ ăn sau khi hâm nóng kỹ',
    citations: [
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
]

/** Lọc danh sách an toàn thực phẩm áp dụng cho một tam cá nguyệt. */
export function foodSafetyForTrimester(trimester: Trimester): FoodSafetyItem[] {
  return FOOD_SAFETY_ITEMS.filter(
    (item) => item.appliesTo === 'all' || item.appliesTo.includes(trimester),
  )
}

/** Mục cảnh báo mức high (app nên luôn hiển thị). */
export function highSeverityFoodSafetyItems(): FoodSafetyItem[] {
  return FOOD_SAFETY_ITEMS.filter((item) => item.severity === 'high')
}
