// ===========================================================================
// supplement-data.ts — khuyến nghị bổ sung theo giai đoạn thai kỳ (Phase 6B).
// Mỗi chất: liều khuyến nghị, thời điểm, khi nào CẦN bác sĩ, cảnh báo thừa, nguồn.
// Nguyên tắc: thực phẩm trước, viên bổ sung sau; không tự ý liều cao; không cộng
// dồn nhiều viên cùng vi chất. Chuẩn chính: ACOG/NIH-ODS (tham chiếu WHO),
// an toàn/UL = NIH-ODS & IOM, tham chiếu EFSA. Thuần TS, không import.
// ===========================================================================

export interface Citation {
  org: string
  title: string
  url: string
}

export interface SupplementRecommendation {
  id: string
  /** Tên chất (tiếng Việt). */
  name: string
  /** Liều khuyến nghị hằng ngày. */
  dose: string
  /** Thời điểm nên uống / lưu ý dùng. */
  timing: string
  /** Giai đoạn áp dụng. */
  stage: string
  /** Khi nào CẦN hỏi bác sĩ trước (liều cao / thiếu máu / tiền sử / tương tác). */
  doctorNeeded: string[]
  /** Cảnh báo thừa nếu có. */
  excessWarning?: string
  citations: Citation[]
}

export const SUPPLEMENT_RECOMMENDATIONS: SupplementRecommendation[] = [
  {
    id: 'folic_acid',
    name: 'Axit folic',
    dose: '400–600 mcg/ngày (dạng bổ sung); RDA thai kỳ 600 mcg DFE',
    timing: 'Uống hằng ngày, từ ≥1 tháng trước thụ thai → hết tuần 12 (quan trọng nhất); tiếp tục 600 mcg DFE cả thai kỳ.',
    stage: 'Trước thụ thai → tuần 12 (bổ sung); cả thai kỳ (RDA)',
    doctorNeeded: [
      'Tiền sử con dị tật ống thần kinh, BMI ≥30, tiểu đường, động kinh → cần 4.000 mcg/ngày (CDC) hoặc 5 mg kê đơn (NHS).',
      'Đang dùng thuốc chống động kinh, methotrexate (tương tác folate).',
    ],
    excessWarning: 'Không tự vượt 1.000 mcg/ngày từ dạng bổ sung (che lấp thiếu B12 → nguy cơ thần kinh). Liều 4–5 mg chỉ khi bác sĩ chỉ định.',
    citations: [
      { org: 'NIH/ODS', title: 'Folate — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/' },
      { org: 'CDC', title: 'Folic Acid', url: 'https://www.cdc.gov/ncbddd/folicacid/index.html' },
      { org: 'NHS', title: 'Vitamins, supplements and nutrition in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/vitamins-supplements-and-nutrition/' },
    ],
  },
  {
    id: 'iron_supplement',
    name: 'Sắt',
    dose: '27 mg/ngày (RDA). WHO vùng thiếu máu cao (VN): 30–60 mg/ngày phổ cập',
    timing: 'Uống cách xa sữa/trà/cà phê ≥2 giờ; kèm vitamin C (chanh, ổi, cam) tăng hấp thu. Chia nhỏ nếu đau bụng/táo bón.',
    stage: 'Cả thai kỳ',
    doctorNeeded: [
      'Thiếu máu thiếu sắt → cần 60–120 mg/ngày (chỉ theo bác sĩ — vượt UL 45 mg).',
      'Táo bón nặng kéo dài do viên sắt → đổi dạng sắt fumarate/giảm liều theo tư vấn.',
      'Tiền sử thừa sắt, bệnh gan, đang dùng kháng sinh nhóm tetracycline (giảm hấp thu).',
    ],
    excessWarning: 'Không vượt 45 mg/ngày từ mọi nguồn (UL). Thừa cấp → buồn nôn, táo bón, đau bụng; thừa mạn → quá tải sắt (hiếm).',
    citations: [
      { org: 'NIH/ODS', title: 'Iron — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
      { org: 'WHO eLENA', title: 'Daily iron supplementation in pregnancy', url: 'https://www.who.int/elena/titles/daily_iron_pregnancy/en/' },
    ],
  },
  {
    id: 'vitamin_d_supplement',
    name: 'Vitamin D',
    dose: '400–600 IU/ngày (NIH/ACOG 600; NHS 400)',
    timing: 'Uống cùng bữa ăn có chất béo (tăng hấp thu); thường có sẵn trong viên vitamin tổng hợp tiền sản.',
    stage: 'Cả thai kỳ',
    doctorNeeded: [
      'Nghi ngờ thiếu vitamin D (xét nghiệm) → bác sĩ có thể cho 1.000–4.000 IU/ngày ngắn hạn.',
      'Tiền sử bệnh thận/sỏi thận, tăng canxi máu.',
    ],
    excessWarning: 'Không vượt 4.000 IU (100 mcg)/ngày từ mọi nguồn (UL). Thừa cực cao gây tăng canxi máu.',
    citations: [
      { org: 'NIH/ODS', title: 'Vitamin D — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    id: 'calcium_supplement',
    name: 'Canxi',
    dose: '1.000 mg/ngày (vị thành niên 1.300 mg); WHO vùng ít canxi 1.500–2.000 mg chia 2–3 lần',
    timing: 'Chia ≤500 mg/lần (hấp thu tốt, ít táo bón). Canxi carbonat uống cùng bữa ăn; canxi citrat uống lúc nào cũng được. KHÔNG uống chung giờ với sắt/kẽm liều cao.',
    stage: 'Cả thai kỳ — quan trọng nhất T3 (bé cốt hóa xương)',
    doctorNeeded: [
      'Không dung nạp lactose/ăn chay không đủ sữa → cân nhắc viên canxi 500 mg theo tư vấn.',
      'Tiền sử sỏi thận, tăng canxi máu, cường cận giáp.',
    ],
    excessWarning: 'Không vượt 2.500 mg/ngày (UL). Thừa → táo bón, sỏi thận, ức chế hấp thu sắt/kẽm.',
    citations: [
      { org: 'NIH/ODS', title: 'Calcium — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/' },
      { org: 'WHO eLENA', title: 'Calcium supplementation during pregnancy', url: 'https://www.who.int/elena/titles/calcium_pregnancy/en/' },
    ],
  },
  {
    id: 'dha_supplement',
    name: 'DHA / Omega-3',
    dose: '≥200 mg DHA/ngày; 200–300 mg/ngày nếu ít ăn cá',
    timing: 'Uống hằng ngày, có thể cùng bữa ăn. Chọn DHA tinh luyện (dầu cá) hoặc DHA tảo (chay an toàn).',
    stage: 'Cả thai kỳ — nhấn mạnh nhất T3 (não thai tăng ~3×)',
    doctorNeeded: [
      'Rối loạn chảy máu, sắp phẫu thuật, đang dùng thuốc chống đông (liều cao omega-3 có thể kéo dài thời gian chảy máu).',
      'Không ăn được cá béo (dị ứng) → hỏi bác sĩ về liều viên DHA phù hợp.',
    ],
    excessWarning: 'Không cần >1.000 mg DHA/ngày. TRÁNH dầu gan cá (thừa vitamin A). Liều 2–6 g EPA+DHA có thể tăng nhẹ LDL-cholesterol.',
    citations: [
      { org: 'ACOG', title: 'Update on Seafood Consumption During Pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/01/update-on-seafood-consumption-during-pregnancy' },
      { org: 'EFSA', title: 'Scientific Opinion on UL of EPA/DHA/DPA (2012)', url: 'https://www.efsa.europa.eu/en/efsajournal/pub/2815' },
    ],
  },
  {
    id: 'iodine_supplement',
    name: 'I-ốt',
    dose: '150–250 mcg/ngày (viên tiền sản thường chứa 150 mcg)',
    timing: 'Uống hằng ngày; kết hợp muối i-ốt khi nấu ăn là đủ. KHÔNG tự uống thêm viên i-ốt riêng nếu viên tiền sản đã có.',
    stage: 'Trước thụ thai → suốt thai kỳ → cho con bú',
    doctorNeeded: [
      'Bệnh tuyến giáp (cường/suy giáp, bướu cổ), từng xạ trị vùng cổ.',
      'Sống ở vùng từng thiếu i-ốt nặng hoặc có tiền sử bệnh giáp gia đình.',
    ],
    excessWarning: 'UL 1.100 mcg/ngày. ATA: tránh mọi sản phẩm i-ốt/rong biển >500 mcg/ngày. Thừa i-ốt gây rối loạn tuyến giáp (cả suy lẫn cường).',
    citations: [
      { org: 'ATA', title: 'Iodine Supplementation for Pregnancy and Lactation', url: 'https://www.thyroid.org/iodine-supplementation-pregnancy-lactation/' },
      { org: 'NIH/ODS', title: 'Iodine — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/' },
    ],
  },
  {
    id: 'vitamin_b12_supplement',
    name: 'Vitamin B12',
    dose: '2,6–25 mcg/ngày (viên tiền sản thường 2,6–12 mcg)',
    timing: 'Uống hằng ngày. Mẹ ăn chay/chay trường BẮT BUỘC bổ sung — thực vật không có B12 tự nhiên.',
    stage: 'Cả thai kỳ — đặc biệt quan trọng cho mẹ ăn chay',
    doctorNeeded: [
      'Mẹ ăn chay trường / thuần chay — cần bổ sung đều và kiểm tra máu theo lịch.',
      'Thiếu máu hồng cầu to, rối loạn hấp thu (bệnh Crohn, đã cắt đoạn ruột).',
    ],
    excessWarning: 'Không có UL — dư thừa B12 thải qua nước tiểu, an toàn cao.',
    citations: [
      { org: 'NIH/ODS', title: 'Vitamin B12 — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/' },
      { org: 'NIH/ODS', title: 'Pregnancy — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Pregnancy-HealthProfessional/' },
    ],
  },
  {
    id: 'choline_supplement',
    name: 'Choline',
    dose: '450 mg/ngày (AI); 550–900 mg/ngày trong nghiên cứu đều an toàn',
    timing: 'Ưu tiên từ thức ăn (2 quả trứng ≈ 294 mg + thịt/sữa/đậu). Không bắt buộc viên nếu ăn đủ trứng; nếu dùng viên, chọn loại không cộng dồn vượt UL.',
    stage: 'Cả thai kỳ — quan trọng nhất T3 (não thai tăng trưởng vượt bậc)',
    doctorNeeded: [
      'Ăn chay/chay trường khó đạt choline → hỏi bác sĩ về viên bổ sung.',
      'Bệnh gan, đang dùng thuốc ảnh hưởng gan (tương tác liều cao).',
    ],
    excessWarning: 'UL 3.500 mg/ngày (≤18T: 3.000). Quá liều: hạ huyết áp, mùi cơ thể tanh cá, đổ mồ hôi, buồn nôn, tổn thương gan.',
    citations: [
      { org: 'NIH/ODS', title: 'Choline — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Choline-HealthProfessional/' },
      { org: 'Harvard T.H. Chan', title: 'Choline — The Nutrition Source', url: 'https://nutritionsource.hsph.harvard.edu/choline/' },
    ],
  },
  {
    id: 'vitamin_c_supplement',
    name: 'Vitamin C',
    dose: '85 mg/ngày (thường không cần viên riêng — 1 quả ổi/cam + rau là đủ)',
    timing: 'Ăn kèm bữa có sắt thực vật để tăng hấp thu sắt.',
    stage: 'Cả thai kỳ',
    doctorNeeded: [
      'Chỉ khi bác sĩ yêu cầu — thiếu máu, hấp thu kém.',
      'Tiền sử sỏi thận oxalat (liều cao vitamin C).',
    ],
    excessWarning: 'UL 2.000 mg/ngày (≤18T: 1.800). Thừa liều cao → tiêu chảy, đau bụng, tăng nguy cơ sỏi thận.',
    citations: [
      { org: 'NIH/ODS', title: 'Vitamin C — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/' },
      { org: 'NIH/IOM', title: 'Vitamin C UL table', url: 'https://www.ncbi.nlm.nih.gov/books/NBK225480/table/ttt00050/' },
    ],
  },
  {
    id: 'zinc_supplement',
    name: 'Kẽm',
    dose: '11 mg/ngày (viên tiền sản thường có ~10–15 mg)',
    timing: 'Uống hằng ngày; tránh uống cùng lúc với canxi liều cao (giảm hấp thu cả ba).',
    stage: 'Cả thai kỳ',
    doctorNeeded: [
      'Tiền sử thiếu kẽm, chán ăn kéo dài, ăn chay.',
      'Đang dùng kháng sinh nhóm quinolone/tetracycline (giảm hấp thu).',
    ],
    excessWarning: 'UL 40 mg/ngày. Thừa mạn → thiếu đồng (ảnh hưởng máu/thần kinh), buồn nôn, giảm miễn dịch. Không cộng dồn nhiều viên chứa kẽm.',
    citations: [
      { org: 'NIH/ODS', title: 'Zinc — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/' },
      { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
    ],
  },
  {
    id: 'vitamin_a_warning',
    name: 'Vitamin A (retinol) — ⚠️ KHÔNG bổ sung riêng',
    dose: 'KHÔNG uống viên vitamin A/retinol/dầu gan cá riêng; chỉ beta-caroten từ rau củ quả',
    timing: 'Chế độ ăn bình thường đã đủ (770 mcg RAE/ngày). Viên tiền sản thường chứa ≤770 mcg retinol — an toàn.',
    stage: 'Cả thai kỳ — nhạy cảm nhất T1',
    doctorNeeded: [
      'Thiếu vitamin A rõ (quáng gà, khô mắt) → bác sĩ đánh giá, KHÔNG tự bổ sung.',
      'Đang dùng thuốc chứa retinoid (isotretinoin...).',
    ],
    excessWarning: '⚠️ THỪA retinol (nhất là T1) gây DỊ TẬT BẨM SINH. UL 3.000 mcg RAE/ngày (≤18T: 2.800). TRÁNH gan/pate gan và viên retinol liều cao. Beta-caroten thực vật không UL.',
    citations: [
      { org: 'NIH/ODS', title: 'Vitamin A and Carotenoids — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/' },
      { org: 'NHS', title: 'Foods to avoid in pregnancy (liver/vitamin A)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
    ],
  },
]

/** Tra cứu nhanh theo id — trả về undefined nếu không có. */
export function getSupplementRecommendation(id: string): SupplementRecommendation | undefined {
  return SUPPLEMENT_RECOMMENDATIONS.find((s) => s.id === id)
}
