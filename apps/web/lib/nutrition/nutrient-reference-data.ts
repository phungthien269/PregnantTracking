// ===========================================================================
// nutrient-reference-data.ts — bảng chuẩn vi chất thai kỳ (Phase 6B).
// Nguồn số liệu: orchestration/docs/nutrition-knowledge-base.md + nutrition-sources.md
// Chuẩn chính: ACOG/NIH-ODS (tham chiếu WHO); UL = NIH/ODS & IOM; tham chiếu EFSA.
// MỌI số liệu ghi nguồn (tổ chức + URL). Đây là dữ liệu giáo dục sức khỏe,
// KHÔNG thay thế tư vấn y khoa — liều cao chỉ dùng khi bác sĩ chỉ định.
// Thuần TS, không import — .check.ts chạy bằng node đơn lẻ.
// ===========================================================================

export interface Citation {
  org: string
  title: string
  url: string
}

export type Trimester = 'T1' | 'T2' | 'T3'

/** Nhu cầu một tam cá nguyệt: value = số/ngày (null = không có số cụ thể), display = chuỗi hiển thị VN. */
export interface TrimesterAmount {
  value: number | null
  display: string
}

export interface NutrientReference {
  id: string
  name: string
  unit: string
  needs: Record<Trimester, TrimesterAmount>
  /** Ghi chú theo tuần nếu có (VD folate tuần 1–12, sắt đỉnh ~tuần 34...). */
  weekNotes?: string
  /** Dải bổ sung an toàn hằng ngày (min→max); null khi không áp dụng. */
  supplementRange: { min: number | null; max: number | null }
  supplementRangeNote?: string
  /** Giới hạn trên UL (mcg/mg/IU/... hằng ngày từ mọi nguồn); null = không có UL. */
  ul: number | null
  ulNote?: string
  /** Nguồn thực phẩm chính (tên Việt). */
  foodSources: string[]
  impactFetus: string
  impactMother: string
  citations: Citation[]
}

export const NUTRIENT_REFERENCES: NutrientReference[] = [
  {
    id: 'energy',
    name: 'Năng lượng',
    unit: 'kcal',
    needs: {
      T1: { value: 0, display: 'Không cần tăng (nền ~1.800–2.000 kcal/ngày)' },
      T2: { value: 340, display: '+340 kcal/ngày (ACOG; WHO +285)' },
      T3: { value: 450, display: '+450 kcal/ngày (ACOG; WHO +475; NHS +200 ở 12 tuần cuối)' },
    },
    weekNotes:
      'Nguyên tắc: ăn thêm đúng lượng, không "ăn cho hai người". NHS chỉ cần +200 kcal/ngày trong 12 tuần cuối. Chất lượng hơn số lượng — ưu tiên thực phẩm đậm đặc dưỡng chất.',
    supplementRange: { min: null, max: null },
    supplementRangeNote: 'Không phải vi chất bổ sung — không có UL; vượt nhu cầu → tăng cân quá mức, tiểu đường thai kỳ, thai to.',
    ul: null,
    foodSources: ['Cơm/bún/phở/cháo', 'Bánh mì', 'Sữa', 'Thịt cá trứng', 'Các bữa phụ hạt/quả'],
    impactFetus: 'Thiếu năng lượng kéo dài → chậm tăng trưởng trong tử cung, nhẹ cân, sinh non. Dư → thai to (macrosomia), tăng nguy cơ mổ lấy thai.',
    impactMother: 'Thiếu → mệt, đói cồn cào, giảm dự trữ cho tiết sữa. Dư → tăng cân quá mức (khó giảm sau sinh), tiểu đường thai kỳ, cao huyết áp.',
    citations: [
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
      { org: 'WHO/FAO/UNU', title: 'Energy requirements', url: 'https://www.fao.org/4/y5686e/y5686e07.htm' },
      { org: 'NHS', title: 'Have a healthy diet in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/have-a-healthy-diet/' },
    ],
  },
  {
    id: 'protein',
    name: 'Protein (đạm)',
    unit: 'g',
    needs: {
      T1: { value: 46, display: '~46 g/ngày (nền, RDA 0,8 g/kg)' },
      T2: { value: 71, display: '~60–71 g/ngày (RDA 1,1 g/kg)' },
      T3: { value: 75, display: '~60–75 g/ngày (1,1 g/kg)' },
    },
    weekNotes:
      'USDA/MyPlate: thêm ~25 g/ngày ở T2 và T3. Nghiên cứu IAAO mới gợi ý ~1,2–1,52 g/kg (~80–100 g) nhưng CHƯA phải chuẩn chính thức.',
    supplementRange: { min: 60, max: 100 },
    supplementRangeNote: 'Không UL chính thức; không nên quá 2 g/kg/ngày kéo dài. Ưu tiên protein từ thực phẩm hơn bột đạm bổ sung.',
    ul: null,
    ulNote: 'Không có UL chính thức cho protein.',
    foodSources: ['Thịt bò/lợn/gà nạc (20–26 g/100 g)', 'Cá (18–22 g/100 g)', 'Trứng (6 g/quả)', 'Sữa (8 g/ly 250 ml)', 'Đậu phụ (8–10 g/100 g)', 'Đậu đen/xanh (20–24 g/100 g)', 'Lạc/đậu phộng (25 g/100 g)'],
    impactFetus: 'Protein là "gạch" xây tế bào — thai phát triển nhanh nhất T2–T3, mọi cơ quan (não, tim, cơ, nhau thai) cần axit amin. Thiếu → chậm tăng trưởng, nhẹ cân.',
    impactMother: 'Thiếu → phù, mất cơ, mệt, rạn da nhiều, giảm khối lượng máu. Đủ đạm duy trì khối cơ, hỗ trợ nhau thai và tuyến vú.',
    citations: [
      { org: 'NIH/ODS', title: 'Nutrient recommendations (DRI)', url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx' },
      { org: 'USDA MyPlate', title: 'Protein Foods', url: 'https://www.myplate.gov/eat-healthy/protein-foods' },
      { org: 'IOM', title: 'Dietary Reference Intakes for macronutrients', url: 'https://www.nap.edu/catalog/10490' },
    ],
  },
  {
    id: 'folate',
    name: 'Folate / axit folic',
    unit: 'mcg DFE',
    needs: {
      T1: { value: 600, display: '600 mcg DFE/ngày (RDA); bổ sung 400 mcg axit folic/ngày — tuần 1–12 là quan trọng nhất' },
      T2: { value: 600, display: '600 mcg DFE/ngày (RDA)' },
      T3: { value: 600, display: '600 mcg DFE/ngày (RDA)' },
    },
    weekNotes:
      'Ống thần kinh đóng kín ~ngày 28 sau thụ thai (tuần ~6) → cần đủ từ TRƯỚC khi mang thai và bổ sung đến hết tuần 12. Nguy cơ cao (tiền sử NTD, BMI≥30, tiểu đường, động kinh): 4.000 mcg/ngày (CDC) hoặc 5 mg kê đơn (NHS) — theo bác sĩ.',
    supplementRange: { min: 400, max: 1000 },
    supplementRangeNote: 'Dạng axit folic từ viên/ngũ cốc tăng cường; không vượt 1.000 mcg/ngày trừ khi có chỉ định. UL áp cho dạng bổ sung, KHÔNG áp cho folate tự nhiên trong rau củ.',
    ul: 1000,
    ulNote: 'UL 1.000 mcg/ngày (dạng bổ sung/tăng cường). Liều 4–5 mg chỉ khi bác sĩ chỉ định nguy cơ cao.',
    foodSources: ['Rau ngót, cải bó xôi, mồng tơi (~140–160 mcg/bát)', 'Bông cải xanh (~108 mcg/bát)', 'Đậu đen/xanh khô (150–250 mcg/100 g)', 'Cam/quýt (~40 mcg/quả)', 'Ngũ cốc ăn sáng tăng cường', 'Gan gà (hạn chế — vitamin A)'],
    impactFetus: 'Thiếu quanh thời điểm thụ thai → dị tật ống thần kinh (NTD): nứt đốt sống, vô sọ. Bổ sung đủ trước + đầu thai kỳ giảm 50–70% nguy cơ NTD.',
    impactMother: 'Thiếu → thiếu máu hồng cầu to, mệt, chóng mặt, kém tập trung. Thừa axit folic liều rất cao kéo dài có thể che lấp thiếu B12.',
    citations: [
      { org: 'NIH/ODS', title: 'Folate — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/' },
      { org: 'CDC', title: 'Folic Acid', url: 'https://www.cdc.gov/ncbddd/folicacid/index.html' },
      { org: 'NHS', title: 'Vitamins, supplements and nutrition in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/vitamins-supplements-and-nutrition/' },
    ],
  },
  {
    id: 'iron',
    name: 'Sắt',
    unit: 'mg',
    needs: {
      T1: { value: 27, display: '27 mg/ngày (RDA — ACOG/NIH); nhu cầu tăng chậm' },
      T2: { value: 27, display: '27 mg/ngày — nhu cầu tăng mạnh khi máu mẹ mở rộng' },
      T3: { value: 27, display: '27 mg/ngày — dự trữ sắt cho bé 6 tháng đầu đời; đỉnh ~tuần 30–36' },
    },
    weekNotes:
      'Máu mẹ tăng ~50% (đỉnh ~tuần 34). WHO (vùng thiếu máu cao như VN): bổ sung phổ cập 30–60 mg/ngày; thiếu máu → 60–120 mg/ngày theo chỉ định. NHS: chỉ bổ sung khi xét nghiệm thiếu. Uống cách xa sữa/trà/cà phê ≥2 giờ, kèm vitamin C.',
    supplementRange: { min: 27, max: 45 },
    supplementRangeNote: 'Không vượt 45 mg/ngày từ mọi nguồn (thức ăn + viên). Thiếu máu: 60–120 mg/ngày CHỈ khi bác sĩ chỉ định.',
    ul: 45,
    ulNote: 'UL 45 mg/ngày (NIH/ODS). Viên sắt kèm vitamin C tăng hấp thu; cách xa canxi/sữa/trà/cà phê ≥2 giờ.',
    foodSources: ['Sò/nghêu chín (~28 mg/100 g)', 'Huyết lợn luộc (~9–30 mg/100 g)', 'Thịt bò nạc (~2,6–3,5 mg/100 g)', 'Rau ngót (~2,7 mg/100 g)', 'Cải bó xôi chín (~3,6 mg/100 g)', 'Rau muống (~2,5 mg/100 g)', 'Đậu đen khô (~5–6 mg/100 g)'],
    impactFetus: 'Sắt tạo hemoglobin vận chuyển oxy; thai tích trữ sắt T3 cho 6 tháng đầu sau sinh. Thiếu → thai thiếu oxy, nhẹ cân, sinh non, trẻ thiếu sắt ảnh hưởng phát triển não.',
    impactMother: 'Thiếu → thiếu máu thiếu sắt: mệt, xanh xao, khó thở, chóng mặt, rụng tóc, tăng nguy cơ băng huyết khi sinh. Thừa cấp → buồn nôn, táo bón.',
    citations: [
      { org: 'NIH/ODS', title: 'Iron — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
      { org: 'WHO eLENA', title: 'Daily iron supplementation in pregnancy', url: 'https://www.who.int/elena/titles/daily_iron_pregnancy/en/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    id: 'calcium',
    name: 'Canxi',
    unit: 'mg',
    needs: {
      T1: { value: 1000, display: '1.000 mg/ngày (ACOG/NIH)' },
      T2: { value: 1000, display: '1.000 mg/ngày (ACOG/NIH)' },
      T3: { value: 1000, display: '1.000 mg/ngày — thai hấp thu canxi mạnh nhất khi cốt hóa xương' },
    },
    weekNotes:
      'Nhu cầu không đổi qua 3 tam cá nguyệt nhưng thai hấp thu canxi mạnh nhất T3 — thiếu ăn → cơ thể lấy canxi từ xương mẹ. Vị thành niên mang thai: 1.300 mg. WHO vùng ít canxi (VN): 1.500–2.000 mg chia 2–3 lần.',
    supplementRange: { min: 500, max: 1000 },
    supplementRangeNote: 'Chia nhỏ ≤500 mg/lần (hấp thu tốt, ít táo bón); canxi carbonat uống cùng bữa ăn, canxi citrat uống lúc nào cũng được.',
    ul: 2500,
    ulNote: 'UL 2.500 mg/ngày từ mọi nguồn (NIH/ODS). Thừa hiếm: táo bón, sỏi thận, ức chế hấp thu sắt/kẽm.',
    foodSources: ['Sữa bò (300 mg/ly 250 ml)', 'Sữa chua (150 mg/hộp)', 'Phô mai (210 mg/30 g)', 'Đậu phụ đông đặc canxi (130–350 mg/100 g)', 'Cá mòi/cá cơm kho ăn cả xương (380 mg/100 g)', 'Rau ngót (169 mg/100 g)', 'Vừng/mè (90 mg/thìa)'],
    impactFetus: 'Canxi là vật liệu chính của xương và răng, cần cho đông máu, dẫn truyền thần kinh-cơ. Thiếu canxi mẹ kéo dài liên quan sinh non, nhẹ cân.',
    impactMother: 'Thiếu → chuột rút ban đêm, tê bì tay chân, đau lưng/hông, mất mật độ xương, tăng nguy cơ tiền sản giật (WHO khuyến nghị bổ sung vùng thiếu).',
    citations: [
      { org: 'NIH/ODS', title: 'Calcium — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/' },
      { org: 'WHO eLENA', title: 'Calcium supplementation during pregnancy', url: 'https://www.who.int/elena/titles/calcium_pregnancy/en/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    id: 'vitamin_d',
    name: 'Vitamin D',
    unit: 'IU',
    needs: {
      T1: { value: 600, display: '600 IU (15 mcg)/ngày (NIH/ACOG)' },
      T2: { value: 600, display: '600 IU (15 mcg)/ngày (NIH/ACOG)' },
      T3: { value: 600, display: '600 IU (15 mcg)/ngày — canxi hấp thu nhiều nhất T3 → vitamin D càng quan trọng' },
    },
    weekNotes:
      'NHS: 400 IU; WHO: 200 IU (chỉ khi thiếu). Thai nhận toàn bộ vitamin D từ mẹ → mẹ thiếu thì con sinh ra thiếu. VN nắng nhiều nhưng thiếu vitamin D vẫn phổ biến. Thiếu rõ (xét nghiệm): bác sĩ cho 1.000–4.000 IU/ngày ngắn hạn.',
    supplementRange: { min: 400, max: 600 },
    supplementRangeNote: 'Hầu hết thai phụ nên bổ sung 400–600 IU/ngày (có sẵn trong viên tiền sản) + phơi nắng sáng sớm 10–15 phút.',
    ul: 4000,
    ulNote: 'UL 4.000 IU (100 mcg)/ngày từ mọi nguồn (NIH/ODS).',
    foodSources: ['Cá hồi chín (400–800 IU/100 g)', 'Cá mòi (~190 IU/100 g)', 'Trứng (~50 IU/quả)', 'Sữa tăng cường (~100 IU/ly)', 'Nấm phơi nắng', 'Phơi nắng sáng sớm 10–15 phút'],
    impactFetus: 'Vitamin D tăng hấp thu canxi ở ruột → gián tiếp quyết định xương/răng thai. Thiếu → giảm canxi máu sơ sinh, còi xương bẩm sinh, chậm mọc răng.',
    impactMother: 'Thiếu → giảm hấp thu canxi (chuột rút, tê bì), mệt, tăng nguy cơ tiền sản giật và tiểu đường thai kỳ, giảm khối lượng xương.',
    citations: [
      { org: 'NIH/ODS', title: 'Vitamin D — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
      { org: 'NHS', title: 'Vitamins, supplements and nutrition in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/vitamins-supplements-and-nutrition/' },
    ],
  },
  {
    id: 'dha',
    name: 'DHA / Omega-3',
    unit: 'mg DHA',
    needs: {
      T1: { value: 200, display: '≥200 mg DHA/ngày (ACOG)' },
      T2: { value: 200, display: '≥200 mg DHA/ngày — não thai bắt đầu phát triển mạnh' },
      T3: { value: 200, display: '≥200 mg DHA/ngày — nhấn mạnh nhất: não tăng ~3×, DHA tích lũy nhanh nhất tuần 26–40' },
    },
    weekNotes:
      'FDA/EPA: ăn 2–3 phần cá ít thủy ngân/tuần (~100 g/phần): cá hồi, cá mòi, cá cơm, cá trích, cá rô phi, tôm. Tránh cá thủy ngân cao (cá mập, cá kiếm, cá thu vua, cá ngừ mắt to).',
    supplementRange: { min: 200, max: 1000 },
    supplementRangeNote: 'Không UL chính thức; DHA đơn lẻ đến ~1.000 mg/ngày an toàn. Chọn dầu cá/DHA tảo đã tinh luyện, tránh dầu gan cá (thừa vitamin A).',
    ul: null,
    ulNote: 'EFSA: EPA+DHA đến ~5.000 mg/ngày không gây nguy cơ chảy máu (mức an toàn, không phải khuyến nghị). Liều 2–6 g có thể tăng nhẹ LDL-cholesterol.',
    foodSources: ['Cá hồi chín (2,3 g EPA+DHA/100 g)', 'Cá thu Nhật/Đại Tây Dương (2,6 g/100 g)', 'Cá mòi hộp (1,5 g/100 g)', 'Cá cơm (1,4 g/100 g)', 'Trứng — lòng đỏ (0,04 g/quả)', 'DHA tảo (viên, chay an toàn)'],
    impactFetus: 'DHA là axit béo chủ lực của não và võng mạc, tích lũy cao nhất T3. Thiếu → giảm phát triển thần kinh, thị lực; bổ sung đủ giảm nguy cơ sinh non/sinh sớm.',
    impactMother: 'Thiếu → tâm trạng thất thường, khô da/mắt; omega-3 chống viêm hỗ trợ giảm nguy cơ tiền sản giật (bằng chứng đang tích lũy).',
    citations: [
      { org: 'ACOG', title: 'Update on Seafood Consumption During Pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/01/update-on-seafood-consumption-during-pregnancy' },
      { org: 'FDA/EPA', title: 'Advice About Eating Fish', url: 'https://www.fda.gov/food/consumers/advice-about-eating-fish' },
      { org: 'EFSA', title: 'Scientific Opinion on UL of EPA/DHA/DPA (2012)', url: 'https://www.efsa.europa.eu/en/efsajournal/pub/2815' },
    ],
  },
  {
    id: 'iodine',
    name: 'I-ốt',
    unit: 'mcg',
    needs: {
      T1: { value: 220, display: '220 mcg/ngày (NIH/IOM; WHO/ATA 250)' },
      T2: { value: 220, display: '220 mcg/ngày (NIH/IOM; WHO/ATA 250)' },
      T3: { value: 220, display: '220 mcg/ngày — tuyến giáp thai hoạt động từ ~tuần 12–14' },
    },
    weekNotes:
      'Quan trọng từ trước thụ thai → suốt thai kỳ → cho con bú. Tuyến giáp thai nhi bắt đầu hoạt động ~tuần 12–14, trước đó phụ thuộc hoàn toàn hormone giáp mẹ. ATA: tránh sản phẩm i-ốt >500 mcg/ngày; không ăn rong biển hằng ngày.',
    supplementRange: { min: 150, max: 250 },
    supplementRangeNote: 'Viên tiền sản thường chứa 150 mcg (đủ khi kèm muối i-ốt). KHÔNG tự uống thêm viên i-ốt riêng.',
    ul: 1100,
    ulNote: 'UL 1.100 mcg/ngày (NIH/IOM); thai phụ ≤18 tuổi: 900 mcg. ATA khuyến cáo tránh mọi sản phẩm i-ốt/rong biển >500 mcg/ngày.',
    foodSources: ['Muối i-ốt (20–40 mcg/g — nấu ăn hằng ngày)', 'Tôm/cá biển (10–60 mcg/100 g)', 'Trứng (25 mcg/quả)', 'Sữa (50–80 mcg/ly)', 'Rong biển (biến thiên rất lớn — dùng rất vừa phải)'],
    impactFetus: 'I-ốt là thành phần hormone tuyến giáp (T3/T4) quyết định phát triển não bộ. Thiếu → chậm phát triển thần kinh, giảm IQ, nặng → đần độn bẩm sinh (cretinism).',
    impactMother: 'Thiếu → bướu cổ, suy giáp (mệt, tăng cân, rụng tóc, lạnh), tăng nguy cơ sảy thai, sinh non. Thừa → rối loạn chức năng tuyến giáp (cả suy lẫn cường).',
    citations: [
      { org: 'NIH/ODS', title: 'Iodine — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/' },
      { org: 'ATA', title: 'Iodine Supplementation for Pregnancy and Lactation', url: 'https://www.thyroid.org/iodine-supplementation-pregnancy-lactation/' },
      { org: 'WHO', title: 'Iodine deficiency', url: 'https://www.who.int/health-topics/iodine-deficiency' },
    ],
  },
  {
    id: 'zinc',
    name: 'Kẽm',
    unit: 'mg',
    needs: {
      T1: { value: 11, display: '11 mg/ngày (IOM/NIH)' },
      T2: { value: 11, display: '11 mg/ngày (IOM/NIH)' },
      T3: { value: 11, display: '11 mg/ngày — thai tăng trưởng nhanh, nhu cầu tế bào cao' },
    },
    weekNotes: 'RDA không đổi qua 3 tam cá nguyệt. Viên tiền sản thường có ~10–15 mg kẽm.',
    supplementRange: { min: 11, max: 40 },
    supplementRangeNote: 'Không vượt 40 mg/ngày kéo dài → thiếu đồng, buồn nôn, giảm miễn dịch. Không cộng dồn nhiều viên chứa kẽm.',
    ul: 40,
    ulNote: 'UL 40 mg/ngày (NIH/ODS). Thừa mạn ≥40 mg/ngày → thiếu đồng (ảnh hưởng máu/thần kinh).',
    foodSources: ['Hàu (39–78 mg/100 g — 1–2 con đã đủ)', 'Thịt bò nạc (5–6 mg/100 g)', 'Thịt gà/lợn (2–4 mg/100 g)', 'Đậu đen/lạc (2–4 mg/100 g)', 'Tôm (1,5–2 mg/100 g)'],
    impactFetus: 'Kẽm cần cho phân chia tế bào, tổng hợp DNA/protein, miễn dịch, phát triển não. Thiếu → chậm tăng trưởng, nhẹ cân, sinh non.',
    impactMother: 'Thiếu → chán ăn, giảm vị giác, rụng tóc, móng giòn, dễ nhiễm trùng, chậm lành vết thương.',
    citations: [
      { org: 'NIH/ODS', title: 'Zinc — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    id: 'magnesium',
    name: 'Magie',
    unit: 'mg',
    needs: {
      T1: { value: 350, display: '350 mg/ngày (RDA 19–30 tuổi; 360 mg cho 31–50; 400 mg cho ≤18)' },
      T2: { value: 350, display: '350 mg/ngày — xương thai & mô mềm phát triển nhanh; nhu cầu tăng so với người thường' },
      T3: { value: 350, display: '350 mg/ngày — chuột rút thường tăng T3; magie hỗ trợ thần kinh-cơ và giấc ngủ' },
    },
    weekNotes:
      'RDA thai kỳ cao hơn người thường (~310–320 mg): 400 mg (≤18 tuổi), 350 mg (19–30), 360 mg (31–50). Nhiều phụ nữ Việt ăn không đủ (rau xanh ít, gạo trắng thay gạo lứt). Thiếu nhẹ → chuột rút đêm, tê bì, mất ngủ. Không cần viên riêng nếu ăn đủ hạt/đậu/rau xanh; nếu uống viên, chọn ≤350 mg magie nguyên tố/ngày.',
    supplementRange: { min: null, max: 350 },
    supplementRangeNote:
      'Chỉ bổ sung khi cần (chuột rút kéo dài, thiếu nhẹ) — chọn ≤350 mg magie nguyên tố/ngày, chia 1–2 lần; ưu tiên dạng citrate/glycinate dễ hấp thu. Không cộng dồn với magie có sẵn trong viên tiền sản.',
    ul: 350,
    ulNote:
      'UL 350 mg/ngày CHỈ áp cho magie từ dạng BỔ SUNG/thuốc (IOM 1997) — magie từ thực phẩm KHÔNG có UL và không tính vào giới hạn này.',
    foodSources: ['Hạt bí (~260 mg/100 g)', 'Vừng/mè (~350 mg/100 g)', 'Hạt điều (~250–270 mg/100 g)', 'Đậu phộng (~160–180 mg/100 g)', 'Đậu đen chín (~160 mg/100 g)', 'Rau dền/cải bó xôi chín (~60–90 mg/100 g)', 'Rau ngót, mồng tơi (rau xanh đậm)', 'Gạo lứt / yến mạch'],
    impactFetus: 'Magie tham gia >300 enzyme: tổng hợp protein/DNA, phát triển xương và hệ thần kinh-cơ, ổn định đường huyết và nhịp tim thai. Thiếu → tăng nguy cơ chậm tăng trưởng, nhẹ cân, sinh non, co thắt tử cung.',
    impactMother: 'Thiếu → chuột rút ban đêm, tê bì tay chân, đau đầu, mệt, mất ngủ, dễ căng thẳng; liên quan tăng nguy cơ tăng huyết áp thai kỳ/tiền sản giật và tiểu đường thai kỳ. Thừa từ viên bổ sung → tiêu chảy, buồn nôn.',
    citations: [
      { org: 'NIH/ODS', title: 'Magnesium — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/' },
      { org: 'NIH/ODS', title: 'Pregnancy — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Pregnancy-HealthProfessional/' },
      { org: 'IOM/NASEM', title: 'DRI table — Magnesium', url: 'https://www.ncbi.nlm.nih.gov/books/NBK109809/table/summary.t4/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    id: 'selenium',
    name: 'Selen',
    unit: 'mcg',
    needs: {
      T1: { value: 60, display: '60 mcg/ngày (RDA — NIH/ODS)' },
      T2: { value: 60, display: '60 mcg/ngày — thai phát triển tuyến giáp & hệ chống oxy hóa' },
      T3: { value: 60, display: '60 mcg/ngày — hỗ trợ miễn dịch mẹ và thai' },
    },
    weekNotes:
      'RDA tăng từ 55 mcg (người thường) lên 60 mcg khi mang thai. 1–2 hạt Brazil đã đủ nhu cầu — KHÔNG ăn quá nhiều (5–6 hạt có thể chạm UL 400 mcg). Hàm lượng selenium trong thực vật phụ thuộc đất trồng; ở Việt Nam nguồn tốt là hải sản, trứng, thịt.',
    supplementRange: { min: null, max: 60 },
    supplementRangeNote: 'Không cần viên selenium riêng — ăn 1–2 hạt Brazil hoặc hải sản/trứng mỗi ngày là đủ. Viên tiền sản một số loại chứa ~20 mcg. KHÔNG tự ý dùng liều cao.',
    ul: 400,
    ulNote: 'UL 400 mcg/ngày từ mọi nguồn (NIH/ODS). Thừa mạn → hơi thở mùi tỏi, rụng tóc, móng giòn/đổi màu, tổn thương thần kinh (selenosis).',
    foodSources: ['Hạt Brazil (~1.900 mcg/100 g — 1–2 hạt/ngày là đủ, đừng ăn quá tay)', 'Cá ngừ (~90–108 mcg/100 g)', 'Cá mòi (~45 mcg/100 g)', 'Tôm (~38 mcg/100 g)', 'Trứng (~30 mcg/100 g; ~15 mcg/quả)', 'Thịt bò/gà (~20–30 mcg/100 g)'],
    impactFetus: 'Selenium là thành phần selenoprotein — enzyme chống oxy hóa và chuyển hóa hormone tuyến giáp; hỗ trợ phát triển não, hệ miễn dịch và tuyến giáp thai. Thiếu → tăng nguy cơ nhẹ cân, chậm tăng trưởng.',
    impactMother: 'Chống oxy hóa bảo vệ tế bào, hỗ trợ tuyến giáp (giảm nguy cơ rối loạn tuyến giáp sau sinh). Thiếu → mệt, yếu cơ, dễ nhiễm trùng. Thừa liều cao → ngộ độc selenium (rụng tóc, móng yếu).',
    citations: [
      { org: 'NIH/ODS', title: 'Selenium — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Selenium-HealthProfessional/' },
      { org: 'WHO/FAO', title: 'Recommended dietary allowances for selenium (Table 6.4)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK569678/table/ch6.t4/' },
    ],
  },
  {
    id: 'potassium',
    name: 'Kali',
    unit: 'mg',
    needs: {
      T1: { value: 2900, display: '2.900 mg/ngày (AI — NASEM 2019, 19–50 tuổi; ≤18 tuổi: 2.600)' },
      T2: { value: 2900, display: '2.900 mg/ngày — máu mẹ tăng → giữ cân bằng dịch và điện giải' },
      T3: { value: 2900, display: '2.900 mg/ngày — huyết áp & phù nề thường đáng chú ý hơn T3' },
    },
    weekNotes:
      'AI thai kỳ 2.900 mg/ngày (19–50 tuổi), 2.600 mg (14–18) — NASEM 2019 (bản IOM 2005 cũ ghi 4.700 mg). Hầu hết phụ nữ Việt ăn thiếu kali. KHÔNG tự ý uống viên kali bổ sung — nguy hiểm tăng kali máu; chỉ cần ăn đủ rau/quả/đậu.',
    supplementRange: { min: null, max: null },
    supplementRangeNote: 'KHÔNG bổ sung viên kali khi không có chỉ định — nguy cơ tăng kali máu (rối loạn nhịp tim). Chỉ dùng khi bác sĩ kê (mất kali do thuốc lợi tiểu, nôn/tiêu chảy nhiều). Ưu tiên từ thực phẩm.',
    ul: null,
    ulNote: 'Không có UL cho kali từ thực phẩm (thận khỏe đào thải thừa). NGƯỢC LẠI: viên bổ sung kali (nhất là kali clorua) có thể gây tăng kali máu nguy hiểm — đặc biệt với bệnh thận, tiểu đường type 1, đang dùng thuốc ức chế men chuyển/lợi tiểu giữ kali.',
    foodSources: ['Rau dền (~611 mg/100 g)', 'Chuối (~358 mg/100 g; ~430 mg/quả)', 'Khoai lang (~330–420 mg/100 g)', 'Đậu trắng/đậu tây chín (~560 mg/100 g)', 'Khoai tây luộc (~420 mg/100 g)', 'Nước dừa (~250 mg/100 ml)', 'Cá hồi (~363 mg/100 g)'],
    impactFetus: 'Kali cần cho nhịp tim, dẫn truyền thần kinh-cơ và giữ cân bằng dịch/máu — duy trì môi trường ổn định cho thai tăng trưởng. Thiếu mẹ kéo dài có thể liên quan tăng huyết áp thai kỳ → ảnh hưởng gián tiếp thai.',
    impactMother: 'Thiếu → mệt, yếu cơ, chuột rút, táo bón, huyết áp cao; đủ kali qua rau/quả giúp điều hòa huyết áp, giảm phù. Thừa cấp (viên bổ sung) → tăng kali máu, rối loạn nhịp tim — nguy hiểm.',
    citations: [
      { org: 'NIH/ODS', title: 'Potassium — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Potassium-HealthProfessional/' },
      { org: 'NASEM 2019', title: 'Potassium: Dietary Reference Intakes for Adequacy', url: 'https://www.ncbi.nlm.nih.gov/books/NBK545428/' },
    ],
  },
  {
    id: 'phosphorus',
    name: 'Phốt pho',
    unit: 'mg',
    needs: {
      T1: { value: 700, display: '700 mg/ngày (RDA — IOM/NIH, 19–50 tuổi)' },
      T2: { value: 700, display: '700 mg/ngày — cốt hóa xương & răng thai tăng dần' },
      T3: { value: 700, display: '700 mg/ngày — xương thai hấp thu khoáng mạnh nhất T3' },
    },
    weekNotes:
      'RDA thai kỳ bằng người thường (700 mg) — cơ thể mẹ tăng hấp thu phốt pho ở ruột nên không cần tăng khẩu phần. Vị thành niên mang thai (14–18): 1.250 mg/ngày. Phốt pho có gần như mọi thực phẩm → thiếu hụt rất hiếm. Lưu ý phốt phát additive trong đồ chế biến/nước ngọt nhiều có thể cản trở hấp thu canxi.',
    supplementRange: { min: null, max: 700 },
    supplementRangeNote: 'Không cần viên phốt pho riêng — chế độ ăn bình thường (sữa, thịt, cá, đậu) đã đủ. Bổ sung phosphate liều cao có thể làm giảm canxi máu.',
    ul: 3500,
    ulNote: 'UL 3.500 mg/ngày (IOM) từ mọi nguồn. Thừa mạn (thường do phốt phát additive trong nước ngọt/đồ chế biến) → mất cân bằng canxi, nguy cơ bệnh thận-xương.',
    foodSources: ['Sữa (~230 mg/ly 250 ml)', 'Phô mai (~500 mg/100 g)', 'Thịt bò/lợn (~200 mg/100 g)', 'Cá (~200–240 mg/100 g)', 'Trứng (~180–200 mg/100 g)', 'Đậu đen/xanh chín (~120–180 mg/100 g)', 'Ngũ cốc nguyên cám (~250 mg/100 g)'],
    impactFetus: 'Phốt pho cùng canxi tạo hydroxyapatite — vật liệu xương và răng; tham gia DNA/RNA, màng tế bào và năng lượng ATP. Thiếu hiếm gặp nhưng gây chậm tăng trưởng, yếu xương.',
    impactMother: 'Hỗ trợ chuyển hóa năng lượng (ATP) và duy trì mật độ xương. Thừa phốt pho (đồ chế biến) làm giảm hấp thu canxi → ảnh hưởng xương, tăng nguy cơ sỏi thận.',
    citations: [
      { org: 'NIH/ODS', title: 'Phosphorus — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Phosphorus-HealthProfessional/' },
      { org: 'IOM/NASEM', title: 'DRI table — Calcium, Vitamin D, Phosphorus, Magnesium', url: 'https://www.ncbi.nlm.nih.gov/books/NBK45523/table/ch7.t1/' },
    ],
  },
  {
    id: 'copper',
    name: 'Đồng',
    unit: 'mcg',
    needs: {
      T1: { value: 1000, display: '1.000 mcg (1 mg)/ngày (RDA — NIH/IOM)' },
      T2: { value: 1000, display: '1.000 mcg/ngày — mô liên kết & mạch máu thai phát triển' },
      T3: { value: 1000, display: '1.000 mcg/ngày — thai tích trữ đồng ở gan chủ yếu T3' },
    },
    weekNotes:
      'RDA thai kỳ tăng từ 900 mcg (người thường) lên 1.000 mcg. Đồng tích lũy ở gan thai chủ yếu T3. Thiếu hụt thật sự hiếm — ăn hạt, hải sản, nội tạng là đủ. KHÔNG tự ý bổ sung đồng riêng.',
    supplementRange: { min: null, max: 1000 },
    supplementRangeNote: 'Không cần viên đồng riêng — thực phẩm đã đủ. Chú ý kẽm liều cao (≥40 mg/ngày kéo dài) gây THIẾU đồng thứ phát.',
    ul: 10000,
    ulNote: 'UL 10.000 mcg (10 mg)/ngày — 19+ tuổi; tuổi 14–18: 8.000 mcg (NIH/ODS). Thừa đồng mạn → tổn thương gan, đau bụng, buồn nôn.',
    foodSources: ['Gan bò/gà (hạn chế — vitamin A) (~9.800 mcg/100 g)', 'Hàu (~4.900 mcg/100 g)', 'Hạt điều (~2.200 mcg/100 g)', 'Nấm hương khô (~2.000 mcg/100 g)', 'Sô cô la đen (~1.700 mcg/100 g)', 'Vừng/mè (~1.400 mcg/100 g)', 'Cua (~900 mcg/100 g)', 'Mực/bạch tuộc (~400–600 mcg/100 g)'],
    impactFetus: 'Đồng cần cho hình thành mô liên kết (xương, mạch máu, tim), phát triển não và chuyển hóa sắt. Thiếu → tăng nguy cơ chậm tăng trưởng, nhẹ cân; thiếu nặng hiếm gặp.',
    impactMother: 'Hỗ trợ hấp thu/chuyển hóa sắt (giảm nguy cơ thiếu máu), tạo collagen cho da/mạch máu, chống oxy hóa. Thừa mạn → tổn thương gan, rối loạn tiêu hóa.',
    citations: [
      { org: 'NIH/ODS', title: 'Copper — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Copper-HealthProfessional/' },
      { org: 'Harvard T.H. Chan', title: 'Copper — The Nutrition Source', url: 'https://nutritionsource.hsph.harvard.edu/copper/' },
    ],
  },
  {
    id: 'manganese',
    name: 'Mangan',
    unit: 'mg',
    needs: {
      T1: { value: 2, display: '2 mg/ngày (AI — IOM/NIH)' },
      T2: { value: 2, display: '2 mg/ngày — tạo xương & mô liên kết thai' },
      T3: { value: 2, display: '2 mg/ngày — xương thai cốt hóa, mangan góp phần tổng hợp chất nền xương' },
    },
    weekNotes:
      'AI thai kỳ 2 mg/ngày (không tăng so với người thường 1,8 mg). Mangan hấp thu từ thực phẩm khá thấp; nguồn chính: gạo lứt, yến mạch, hạt, trà, rau lá. Không cần viên riêng.',
    supplementRange: { min: null, max: 2 },
    supplementRangeNote: 'Không cần viên mangan — ăn hạt/gạo lứt/trà/rau là đủ. Không cộng dồn nhiều viên đa vi chất có chứa mangan.',
    ul: 11,
    ulNote: 'UL 11 mg/ngày — 19+ tuổi; tuổi 14–18: 9 mg (IOM). Thừa mangan (thường do bổ sung liều cao/phơi nhiễm) → triệu chứng thần kinh giống Parkinson.',
    foodSources: ['Yến mạch (~4,9 mg/100 g)', 'Hạt phỉ (~6 mg/100 g)', 'Hạt óc chó (~3,4 mg/100 g)', 'Gạo lứt (~1,8 mg/100 g thô; ~0,6 mg/chén chín)', 'Rau bina/cải bó xôi (~0,9 mg/100 g)', 'Dứa (~0,9 mg/100 g)', 'Trà xanh/trà đen (đáng kể khi uống nhiều)', 'Khoai lang (~0,3 mg/100 g)'],
    impactFetus: 'Mangan là đồng yếu tố enzyme (SOD chống oxy hóa, tổng hợp xương, chuyển hóa đường/chất béo) — hỗ trợ hình thành xương, mô liên kết và phát triển não thai. Thiếu hiếm gặp.',
    impactMother: 'Hỗ trợ tạo xương, chuyển hóa đường huyết (góp phần giảm nguy cơ tiểu đường thai kỳ), chống oxy hóa. Thừa mạn hiếm gặp từ thực phẩm — chủ yếu do bổ sung liều cao.',
    citations: [
      { org: 'NIH/ODS', title: 'Manganese — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Manganese-HealthProfessional/' },
      { org: 'Harvard T.H. Chan', title: 'Manganese — The Nutrition Source', url: 'https://nutritionsource.hsph.harvard.edu/manganese/' },
    ],
  },
  {
    id: 'vitamin_b12',
    name: 'Vitamin B12',
    unit: 'mcg',
    needs: {
      T1: { value: 2.6, display: '2,6 mcg/ngày (IOM/NIH)' },
      T2: { value: 2.6, display: '2,6 mcg/ngày — thai tích trữ B12 ở gan (chủ yếu T2–T3)' },
      T3: { value: 2.6, display: '2,6 mcg/ngày (IOM/NIH)' },
    },
    weekNotes:
      'Thai tích trữ B12 ở gan suốt thai kỳ (chủ yếu T2–T3) — nguồn dự trữ cho con sau sinh. Mẹ ăn chay/chay trường PHẢI bổ sung (thực vật không có B12 tự nhiên).',
    supplementRange: { min: 2.6, max: 25 },
    supplementRangeNote: 'Không có UL — dư thừa B12 thải qua nước tiểu, an toàn cao. Viên tiền sản thường 2,6–12 mcg.',
    ul: null,
    ulNote: 'Không có UL (an toàn cao, dư thừa thải qua nước tiểu).',
    foodSources: ['Sò/nghêu (~84 mcg/100 g)', 'Gan gà (hạn chế — vitamin A)', 'Cá hồi/cá thu (3–4 mcg/100 g)', 'Thịt bò (2–3 mcg/100 g)', 'Trứng (0,45 mcg/quả)', 'Sữa (0,9 mcg/ly)'],
    impactFetus: 'B12 cần cho tạo máu, tổng hợp myelin, phát triển não/ống thần kinh. Thiếu (kể cả khi folate đủ) → tăng nguy cơ dị tật ống thần kinh, chậm phát triển thần kinh, nhẹ cân.',
    impactMother: 'Thiếu → thiếu máu hồng cầu to, mệt, tê bì tay chân, rối loạn thăng bằng, trí nhớ giảm. Bổ sung dù thừa cũng không độc (không UL).',
    citations: [
      { org: 'NIH/ODS', title: 'Vitamin B12 — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/' },
      { org: 'NIH/ODS', title: 'Pregnancy — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Pregnancy-HealthProfessional/' },
    ],
  },
  {
    id: 'choline',
    name: 'Choline',
    unit: 'mg',
    needs: {
      T1: { value: 450, display: '450 mg/ngày (AI — IOM/NIH)' },
      T2: { value: 450, display: '450 mg/ngày (AI)' },
      T3: { value: 450, display: '450 mg/ngày — T3 não thai tăng trưởng vượt bậc → choline đặc biệt quan trọng' },
    },
    weekNotes:
      'Hầu hết phụ nữ (cả thế giới) không đạt 450 mg/ngày; viên tiền sản thường thiếu hoặc không đủ choline. 2 quả trứng ≈ 294 mg (~65% nhu cầu). Nghiên cứu gợi ý 480–930 mg có lợi hơn (chưa phải chuẩn chính thức).',
    supplementRange: { min: 450, max: 900 },
    supplementRangeNote: 'Nghiên cứu dùng 550–900 mg/ngày không thấy tác hại. Không bắt buộc viên choline nếu ăn đủ trứng.',
    ul: 3500,
    ulNote: 'UL 3.500 mg/ngày (IOM); thai phụ 14–18 tuổi: 3.000 mg. Quá liều: hạ huyết áp, mùi cơ thể tanh cá, đổ mồ hôi, buồn nôn, tổn thương gan.',
    foodSources: ['Trứng — cả lòng đỏ (147 mg/quả)', 'Gan gà (hạn chế — vitamin A)', 'Thịt bò (80–110 mg/100 g)', 'Cá hồi (90 mg/100 g)', 'Đậu phụ/đậu nành (30–50 mg/100 g)', 'Sữa (40 mg/ly)'],
    impactFetus: 'Choline tham gia hình thành não bộ, trí nhớ, vành đai myelin; cùng folate giảm nguy cơ dị tật ống thần kinh. Bổ sung đủ gợi ý cải thiện nhận thức của trẻ về sau.',
    impactMother: 'Thiếu → tăng nguy cơ tiền sản giật (một số nghiên cứu); gan nhiễm mỡ thai kỳ hiếm gặp liên quan thiếu choline.',
    citations: [
      { org: 'NIH/ODS', title: 'Choline — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Choline-HealthProfessional/' },
      { org: 'Harvard T.H. Chan', title: 'Choline — The Nutrition Source', url: 'https://nutritionsource.hsph.harvard.edu/choline/' },
    ],
  },
  {
    id: 'vitamin_c',
    name: 'Vitamin C',
    unit: 'mg',
    needs: {
      T1: { value: 85, display: '85 mg/ngày (IOM/NIH)' },
      T2: { value: 85, display: '85 mg/ngày (IOM/NIH)' },
      T3: { value: 85, display: '85 mg/ngày (IOM/NIH)' },
    },
    weekNotes: 'Thai phụ 14–18 tuổi: 80 mg/ngày. Nhu cầu không đổi qua 3 tam cá nguyệt; đặc biệt hữu ích khi ăn kèm sắt thực vật (tăng hấp thu).',
    supplementRange: { min: 85, max: 500 },
    supplementRangeNote: 'Thường không cần viên vitamin C riêng — 1 quả ổi/cam + rau mỗi ngày là đủ. Từ thực phẩm gần như không thể thừa.',
    ul: 2000,
    ulNote: 'UL 2.000 mg/ngày (19+); 1.800 mg (≤18). Thừa liều cao → tiêu chảy, đau bụng, tăng nguy cơ sỏi thận.',
    foodSources: ['Ổi (228 mg/100 g)', 'Bông cải xanh (89 mg/100 g)', 'Đu đủ chín (60 mg/100 g)', 'Cam (53 mg/quả)', 'Rau muống (55 mg/100 g)', 'Rau ngót (53 mg/100 g)', 'Chanh/quýt (30–53 mg)'],
    impactFetus: 'Cần cho tổng hợp collagen (da, mạch máu, dây rốn, nhau thai), chống oxy hóa, hấp thu sắt → gián tiếp hỗ trợ tăng trưởng.',
    impactMother: 'Thiếu → mệt, chảy máu chân răng, chậm lành vết thương, dễ nhiễm trùng. Đủ vitamin C hỗ trợ miễn dịch, giảm nguy cơ thiếu máu.',
    citations: [
      { org: 'NIH/ODS', title: 'Vitamin C — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/' },
      { org: 'NIH/IOM', title: 'Vitamin C UL table', url: 'https://www.ncbi.nlm.nih.gov/books/NBK225480/table/ttt00050/' },
    ],
  },
  {
    id: 'fiber',
    name: 'Chất xơ',
    unit: 'g',
    needs: {
      T1: { value: 28, display: '28 g/ngày (AI — IOM/USDA)' },
      T2: { value: 28, display: '28 g/ngày (AI)' },
      T3: { value: 28, display: '28 g/ngày — táo bón thường tăng T3 → nhấn mạnh' },
    },
    weekNotes:
      'Táo bón tăng T3 (progesterone giãn nhu động ruột + tử cung chèn ép + viên sắt). Không nên bổ sung chất xơ cô đặc liều cao; tăng nước song song; tăng từ từ tránh đầy hơi.',
    supplementRange: { min: 25, max: 35 },
    supplementRangeNote: 'Không UL; dải hợp lý 25–35 g/ngày từ thực phẩm. Tăng nước song song.',
    ul: null,
    ulNote: 'Không có UL. Bổ sung chất xơ cô đặc liều cao → đầy hơi, giảm hấp thu khoáng.',
    foodSources: ['Yến mạch (~4 g/bát)', 'Gạo lứt/nguyên cám (3 g/chén)', 'Đậu đen/xanh chín (8 g/100 g)', 'Rau luộc (2–4 g/bát)', 'Chuối/ổi/táo (3–4 g/quả)', 'Bánh mì nguyên cám (2–3 g/lát)'],
    impactFetus: 'Gián tiếp qua mẹ: ổn định đường huyết (giảm nguy cơ tiểu đường thai kỳ → thai to), giảm tăng cân quá mức.',
    impactMother: 'Thiếu → táo bón, trĩ (rất phổ biến T3), đầy bụng, đường huyết dao động. Đủ → đi tiêu đều, no lâu, kiểm soát cân nặng.',
    citations: [
      { org: 'USDA', title: 'Dietary Guidelines 2020–2025 (fiber AI)', url: 'https://www.dietaryguidelines.gov/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    id: 'water',
    name: 'Nước',
    unit: 'L',
    needs: {
      T1: { value: 2.3, display: '~2,3 L/ngày từ đồ uống (IOM/ACOG)' },
      T2: { value: 2.3, display: '~2,3 L/ngày từ đồ uống' },
      T3: { value: 2.3, display: '~2,3 L/ngày — nước ối và máu mẹ tăng → nhu cầu cao hơn' },
    },
    weekNotes:
      'Tổng nước (kể cả thức ăn) ~3 L/ngày. Uống theo khát + kiểm tra nước tiểu (vàng nhạt là đủ). T3 nước ối và máu mẹ tăng → uống đủ.',
    supplementRange: { min: 2, max: 3 },
    supplementRangeNote: 'Không UL. Ngưỡng thực dụng 2–3 L/ngày; caffeine/trà/sữa tính một phần nhưng nước lọc là chính.',
    ul: null,
    ulNote: 'Không có UL; uống quá nhiều cực hiếm gây hạ natri.',
    foodSources: ['Nước lọc/nước đun sôi để nguội', 'Nước canh', 'Sữa', 'Nước ép trái cây không đường', 'Tránh nước ngọt có ga/đường'],
    impactFetus: 'Đủ nước → duy trì nước ối, tưới máu nhau thai, vận chuyển dưỡng chất. Mất nước → giảm nước ối, có thể kích thích cơn gò/sinh non.',
    impactMother: 'Thiếu → mệt, đau đầu, chóng mặt, táo bón, nhiễm trùng tiểu, khô da. Uống đủ giảm sưng phù, táo bón, sỏi thận.',
    citations: [
      { org: 'ACOG', title: 'Nutrition During Pregnancy (hydration)', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
      { org: 'IOM/NASEM', title: 'Dietary Reference Intakes for Water', url: 'https://www.nap.edu/read/10925/chapter/6' },
    ],
  },
  {
    id: 'vitamin_a',
    name: 'Vitamin A / Retinol — ⚠️ CẢNH BÁO THỪA',
    unit: 'mcg RAE',
    needs: {
      T1: { value: 770, display: '770 mcg RAE/ngày (NIH/IOM); thường KHÔNG cần bổ sung riêng' },
      T2: { value: 770, display: '770 mcg RAE/ngày (NIH/IOM)' },
      T3: { value: 770, display: '770 mcg RAE/ngày (NIH/IOM)' },
    },
    weekNotes:
      '⚠️ THỪA retinol (nhất là T1) gây dị tật bẩm sinh (mắt, sọ, phổi, tim). 100 g gan gà ≈ 3.000–4.000 mcg RAE — đã chạm/ngấp ngưỡng UL cả ngày. UK khuyến cáo thai phụ KHÔNG ăn gan/sản phẩm từ gan và không dùng viên chứa retinol. Beta-caroten (vitamin A thực vật) KHÔNG có UL — an toàn.',
    supplementRange: { min: null, max: null },
    supplementRangeNote: 'KHÔNG bổ sung retinol riêng — chế độ ăn bình thường đã đủ. Ưu tiên beta-caroten từ rau củ quả vàng/cam/xanh đậm. Viên tiền sản thường chứa ≤770 mcg retinol — an toàn; không thêm viên vitamin A/retinol/dầu gan cá.',
    ul: 3000,
    ulNote: 'UL 3.000 mcg RAE/ngày (~10.000 IU) dạng retinol; thai phụ ≤18 tuổi: 2.800 mcg. Beta-caroten không có giới hạn trên.',
    foodSources: ['Cà rốt (beta-caroten, an toàn)', 'Bí đỏ, đu đủ, xoài (beta-caroten, an toàn)', 'Rau ngót, cải bó xôi (beta-caroten, an toàn)', 'Trứng, sữa (retinol lượng nhỏ an toàn)', 'TRÁNH: gan gà/heo/bò, pate gan (retinol cao)'],
    impactFetus: 'Đủ: cần cho mắt, da, miễn dịch, phát triển phổi/tim/thận. THỪA retinol (nhất là T1) → DỊ TẬT BẨM SINH (quái thai).',
    impactMother: 'Thiếu → quáng gà, khô mắt/da, giảm miễn dịch. Thừa retinol mạn → đau đầu, buồn nôn, tổn thương gan, rụng tóc. Beta-caroten thừa chỉ gây vàng da nhẹ (vô hại).',
    citations: [
      { org: 'NIH/ODS', title: 'Vitamin A and Carotenoids — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/' },
      { org: 'NHS', title: 'Foods to avoid in pregnancy (liver/vitamin A)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
      { org: 'UK COT', title: 'Vitamin A and pregnancy (liver)', url: 'https://cot.food.gov.uk/' },
    ],
  },
  {
    id: 'vitamin_b1',
    name: 'Vitamin B1 — Thiamin',
    unit: 'mg',
    needs: {
      T1: { value: 1.4, display: '1,4 mg/ngày (RDA — IOM/NIH)' },
      T2: { value: 1.4, display: '1,4 mg/ngày — chuyển hóa năng lượng tăng' },
      T3: { value: 1.4, display: '1,4 mg/ngày (RDA — IOM/NIH)' },
    },
    weekNotes:
      'Nhu cầu tăng từ 1,1 mg (người thường) lên 1,4 mg khi mang thai. Thiamin tan trong nước, không tích trữ nhiều → cần đủ mỗi ngày. Gạo trắng xát kỹ mất phần lớn thiamin → nên kết hợp gạo lứt/ngũ cốc nguyên cám và các loại đậu.',
    supplementRange: { min: 1.4, max: 25 },
    supplementRangeNote: 'Viên tiền sản thường chứa ~1,4 mg thiamin — đủ nhu cầu. Liều cao (25–50 mg/ngày) điều trị thiếu hụt chỉ khi bác sĩ chỉ định.',
    ul: null,
    ulNote: 'Không có UL (IOM/EFSA) — dư thừa tan trong nước, thải qua nước tiểu, an toàn cao.',
    foodSources: ['Thịt heo nạc/thăn (~0,5–0,7 mg/100 g — giàu B1 nhất trong thịt)', 'Hạt hướng dương (~1,5 mg/100 g)', 'Đậu phộng/lạc (~0,6 mg/100 g)', 'Đậu đen/xanh khô (~0,4–0,5 mg/100 g)', 'Gạo lứt / ngũ cốc nguyên cám (~0,3 mg/100 g)'],
    impactFetus: 'Thiamin là coenzyme chuyển hóa carbohydrate → cung cấp năng lượng cho não và hệ thần kinh thai đang phát triển. Thiếu kéo dài → chậm tăng trưởng, nguy cơ tổn thương thần kinh.',
    impactMother: 'Thiếu → mệt mỏi, chán ăn, tê bì, hay quên, dễ cáu gắt; nặng → bệnh beriberi (tim mạch, thần kinh). Nhu cầu tăng vì chuyển hóa năng lượng thai kỳ cao.',
    citations: [
      { org: 'NIH/ODS', title: 'Thiamin — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Thiamin-HealthProfessional/' },
      { org: 'NIH/ODS', title: 'Nutrient recommendations (DRI)', url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx' },
    ],
  },
  {
    id: 'vitamin_b2',
    name: 'Vitamin B2 — Riboflavin',
    unit: 'mg',
    needs: {
      T1: { value: 1.4, display: '1,4 mg/ngày (RDA — IOM/NIH)' },
      T2: { value: 1.4, display: '1,4 mg/ngày — phát triển tế bào & nhau thai nhanh' },
      T3: { value: 1.4, display: '1,4 mg/ngày (RDA — IOM/NIH)' },
    },
    weekNotes:
      'Nhu cầu tăng từ 1,1 mg lên 1,4 mg ở thai kỳ. Riboflavin nhạy ánh sáng — bảo quản sữa và sữa chua tránh nắng để giữ hàm lượng. Thiếu nhẹ khá phổ biến (nứt khóe miệng).',
    supplementRange: { min: 1.4, max: 25 },
    supplementRangeNote: 'Viên tiền sản thường chứa ~1,4 mg riboflavin — đủ. Không có UL; dư thừa thải qua nước tiểu (nước tiểu vàng tươi là bình thường).',
    ul: null,
    ulNote: 'Không có UL (IOM/EFSA) — an toàn cao; dư thừa thải qua nước tiểu.',
    foodSources: ['Gan gà (hạn chế — vitamin A) (~1,5–2 mg/100 g)', 'Sữa (~0,4 mg/ly 250 ml)', 'Trứng (~0,2 mg/quả)', 'Thịt bò/gà nạc (~0,2 mg/100 g)', 'Rau lá xanh đậm: cải bó xôi, rau ngót (~0,1–0,2 mg/100 g)', 'Sữa chua, phô mai'],
    impactFetus: 'Riboflavin cần cho phát triển tế bào, hô hấp tế bào và tạo máu. Thiếu → tăng nguy cơ chậm tăng trưởng và (theo một số nghiên cứu) tiền sản giật.',
    impactMother: 'Thiếu → nứt khóe miệng, viêm lưỡi, mỏi mắt, nhạy cảm ánh sáng, mệt. Nhu cầu tăng do chuyển hóa năng lượng của mẹ và thai cao hơn.',
    citations: [
      { org: 'NIH/ODS', title: 'Riboflavin — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Riboflavin-HealthProfessional/' },
      { org: 'NIH/ODS', title: 'Nutrient recommendations (DRI)', url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx' },
    ],
  },
  {
    id: 'vitamin_b3',
    name: 'Vitamin B3 — Niacin',
    unit: 'mg NE',
    needs: {
      T1: { value: 18, display: '18 mg NE/ngày (RDA — IOM/NIH)' },
      T2: { value: 18, display: '18 mg NE/ngày — tổng hợp DNA tăng' },
      T3: { value: 18, display: '18 mg NE/ngày (RDA — IOM/NIH)' },
    },
    weekNotes:
      'NE = niacin tương đương (1 mg niacin hoặc 60 mg tryptophan từ protein). Nhu cầu tăng từ 14 mg lên 18 mg ở thai kỳ. Không cần viên riêng nếu ăn đủ thịt/cá/đậu.',
    supplementRange: { min: 18, max: 35 },
    supplementRangeNote: 'Không vượt 35 mg/ngày từ dạng bổ sung/tăng cường (UL). Dạng niacin liều cao gây đỏ bừng mặt, buồn nôn — không cần thiết trong thai kỳ.',
    ul: 35,
    ulNote: 'UL 35 mg/ngày (IOM) áp cho dạng bổ sung/tăng cường (niacin amid an toàn hơn nhưng không khuyến nghị liều cao). Niacin tự nhiên trong thực phẩm không có UL.',
    foodSources: ['Thịt gà (~12 mg/100 g)', 'Cá ngừ/cá hồi (~8–10 mg/100 g)', 'Thịt bò nạc (~5 mg/100 g)', 'Lạc/đậu phộng (~12 mg/100 g)', 'Gạo lứt (~4 mg/100 g)'],
    impactFetus: 'Niacin tham gia tổng hợp DNA/RNA và chuyển hóa năng lượng — cần cho sự phân chia tế bào nhanh của thai. Thiếu nặng → dị tật bẩm sinh (hiếm gặp).',
    impactMother: 'Thiếu → mệt, chán ăn, tiêu chảy, viêm da; nặng → pellagra (viêm da, tiêu chảy, rối loạn thần kinh). Bổ sung niacin quá 35 mg/ngày → đỏ bừng mặt, buồn nôn.',
    citations: [
      { org: 'NIH/ODS', title: 'Niacin — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Niacin-HealthProfessional/' },
      { org: 'NIH/ODS', title: 'Nutrient recommendations (DRI)', url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx' },
    ],
  },
  {
    id: 'vitamin_b5',
    name: 'Vitamin B5 — Acid pantothenic',
    unit: 'mg',
    needs: {
      T1: { value: 6, display: '6 mg/ngày (AI — IOM/NIH)' },
      T2: { value: 6, display: '6 mg/ngày (AI)' },
      T3: { value: 6, display: '6 mg/ngày (AI)' },
    },
    weekNotes:
      'AI tăng từ 5 mg lên 6 mg ở thai kỳ. Pantothenic acid có rộng rãi trong thực phẩm nên thiếu hụt rất hiếm — không cần viên riêng.',
    supplementRange: { min: 6, max: 20 },
    supplementRangeNote: 'Viên tiền sản thường chứa ~6 mg — đủ. Không có UL; dư thừa thải qua nước tiểu.',
    ul: null,
    ulNote: 'Không có UL (IOM) — thiếu số liệu tác hại ở người; dư thừa thải qua nước tiểu.',
    foodSources: ['Gan gà (hạn chế — vitamin A) (~7–8 mg/100 g)', 'Nấm (~2,5 mg/100 g)', 'Trứng (~1,5 mg/quả)', 'Cá hồi (~1,5 mg/100 g)', 'Bơ/quả bơ (~1,4 mg/100 g)', 'Thịt gà (~1 mg/100 g)'],
    impactFetus: 'Pantothenic acid là thành phần coenzyme A — trung tâm chuyển hóa chất béo, protein và tổng hợp hormone steroid. Thiếu hiếm gặp nhưng góp phần chậm tăng trưởng.',
    impactMother: 'Thiếu hiếm gặp (có trong hầu hết thực phẩm) — triệu chứng mệt, tê bì, nhức đầu, rối loạn giấc ngủ. Không có UL, an toàn cao.',
    citations: [
      { org: 'NIH/ODS', title: 'Pantothenic Acid — Health Professional', url: 'https://ods.od.nih.gov/factsheets/PantothenicAcid-HealthProfessional/' },
      { org: 'NIH/ODS', title: 'Nutrient recommendations (DRI)', url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx' },
    ],
  },
  {
    id: 'vitamin_b6',
    name: 'Vitamin B6 — Pyridoxin',
    unit: 'mg',
    needs: {
      T1: { value: 1.9, display: '1,9 mg/ngày (RDA — IOM/NIH); liên quan giảm ốm nghén' },
      T2: { value: 1.9, display: '1,9 mg/ngày — phát triển não thai' },
      T3: { value: 1.9, display: '1,9 mg/ngày (RDA — IOM/NIH)' },
    },
    weekNotes:
      '⚠️ GIẢM ỐM NGHÉN: ACOG khuyến cáo B6 10–25 mg/lần ×3/ngày (30–75 mg/ngày) cho buồn nôn thai kỳ — CHỈ theo hướng dẫn, không tự ý. Tổng không vượt 100 mg/ngày (UL) kẻo tổn thương thần kinh ngoại biên.',
    supplementRange: { min: 1.9, max: 75 },
    supplementRangeNote: 'RDA chỉ 1,9 mg — viên tiền sản thường chứa 2–10 mg. Liều 10–25 mg ×3/ngày trị ốm nghén chỉ khi bác sĩ chỉ định; không vượt 100 mg/ngày.',
    ul: 100,
    ulNote: 'UL 100 mg/ngày (IOM). Dùng kéo dài >100 mg/ngày → tê bì, tổn thương thần kinh ngoại biên.',
    foodSources: ['Thịt gà (~0,6 mg/100 g)', 'Cá hồi/cá ngừ (~0,6–0,9 mg/100 g)', 'Khoai tây (~0,3 mg/100 g)', 'Chuối (~0,4 mg/quả)', 'Đậu xanh (~0,4 mg/100 g)', 'Cải bó xôi (~0,2 mg/100 g)'],
    impactFetus: 'B6 cần cho phát triển não bộ và hệ thần kinh thai, tổng hợp neurotransmitter và tạo hemoglobin. Thiếu → tăng nguy cơ chậm phát triển thần kinh, nhẹ cân.',
    impactMother: 'Thiếu → mệt, kích ứng, buồn nôn, thiếu máu nhẹ, tê bì tay chân. Đủ B6 (theo chỉ định) giúp GIẢM ỐM NGHÉN; quá 100 mg/ngày kéo dài → tổn thương thần kinh.',
    citations: [
      { org: 'NIH/ODS', title: 'Vitamin B6 — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/' },
      { org: 'ACOG', title: 'Nausea and Vomiting of Pregnancy (Practice Bulletin No. 189)', url: 'https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2018/01/nausea-and-vomiting-of-pregnancy' },
    ],
  },
  {
    id: 'vitamin_b7',
    name: 'Vitamin B7 — Biotin',
    unit: 'mcg',
    needs: {
      T1: { value: 30, display: '30 mcg/ngày (AI — IOM/NIH)' },
      T2: { value: 30, display: '30 mcg/ngày (AI)' },
      T3: { value: 30, display: '30 mcg/ngày — tăng trưởng tế bào & tóc móng mẹ' },
    },
    weekNotes:
      'AI thai kỳ = 30 mcg/ngày (không tăng so với người thường). Thiếu biotin thực sự hiếm; ở thai kỳ cơ thể đào thải biotin nhanh hơn nên chú ý ăn đủ trứng/gan/hạt.',
    supplementRange: { min: 30, max: 100 },
    supplementRangeNote: 'Viên tiền sản thường chứa ~30–300 mcg — an toàn. Không có UL. ⚠️ Biotin liều ≥5.000 mcg/ngày làm sai lệch nhiều xét nghiệm máu (troponin, tuyến giáp).',
    ul: null,
    ulNote: 'Không có UL (IOM) — chưa ghi nhận tác hại. Lưu ý tương tác xét nghiệm khi dùng liều rất cao.',
    foodSources: ['Lòng đỏ trứng (~10 mcg/quả)', 'Gan gà (hạn chế — vitamin A) (~30–40 mcg/100 g)', 'Hạt hướng dương (~30 mcg/100 g)', 'Quả óc chó (~2 mcg/quả)', 'Khoai lang (~5 mcg/100 g)', 'Nấm'],
    impactFetus: 'Biotin cần cho chuyển hóa axit béo, axit amin và tổng hợp glucose — hỗ trợ tăng trưởng tế bào thai. Thiếu hiếm nhưng gặp ở mẹ ăn kiêng quá mức.',
    impactMother: 'Thiếu (hiếm) → rụng tóc, móng giòn, viêm da, mệt mỏi. Nhu cầu tăng nhẹ ở thai kỳ; dư thừa thải qua nước tiểu, an toàn cao.',
    citations: [
      { org: 'NIH/ODS', title: 'Biotin — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Biotin-HealthProfessional/' },
      { org: 'NIH/ODS', title: 'Nutrient recommendations (DRI)', url: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx' },
    ],
  },
  {
    id: 'vitamin_e',
    name: 'Vitamin E',
    unit: 'mg (α-TE)',
    needs: {
      T1: { value: 15, display: '15 mg α-TE/ngày (RDA — IOM/NIH)' },
      T2: { value: 15, display: '15 mg α-TE/ngày — chống oxy hóa bảo vệ màng tế bào' },
      T3: { value: 15, display: '15 mg α-TE/ngày (RDA — IOM/NIH)' },
    },
    weekNotes:
      'RDA thai kỳ 15 mg/ngày (α-tocopherol), không đổi qua 3 tam cá nguyệt. Nguồn chính: hạt, dầu thực vật, rau xanh. KHÔNG tự ý bổ sung vitamin E liều cao — một số nghiên cứu gợi ý liều cao tăng nguy cơ tăng huyết áp thai kỳ.',
    supplementRange: { min: 15, max: 100 },
    supplementRangeNote: 'Viên tiền sản thường chứa 15–30 mg — đủ. Không vượt 400–1.000 mg/ngày (UL 1.000 mg); liều cao gây chảy máu, tăng nguy cơ tăng huyết áp thai kỳ.',
    ul: 1000,
    ulNote: 'UL 1.000 mg/ngày α-TE dạng bổ sung (IOM); thai phụ ≤18 tuổi: 800 mg. Vitamin E từ thực phẩm không gây thừa.',
    foodSources: ['Hạt hướng dương (~35 mg/100 g)', 'Hạnh nhân (~25 mg/100 g)', 'Đậu phộng/lạc (~8 mg/100 g)', 'Dầu thực vật: hướng dương/đậu nành (~5–6 mg/thìa)', 'Rau lá xanh đậm: cải bó xôi, rau ngót (~1–2 mg/100 g)'],
    impactFetus: 'Vitamin E chống oxy hóa bảo vệ màng tế bào thai, hỗ trợ phát triển phổi và mắt. Thiếu nặng → thiếu máu tan máu, chậm tăng trưởng.',
    impactMother: 'Thiếu → yếu cơ, tê bì, giảm miễn dịch, da khô. Thừa liều cao (>1.000 mg/ngày) → nguy cơ chảy máu khi sinh, tăng huyết áp thai kỳ — không tự bổ sung liều cao.',
    citations: [
      { org: 'NIH/ODS', title: 'Vitamin E — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    id: 'vitamin_k',
    name: 'Vitamin K',
    unit: 'mcg',
    needs: {
      T1: { value: 90, display: '90 mcg/ngày (AI — IOM/NIH)' },
      T2: { value: 90, display: '90 mcg/ngày (AI)' },
      T3: { value: 90, display: '90 mcg/ngày — thai dự trữ vitamin K rất ít' },
    },
    weekNotes:
      'AI thai kỳ 90 mcg/ngày, không đổi so với người thường. Rau lá xanh đậm cung cấp rất dồi dào (1 bát cải bó xôi chín đã vượt cả ngày) → không cần viên riêng. Trẻ sơ sinh thường được tiêm vitamin K ngay sau sinh vì thai dự trữ rất ít.',
    supplementRange: { min: null, max: 90 },
    supplementRangeNote: 'Không cần bổ sung riêng — ăn rau xanh mỗi ngày là đủ. Thai phụ dùng thuốc chống đông (warfarin) phải giữ lượng vitamin K ổn định theo chỉ dẫn bác sĩ.',
    ul: null,
    ulNote: 'Không có UL (IOM) — không ghi nhận tác hại từ thực phẩm. Thận trọng với thuốc chống đông máu.',
    foodSources: ['Cải bó xôi chín (~480 mcg/100 g)', 'Cải xoăn/kale (~500 mcg/100 g)', 'Bông cải xanh (~140 mcg/100 g)', 'Rau ngót, mồng tơi, rau muống (~100–200 mcg/100 g)', 'Cải thìa, giá đỗ', 'Dầu đậu nành'],
    impactFetus: 'Vitamin K cần cho tổng hợp các yếu tố đông máu — thai dự trữ rất ít, thiếu mẹ kéo dài → tăng nguy cơ xuất huyết ở trẻ sơ sinh.',
    impactMother: 'Thiếu hiếm gặp (rau xanh cung cấp dồi dào) — nguy cơ rối loạn đông máu, dễ bầm tím, chảy máu chân răng. Không có UL; dùng thuốc chống đông cần giữ lượng vitamin K ổn định.',
    citations: [
      { org: 'NIH/ODS', title: 'Vitamin K — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminK-HealthProfessional/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
]

/** Tra cứu nhanh theo id — trả về undefined nếu không có. */
export function getNutrientReference(id: string): NutrientReference | undefined {
  return NUTRIENT_REFERENCES.find((n) => n.id === id)
}
