// ===========================================================================
// weekly-focus-data.ts — hướng dẫn dinh dưỡng theo từng tuần thai (Phase 6B).
// Nhóm tuần theo Bảng B1 knowledge-base: 1–4, 5–8, 9–12, 13, 14–16, 17–20, 21–24,
// 25–26, 27, 28–30, 31–34, 35–37, 38–40 → phủ đủ tuần 1–40. Ranh giới tam cá nguyệt
// khớp CHUẨN ACOG/WHO: T1 = 1–13, T2 = 14–27, T3 = 28–40 (tuần 27 = T2, tuần 28+ = T3).
// Nhóm bám biên (13, 27) được tách riêng để nhãn không mâu thuẫn giữa các nguồn.
// Chuẩn chính: ACOG/NIH-ODS (tham chiếu WHO); tăng cân: IOM 2009.
// MỌI số liệu ghi nguồn (tổ chức + URL). Thuần TS, không import.
// ===========================================================================

export interface Citation {
  org: string
  title: string
  url: string
}

export type Trimester = 'T1' | 'T2' | 'T3'

/** Một chất trọng tâm của tuần + lý do. nutrientId trỏ id trong nutrient-reference-data.ts. */
export interface FocusNutrient {
  nutrientId: string
  reason: string
}

export interface WeeklyFocus {
  /** Tuần bắt đầu (bao gồm, ≥1). */
  weekStart: number
  /** Tuần kết thúc (bao gồm, ≤40). */
  weekEnd: number
  trimester: Trimester
  /** Nhãn giai đoạn tiếng Việt (VD "T1 sớm"). */
  phaseLabel: string
  /** Trọng tâm dinh dưỡng 2–4 chất + lý do. */
  focus: FocusNutrient[]
  /** Mục tiêu lượng nếu có (chuỗi hiển thị). */
  dailyGoals?: string
  /** Món/thực phẩm gợi ý (tên Việt). */
  suggestedFoods: string[]
  /** Lưu ý ốm nghén / tăng cân / giai đoạn. */
  notes?: string
  citations: Citation[]
}

export const WEEKLY_FOCUS: WeeklyFocus[] = [
  {
    weekStart: 1,
    weekEnd: 4,
    trimester: 'T1',
    phaseLabel: 'T1 sớm',
    focus: [
      { nutrientId: 'folate', reason: 'Ống thần kinh đóng kín ~ngày 28 sau thụ thai (~tuần 6) — cần folate đủ từ bây giờ; 400 mcg axit folic/ngày là quan trọng nhất giai đoạn này.' },
      { nutrientId: 'iodine', reason: 'Hormone giáp mẹ quyết định phát triển não thai; tuyến giáp thai chưa hoạt động.' },
      { nutrientId: 'vitamin_d', reason: 'Dự trữ từ sớm; gần như mọi thai phụ nên bổ sung 400–600 IU/ngày.' },
    ],
    dailyGoals: 'Folate 400 mcg bổ sung + 600 mcg DFE/ngày · i-ốt 220 mcg · vitamin D 400–600 IU',
    suggestedFoods: ['Rau ngót luộc', 'Bông cải xanh', 'Cam/ổi', 'Trứng', 'Sữa', 'Cơm gạo lứt'],
    notes: 'Chưa cần tăng năng lượng. TRÁNH gan/pate gan và retinol liều cao; caffeine ≤200 mg/ngày.',
    citations: [
      { org: 'NIH/ODS', title: 'Folate — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/' },
      { org: 'CDC', title: 'Folic Acid', url: 'https://www.cdc.gov/ncbddd/folicacid/index.html' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    weekStart: 5,
    weekEnd: 8,
    trimester: 'T1',
    phaseLabel: 'T1 giữa',
    focus: [
      { nutrientId: 'folate', reason: 'Tiếp tục 400 mcg bổ sung — ống thần kinh đang đóng kín.' },
      { nutrientId: 'zinc', reason: 'Phân chia tế bào, tổng hợp DNA — nền tảng hình thành cơ quan.' },
      { nutrientId: 'iron', reason: '27 mg/ngày — dự phòng thiếu máu; kèm vitamin C tăng hấp thu.' },
    ],
    dailyGoals: 'Folate 400 mcg · kẽm 11 mg · sắt 27 mg · vitamin D 400–600 IU',
    suggestedFoods: ['Cháo trắng', 'Cháo thịt băm', 'Bánh mì', 'Khoai luộc', 'Súp gà', 'Gừng mật ong'],
    notes: 'Ốm nghén thường đỉnh ở giai đoạn này: nhiều bữa nhỏ, carb phức hợp, tránh dầu mỡ/cay; uống đủ nước.',
    citations: [
      { org: 'NIH/ODS', title: 'Zinc — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/' },
      { org: 'NHS', title: 'Have a healthy diet in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/have-a-healthy-diet/' },
      { org: 'WHO eLENA', title: 'Daily iron supplementation in pregnancy', url: 'https://www.who.int/elena/titles/daily_iron_pregnancy/en/' },
    ],
  },
  {
    weekStart: 9,
    weekEnd: 12,
    trimester: 'T1',
    phaseLabel: 'T1 cuối',
    focus: [
      { nutrientId: 'folate', reason: 'Tiếp tục folate đến hết tuần 12 (mốc quan trọng ống thần kinh); sau đó giảm dần nhấn.' },
      { nutrientId: 'iodine', reason: 'Duy trì 220 mcg — tuyến giáp thai sắp bắt đầu hoạt động (~tuần 12–14).' },
      { nutrientId: 'vitamin_d', reason: 'Duy trì 400–600 IU/ngày + phơi nắng sáng sớm.' },
    ],
    dailyGoals: 'Folate 400 mcg → đến hết tuần 12 · i-ốt 220 mcg · vitamin D 400–600 IU',
    suggestedFoods: ['Rau xanh đậm', 'Cá kho', 'Trứng', 'Sữa chua', 'Cam quýt'],
    notes: 'Bắt đầu chú ý protein (~46 g nền). Tăng cân T1 chỉ nên 0,5–2 kg (IOM).',
    citations: [
      { org: 'CDC', title: 'Folic Acid', url: 'https://www.cdc.gov/ncbddd/folicacid/index.html' },
      { org: 'IOM/NASEM', title: 'Weight Gain During Pregnancy (2009)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK32801/table/ch7.t1/' },
    ],
  },
  {
    weekStart: 13,
    weekEnd: 13,
    trimester: 'T1',
    phaseLabel: 'T1 → T2',
    focus: [
      { nutrientId: 'protein', reason: 'Thai phát triển nhanh → thêm ~25 g/ngày (RDA 1,1 g/kg).' },
      { nutrientId: 'iron', reason: 'Khối lượng máu mẹ bắt đầu tăng → sắt càng quan trọng.' },
      { nutrientId: 'calcium', reason: '1.000 mg/ngày cho xương/răng thai hình thành.' },
    ],
    dailyGoals: 'Protein ~60–71 g · sắt 27 mg · canxi 1.000 mg · vitamin D 600 IU',
    suggestedFoods: ['Thịt bò xào rau ngót', 'Cá kho tộ', 'Đậu phụ', 'Sữa 2 ly', 'Trứng'],
    notes: 'Ốm nghén thường giảm dần — tận dụng ăn tốt hơn. Chú ý uống sắt cách xa sữa/trà/cà phê ≥2 giờ.',
    citations: [
      { org: 'USDA MyPlate', title: 'Protein Foods', url: 'https://www.myplate.gov/eat-healthy/protein-foods' },
      { org: 'NIH/ODS', title: 'Iron — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
      { org: 'NIH/ODS', title: 'Calcium — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/' },
    ],
  },
  {
    weekStart: 14,
    weekEnd: 16,
    trimester: 'T2',
    phaseLabel: 'T2 đầu',
    focus: [
      { nutrientId: 'protein', reason: 'Thai phát triển nhanh → thêm ~25 g/ngày (RDA 1,1 g/kg).' },
      { nutrientId: 'iron', reason: 'Khối lượng máu mẹ bắt đầu tăng → sắt càng quan trọng.' },
      { nutrientId: 'calcium', reason: '1.000 mg/ngày cho xương/răng thai hình thành.' },
    ],
    dailyGoals: 'Protein ~60–71 g · sắt 27 mg · canxi 1.000 mg · vitamin D 600 IU',
    suggestedFoods: ['Thịt bò xào rau ngót', 'Cá kho tộ', 'Đậu phụ', 'Sữa 2 ly', 'Trứng'],
    notes: 'Ốm nghén thường giảm dần — tận dụng ăn tốt hơn. Chú ý uống sắt cách xa sữa/trà/cà phê ≥2 giờ.',
    citations: [
      { org: 'USDA MyPlate', title: 'Protein Foods', url: 'https://www.myplate.gov/eat-healthy/protein-foods' },
      { org: 'NIH/ODS', title: 'Iron — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
      { org: 'NIH/ODS', title: 'Calcium — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/' },
    ],
  },
  {
    weekStart: 17,
    weekEnd: 20,
    trimester: 'T2',
    phaseLabel: 'T2 giữa',
    focus: [
      { nutrientId: 'dha', reason: 'Não thai bắt đầu phát triển mạnh → DHA ≥200 mg/ngày.' },
      { nutrientId: 'iron', reason: 'Duy trì 27 mg + vitamin C tăng hấp thu.' },
      { nutrientId: 'calcium', reason: 'Duy trì 1.000 mg; bé hấp thu canxi ngày càng nhiều.' },
    ],
    dailyGoals: 'DHA ≥200 mg · sắt 27 mg + vitamin C 85 mg · canxi 1.000 mg',
    suggestedFoods: ['Cá hồi nướng', 'Cá thu kho', 'Cá mòi', 'Rau ngót', 'Ổi/cam', 'Trứng'],
    notes: 'Có thể cảm nhận thai máy. Ăn cá ít thủy ngân 2–3 phần/tuần (FDA/EPA).',
    citations: [
      { org: 'ACOG', title: 'Update on Seafood Consumption During Pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/01/update-on-seafood-consumption-during-pregnancy' },
      { org: 'FDA/EPA', title: 'Advice About Eating Fish', url: 'https://www.fda.gov/food/consumers/advice-about-eating-fish' },
    ],
  },
  {
    weekStart: 21,
    weekEnd: 24,
    trimester: 'T2',
    phaseLabel: 'T2 cuối',
    focus: [
      { nutrientId: 'fiber', reason: '28 g/ngày — chống táo bón, ổn định đường huyết.' },
      { nutrientId: 'calcium', reason: 'Chuột rút dễ xảy ra → đảm bảo canxi, đủ nước.' },
      { nutrientId: 'dha', reason: 'Duy trì ≥200 mg/ngày.' },
      { nutrientId: 'water', reason: '~2,3 L/ngày; nước ối và máu mẹ tăng.' },
    ],
    dailyGoals: 'Chất xơ 28 g · canxi 1.000 mg · DHA ≥200 mg · nước ~2,3 L',
    suggestedFoods: ['Gạo lứt', 'Yến mạch', 'Khoai lang', 'Rau luộc mỗi bữa', 'Chuối', 'Đậu đen'],
    notes: 'Chuột rút ban đêm thường tăng → chú ý canxi, magie, đủ nước; kéo giãn nhẹ chân.',
    citations: [
      { org: 'USDA', title: 'Dietary Guidelines 2020–2025 (fiber AI)', url: 'https://www.dietaryguidelines.gov/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    weekStart: 25,
    weekEnd: 26,
    trimester: 'T2',
    phaseLabel: 'T2 → T3',
    focus: [
      { nutrientId: 'iron', reason: 'Duy trì 27 mg — máu mẹ tiếp tục tăng, dự trữ cho bé.' },
      { nutrientId: 'calcium', reason: 'Duy trì 1.000 mg — chuẩn bị giai đoạn bé hấp thu canxi tối đa.' },
      { nutrientId: 'dha', reason: 'Duy trì ≥200 mg — sắp vào giai đoạn não tăng trưởng vượt bậc.' },
    ],
    dailyGoals: 'Sắt 27 mg · canxi 1.000 mg · DHA ≥200 mg',
    suggestedFoods: ['Thịt bò', 'Cá hồi', 'Sữa chua', 'Đậu phụ', 'Rau xanh đậm'],
    notes: 'Theo dõi tăng cân: ~0,4 kg/tuần ở T2/T3 (BMI bình thường, IOM 2009).',
    citations: [
      { org: 'IOM/NASEM', title: 'Weight Gain During Pregnancy (2009)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK32801/table/ch7.t1/' },
      { org: 'NIH/ODS', title: 'Iron — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
    ],
  },
  {
    weekStart: 27,
    weekEnd: 27,
    trimester: 'T2',
    phaseLabel: 'T2 cuối',
    focus: [
      { nutrientId: 'dha', reason: 'Não thai tăng ~3× trọng lượng, DHA tích lũy nhanh nhất (tuần 26–40).' },
      { nutrientId: 'iron', reason: 'Thai tích trữ sắt cho 6 tháng đầu đời — đỉnh ~tuần 30–36.' },
      { nutrientId: 'calcium', reason: 'Bé hấp thu canxi cao nhất khi cốt hóa xương.' },
    ],
    dailyGoals: 'DHA 200–300 mg · sắt 27 mg · canxi 1.000 mg · chất xơ 28 g',
    suggestedFoods: ['Cá hồi/cá thu', 'Trứng', 'Sữa', 'Đậu phụ', 'Rau ngót', 'Huyết lợn luộc (dùng vừa)'],
    notes: 'Bé hấp thu canxi cao nhất; não tích DHA nhanh nhất. Chất xơ chống táo bón T3.',
    citations: [
      { org: 'ACOG', title: 'Update on Seafood Consumption During Pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/01/update-on-seafood-consumption-during-pregnancy' },
      { org: 'NIH/ODS', title: 'Iron — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
    ],
  },
  {
    weekStart: 28,
    weekEnd: 30,
    trimester: 'T3',
    phaseLabel: 'T3 đầu',
    focus: [
      { nutrientId: 'dha', reason: 'Não thai tăng ~3× trọng lượng, DHA tích lũy nhanh nhất (tuần 26–40).' },
      { nutrientId: 'iron', reason: 'Thai tích trữ sắt cho 6 tháng đầu đời — đỉnh ~tuần 30–36.' },
      { nutrientId: 'calcium', reason: 'Bé hấp thu canxi cao nhất khi cốt hóa xương.' },
    ],
    dailyGoals: 'DHA 200–300 mg · sắt 27 mg · canxi 1.000 mg · chất xơ 28 g',
    suggestedFoods: ['Cá hồi/cá thu', 'Trứng', 'Sữa', 'Đậu phụ', 'Rau ngót', 'Huyết lợn luộc (dùng vừa)'],
    notes: 'Bé hấp thu canxi cao nhất; não tích DHA nhanh nhất. Chất xơ chống táo bón T3.',
    citations: [
      { org: 'ACOG', title: 'Update on Seafood Consumption During Pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/01/update-on-seafood-consumption-during-pregnancy' },
      { org: 'NIH/ODS', title: 'Iron — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
    ],
  },
  {
    weekStart: 31,
    weekEnd: 34,
    trimester: 'T3',
    phaseLabel: 'T3 giữa',
    focus: [
      { nutrientId: 'iron', reason: 'Đỉnh tích trữ sắt cho bé 6 tháng đầu đời; máu mẹ đạt đỉnh ~tuần 34.' },
      { nutrientId: 'dha', reason: 'Duy trì 200–300 mg/ngày.' },
      { nutrientId: 'fiber', reason: 'Táo bón/trĩ dễ xảy ra → duy trì 28 g + nước đủ.' },
    ],
    dailyGoals: 'Sắt 27 mg · DHA 200–300 mg · chất xơ 28 g · nước ~2,3 L',
    suggestedFoods: ['Thịt bò nạc', 'Rau xanh mỗi bữa', 'Gạo lứt', 'Đu đủ chín', 'Ổi', 'Sữa chua'],
    notes: 'Máu mẹ đạt đỉnh ~tuần 34; táo bón/trĩ phổ biến — tăng nước, chất xơ từ từ.',
    citations: [
      { org: 'NIH/ODS', title: 'Iron — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
      { org: 'USDA', title: 'Dietary Guidelines 2020–2025 (fiber AI)', url: 'https://www.dietaryguidelines.gov/' },
    ],
  },
  {
    weekStart: 35,
    weekEnd: 37,
    trimester: 'T3',
    phaseLabel: 'T3 cuối',
    focus: [
      { nutrientId: 'iron', reason: 'Duy trì 27 mg — tiếp tục dự trữ cho bé.' },
      { nutrientId: 'dha', reason: 'Duy trì 200–300 mg — não thai vẫn đang phát triển mạnh.' },
      { nutrientId: 'calcium', reason: 'Duy trì 1.000 mg — xương bé tiếp tục cốt hóa.' },
    ],
    dailyGoals: 'Sắt 27 mg · DHA 200–300 mg · canxi 1.000 mg',
    suggestedFoods: ['Cá hồi', 'Trứng', 'Sữa', 'Rau xanh', 'Các món chia nhỏ nhiều bữa'],
    notes: 'Tử cung chèn ép dạ dày → ăn ít nhưng nhiều bữa; uống đủ nước, tránh no quá.',
    citations: [
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
      { org: 'NIH/ODS', title: 'Calcium — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/' },
    ],
  },
  {
    weekStart: 38,
    weekEnd: 40,
    trimester: 'T3',
    phaseLabel: 'Chuẩn bị sinh',
    focus: [
      { nutrientId: 'iron', reason: 'Tiếp tục đều 27 mg đến khi sinh.' },
      { nutrientId: 'dha', reason: 'Duy trì ≥200 mg — não thai đang giai đoạn cuối.' },
      { nutrientId: 'water', reason: 'Uống đủ nước, chuẩn bị thể trạng cho sinh.' },
    ],
    dailyGoals: 'Sắt 27 mg · DHA ≥200 mg · nước ~2,3 L',
    suggestedFoods: ['Cơm gạo lứt', 'Cá hồi/cá mòi', 'Trứng', 'Sữa', 'Rau luộc', 'Canh rau'],
    notes: 'Chuẩn bị chế độ ăn cho con bú: năng lượng +500 kcal, canxi 1.000 mg, DHA (ACOG/NHS).',
    citations: [
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
      { org: 'NIH/ODS', title: 'Iron — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
    ],
  },
]

/**
 * Tra cứu hướng dẫn cho một tuần cụ thể (1–40).
 * Tuần ngoài 1–40 → null.
 */
export function getWeeklyFocus(week: number): WeeklyFocus | null {
  return WEEKLY_FOCUS.find((g) => week >= g.weekStart && week <= g.weekEnd) ?? null
}
