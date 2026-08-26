// ===========================================================================
// supplement-plan.ts — KẾ HOẠCH BỔ SUNG THEO TAM CÁ NGUYỆT (Phase 6B).
// Chuyển các khuyến nghị bổ sung (supplement-data.ts) + knowledge-base +
// hướng dẫn VN (RDA 2016 / QĐ 776) thành kế hoạch theo giai đoạn:
// Trước thai → T1 (tuần 1–13) → T2 (14–26) → T3 (27–40).
// Mỗi mục: chất, liều, thời điểm uống, tương tác, giai đoạn bắt đầu/dừng,
// cờ "hỏi bác sĩ", nguồn. MỌI số liệu lấy từ nguồn đã ghi — không bịa.
//
// Quy ước:
//   - doseMax: liều tối đa/ngày theo đơn vị của nutrientRefId (để .check.ts
//     so với supplementRange/UL). null = mục cảnh báo/không có số.
//   - essential = true → "KHÔNG NÊN THIẾU"; false → "theo nhu cầu / cảnh báo".
// Thuần TS, import duy nhất kiểu Citation từ supplement-data. KHÔNG sửa supplement-data.
// ===========================================================================

import type { Citation } from './supplement-data'

export type SupplementStageId = 'preconception' | 'T1' | 'T2' | 'T3'

export interface SupplementPlanItem {
  /** id duy nhất trong plan (để check trùng lặp). */
  id: string
  /** Tên chất (tiếng Việt). */
  name: string
  /** Liều hằng ngày. */
  dose: string
  /** Thời điểm uống / lưu ý dùng. */
  timing: string
  /** Tương tác cần tránh. */
  interactions: string[]
  /** Giai đoạn bắt đầu / dừng. */
  startStop: string
  /** Khi nào CẦN hỏi bác sĩ trước. */
  askDoctor: string[]
  /** true = KHÔNG NÊN THIẾU ở giai đoạn này; false = theo nhu cầu/cảnh báo. */
  essential: boolean
  /** id trong nutrient-reference-data (để check UL / tra chi tiết). */
  nutrientRefId?: string
  /** id trong supplement-data (để tra chi tiết/nguồn). */
  supplementId?: string
  /** Liều tối đa/ngày, đơn vị của nutrientRefId — null khi không có số. */
  doseMax: number | null
  /** Ghi chú riêng cho VN (RDA 2016 / QĐ 776 / chương trình phổ cập). */
  vietnamNote?: string
  sources: Citation[]
}

export interface SupplementStagePlan {
  stageId: SupplementStageId
  /** Nhãn hiển thị. */
  label: string
  /** Khoảng tuần. */
  weeks: string
  /** Ghi chú ngắn của giai đoạn (chế độ ăn / tránh gì). */
  note?: string
  items: SupplementPlanItem[]
}

/** Nguồn VN dùng chung cho các số liệu Bộ Y tế / Viện Dinh dưỡng. */
const VN_RDA_2016: Citation = {
  org: 'Bộ Y tế — Viện Dinh dưỡng',
  title: 'Nhu cầu dinh dưỡng khuyến nghị cho người Việt Nam (RDA 2016)',
  url: 'https://file.hstatic.net/200000713511/file/nhu-cau-dinh-duong-khuyen-nghi-cho-nguoi-viet-nam-bo-y-te-2016_1351b03467f74a40a14580ae822b6e1c.pdf',
}

const VN_QD_776: Citation = {
  org: 'Bộ Y tế',
  title: 'Quyết định 776/QĐ-BYT — Hướng dẫn quốc gia dinh dưỡng cho phụ nữ có thai',
  url: 'https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Quyet-dinh-776-QD-BYT-2017-Tai-lieu-huong-dan-quoc-gia-ve-dinh-duong-cho-Phu-nu-co-thai-465012.aspx',
}

const VN_IRON_FOLIC: Citation = {
  org: 'Trạm Y tế — Bộ Y tế',
  title: 'Ngày vi chất: phụ nữ có thai cần uống viên sắt/acid folic',
  url: 'https://tytphuongtamphu.medinet.gov.vn/cham-soc-suc-khoe-sinh-san/ngay-vi-chat-dinh-duong-1-26-phu-nu-co-thai-can-uong-vien-sat-acid-folic-hoac-v-c7528-241683.aspx',
}

export const SUPPLEMENT_PLAN: SupplementStagePlan[] = [
  // =========================================================================
  // TRƯỚC THAI (-4 → 0 tuần)
  // =========================================================================
  {
    stageId: 'preconception',
    label: 'Trước thai',
    weeks: 'Trước thụ thai (−4 → 0 tuần)',
    note: 'Bỏ rượu/thuốc lá; uống vitamin tổng hợp tiền sản từ ≥1 tháng trước; khám tiền sản để chỉnh liều.',
    items: [
      {
        id: 'pre_folic',
        name: 'Axit folic',
        dose: '400–600 mcg/ngày (bổ sung 400 mcg; RDA thai kỳ 600 mcg DFE)',
        timing: 'Uống hằng ngày, bắt đầu ≥1 tháng trước thụ thai.',
        interactions: ['Không tự vượt 1.000 mcg/ngày từ dạng bổ sung (che lấp thiếu B12 → nguy cơ thần kinh).'],
        startStop: '≥1 tháng trước thụ thai → hết tuần 12 (quan trọng nhất).',
        askDoctor: [
          'Tiền sử con dị tật ống thần kinh, BMI ≥30, tiểu đường, động kinh → cần 4.000 mcg/ngày (CDC) hoặc 5 mg kê đơn (NHS).',
          'Đang dùng thuốc chống động kinh, methotrexate (tương tác folate).',
        ],
        essential: true,
        nutrientRefId: 'folate',
        supplementId: 'folic_acid',
        doseMax: 600,
        sources: [
          { org: 'NIH/ODS', title: 'Folate — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/' },
          { org: 'CDC', title: 'Folic Acid', url: 'https://www.cdc.gov/ncbddd/folicacid/index.html' },
        ],
      },
      {
        id: 'pre_iodine',
        name: 'I-ốt',
        dose: '220 mcg/ngày (viên tiền sản 150 mcg + muối i-ốt khi nấu ăn)',
        timing: 'Uống hằng ngày; dùng muối i-ốt cho cả gia đình (NĐ 09/2016/NĐ-CP).',
        interactions: [
          'KHÔNG tự uống thêm viên i-ốt riêng nếu viên tiền sản đã có.',
          'Tránh rong biển hàng ngày (hàm lượng i-ốt biến thiên rất lớn).',
        ],
        startStop: 'Trước thụ thai → suốt thai kỳ → cho con bú.',
        askDoctor: ['Bệnh tuyến giáp (cường/suy giáp, bướu cổ), từng xạ trị vùng cổ.'],
        essential: true,
        nutrientRefId: 'iodine',
        supplementId: 'iodine_supplement',
        doseMax: 250,
        sources: [
          { org: 'ATA', title: 'Iodine Supplementation for Pregnancy and Lactation', url: 'https://www.thyroid.org/iodine-supplementation-pregnancy-lactation/' },
          { org: 'NIH/ODS', title: 'Iodine — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/' },
        ],
      },
      {
        id: 'pre_vitamin_d',
        name: 'Vitamin D',
        dose: '400–600 IU/ngày (NHS 400; NIH/ACOG 600; VN RDA 800 IU)',
        timing: 'Uống cùng bữa ăn có chất béo; thường có sẵn trong viên tiền sản.',
        interactions: [],
        startStop: 'Cả thai kỳ — bắt đầu khi dự định mang thai.',
        askDoctor: ['Nghi ngờ thiếu vitamin D → bác sĩ có thể cho 1.000–4.000 IU/ngày ngắn hạn.'],
        essential: true,
        nutrientRefId: 'vitamin_d',
        supplementId: 'vitamin_d_supplement',
        doseMax: 600,
        vietnamNote: 'VN RDA 2016 khuyến nghị 800 IU/ngày (cao hơn chuẩn quốc tế 600 IU).',
        sources: [
          { org: 'NIH/ODS', title: 'Vitamin D — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/' },
          VN_RDA_2016,
        ],
      },
    ],
  },

  // =========================================================================
  // T1 — TUẦN 1–13
  // =========================================================================
  {
    stageId: 'T1',
    label: 'Tam cá nguyệt 1',
    weeks: 'Tuần 1–13',
    note: 'Tránh gan/pate gan và viên retinol (vitamin A); caffeine ≤200 mg/ngày; ốm nghén → nhiều bữa nhỏ, tinh bột phức hợp.',
    items: [
      {
        id: 't1_folic',
        name: 'Axit folic',
        dose: '400–600 mcg/ngày (bổ sung 400 mcg; RDA thai kỳ 600 mcg DFE)',
        timing: 'Uống hằng ngày — quan trọng nhất tuần 1–12.',
        interactions: ['Không tự vượt 1.000 mcg/ngày từ dạng bổ sung (che lấp thiếu B12).'],
        startStop: 'Tiếp tục đến hết tuần 12 (ống thần kinh đóng kín ~tuần 6).',
        askDoctor: ['Nguy cơ cao (tiền sử dị tật ống thần kinh, BMI ≥30, tiểu đường, động kinh) → 4.000 mcg/ngày theo chỉ định.'],
        essential: true,
        nutrientRefId: 'folate',
        supplementId: 'folic_acid',
        doseMax: 600,
        sources: [
          { org: 'NIH/ODS', title: 'Folate — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/' },
          { org: 'NHS', title: 'Vitamins, supplements and nutrition in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/vitamins-supplements-and-nutrition/' },
        ],
      },
      {
        id: 't1_iron',
        name: 'Sắt',
        dose: '27–45 mg/ngày (an toàn); WHO/VN phổ cập 30–60 mg/ngày',
        timing: 'Uống cách xa sữa/trà/cà phê ≥2 giờ; kèm vitamin C (chanh, ổi, cam) tăng hấp thu; chia nhỏ nếu đau bụng/táo bón.',
        interactions: [
          'Sắt + canxi uống cùng giờ giảm hấp thu cả hai → chia giờ (cách ≥2 giờ).',
          'Trà/cà phê (tannin) và sữa ức chế hấp thu sắt → cách ≥2 giờ.',
        ],
        startStop: 'Cả thai kỳ — VN bổ sung phổ cập từ lần khám thai đầu.',
        askDoctor: [
          'Thiếu máu thiếu sắt → 60–120 mg/ngày chỉ khi bác sĩ chỉ định (vượt UL 45 mg).',
          'Táo bón nặng kéo dài → đổi dạng sắt fumarate/giảm liều theo tư vấn.',
        ],
        essential: true,
        nutrientRefId: 'iron',
        supplementId: 'iron_supplement',
        doseMax: 45,
        vietnamNote: 'VN: chương trình bổ sung viên sắt 60 mg + acid folic 400 mcg cho mọi thai phụ (RDA 2016/QĐ 776).',
        sources: [
          { org: 'WHO eLENA', title: 'Daily iron supplementation in pregnancy', url: 'https://www.who.int/elena/titles/daily_iron_pregnancy/en/' },
          VN_IRON_FOLIC,
        ],
      },
      {
        id: 't1_iodine',
        name: 'I-ốt',
        dose: '150–250 mcg/ngày (viên tiền sản 150 mcg + muối i-ốt)',
        timing: 'Uống hằng ngày; dùng muối i-ốt khi nấu ăn.',
        interactions: ['KHÔNG tự uống thêm viên i-ốt riêng nếu viên tiền sản đã có.'],
        startStop: 'Trước thụ thai → suốt thai kỳ → cho con bú.',
        askDoctor: ['Bệnh tuyến giáp, tiền sử bướu cổ, từng xạ trị vùng cổ.'],
        essential: true,
        nutrientRefId: 'iodine',
        supplementId: 'iodine_supplement',
        doseMax: 250,
        sources: [
          { org: 'ATA', title: 'Iodine Supplementation for Pregnancy and Lactation', url: 'https://www.thyroid.org/iodine-supplementation-pregnancy-lactation/' },
          { org: 'NIH/ODS', title: 'Iodine — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/' },
        ],
      },
      {
        id: 't1_vitamin_d',
        name: 'Vitamin D',
        dose: '400–600 IU/ngày (NHS 400; NIH/ACOG 600; VN RDA 800 IU)',
        timing: 'Uống cùng bữa ăn có chất béo; thường có sẵn trong viên tiền sản.',
        interactions: [],
        startStop: 'Cả thai kỳ.',
        askDoctor: ['Nghi ngờ thiếu vitamin D → bác sĩ có thể cho 1.000–4.000 IU/ngày ngắn hạn.'],
        essential: true,
        nutrientRefId: 'vitamin_d',
        supplementId: 'vitamin_d_supplement',
        doseMax: 600,
        vietnamNote: 'VN RDA 2016 khuyến nghị 800 IU/ngày.',
        sources: [
          { org: 'NIH/ODS', title: 'Vitamin D — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/' },
          VN_RDA_2016,
        ],
      },
      {
        id: 't1_dha',
        name: 'DHA / Omega-3',
        dose: '≥200 mg DHA/ngày (200–300 mg nếu ít ăn cá)',
        timing: 'Uống hằng ngày cùng bữa ăn; chọn DHA tinh luyện (dầu cá) hoặc DHA tảo (chay an toàn).',
        interactions: ['Tránh dầu gan cá (thừa vitamin A).'],
        startStop: 'Cả thai kỳ — nhấn mạnh nhất T3 (não thai tăng ~3×).',
        askDoctor: ['Rối loạn chảy máu, sắp phẫu thuật, đang dùng thuốc chống đông → hỏi bác sĩ trước liều cao.'],
        essential: true,
        nutrientRefId: 'dha',
        supplementId: 'dha_supplement',
        doseMax: 300,
        sources: [
          { org: 'ACOG', title: 'Update on Seafood Consumption During Pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/01/update-on-seafood-consumption-during-pregnancy' },
          { org: 'FDA/EPA', title: 'Advice About Eating Fish', url: 'https://www.fda.gov/food/consumers/advice-about-eating-fish' },
        ],
      },
      {
        id: 't1_zinc',
        name: 'Kẽm',
        dose: '11 mg/ngày (viên tiền sản thường ~10–15 mg)',
        timing: 'Uống hằng ngày.',
        interactions: ['Tránh uống cùng lúc với canxi liều cao (giảm hấp thu cả ba).'],
        startStop: 'Cả thai kỳ — T1 cần cho phân chia tế bào.',
        askDoctor: ['Tiền sử thiếu kẽm, chán ăn kéo dài, ăn chay.'],
        essential: false,
        nutrientRefId: 'zinc',
        supplementId: 'zinc_supplement',
        doseMax: 15,
        sources: [
          { org: 'NIH/ODS', title: 'Zinc — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/' },
          { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
        ],
      },
      {
        id: 't1_b12',
        name: 'Vitamin B12',
        dose: '2,6–12 mcg/ngày (viên tiền sản thường 2,6–12 mcg)',
        timing: 'Uống hằng ngày — mẹ ăn chay/chay trường BẮT BUỘC bổ sung.',
        interactions: [],
        startStop: 'Cả thai kỳ — đặc biệt quan trọng cho mẹ ăn chay.',
        askDoctor: ['Mẹ ăn chay trường / thuần chay → bổ sung đều và kiểm tra máu theo lịch.'],
        essential: false,
        nutrientRefId: 'vitamin_b12',
        supplementId: 'vitamin_b12_supplement',
        doseMax: 12,
        sources: [
          { org: 'NIH/ODS', title: 'Vitamin B12 — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/' },
        ],
      },
      {
        id: 't1_vitamin_a_warn',
        name: 'Vitamin A (retinol) — ⚠️ KHÔNG bổ sung riêng',
        dose: 'KHÔNG uống viên retinol/dầu gan cá; chỉ beta-caroten từ rau củ quả',
        timing: 'Chế độ ăn bình thường đã đủ 770 mcg RAE/ngày; viên tiền sản ≤770 mcg retinol là an toàn.',
        interactions: [
          'Tránh gan/pate gan — 100 g gan gà ~3.000–4.000 mcg RAE (ngấp UL cả ngày).',
          'Thừa retinol (nhất là T1) gây DỊ TẬT BẨM SINH.',
        ],
        startStop: 'Cả thai kỳ — nhạy cảm nhất T1.',
        askDoctor: ['Quáng gà/khô mắt (nghi thiếu) → bác sĩ đánh giá, KHÔNG tự bổ sung.', 'Đang dùng thuốc chứa retinoid (isotretinoin...) → báo bác sĩ.'],
        essential: false,
        nutrientRefId: 'vitamin_a',
        supplementId: 'vitamin_a_warning',
        doseMax: null,
        sources: [
          { org: 'NIH/ODS', title: 'Vitamin A and Carotenoids — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/' },
          { org: 'NHS', title: 'Foods to avoid in pregnancy (liver/vitamin A)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
        ],
      },
    ],
  },

  // =========================================================================
  // T2 — TUẦN 14–26
  // =========================================================================
  {
    stageId: 'T2',
    label: 'Tam cá nguyệt 2',
    weeks: 'Tuần 14–26',
    note: 'Bắt đầu ăn thêm ~25 g đạm/ngày; canxi 1.200 mg (VN); chuột rút → đủ canxi/magie và nước.',
    items: [
      {
        id: 't2_iron',
        name: 'Sắt',
        dose: '27–45 mg/ngày (an toàn); WHO/VN phổ cập 30–60 mg/ngày',
        timing: 'Uống cách xa sữa/trà/cà phê ≥2 giờ; kèm vitamin C tăng hấp thu.',
        interactions: [
          'Sắt + canxi uống cùng giờ giảm hấp thu cả hai → chia giờ (cách ≥2 giờ).',
          'Trà/cà phê (tannin) ức chế hấp thu sắt → cách ≥2 giờ.',
        ],
        startStop: 'Cả thai kỳ — nhu cầu tăng mạnh khi máu mẹ mở rộng.',
        askDoctor: ['Thiếu máu thiếu sắt → 60–120 mg/ngày chỉ khi bác sĩ chỉ định (vượt UL 45 mg).'],
        essential: true,
        nutrientRefId: 'iron',
        supplementId: 'iron_supplement',
        doseMax: 45,
        vietnamNote: 'VN: bổ sung phổ cập 30–60 mg/ngày (RDA 2016/QĐ 776).',
        sources: [
          { org: 'WHO eLENA', title: 'Daily iron supplementation in pregnancy', url: 'https://www.who.int/elena/titles/daily_iron_pregnancy/en/' },
          VN_IRON_FOLIC,
        ],
      },
      {
        id: 't2_calcium',
        name: 'Canxi',
        dose: '1.000 mg/ngày (ACOG/NIH; VN RDA 1.200; WHO vùng ít canxi 1.500–2.000)',
        timing: 'Chia ≤500 mg/lần (hấp thu tốt, ít táo bón). Canxi carbonat uống cùng bữa ăn; canxi citrat uống lúc nào cũng được.',
        interactions: [
          'KHÔNG uống chung giờ với sắt/kẽm liều cao (ức chế hấp thu cả ba).',
          'Cách xa giờ uống sắt ≥2 giờ.',
        ],
        startStop: 'Cả thai kỳ — quan trọng nhất T3 (bé cốt hóa xương).',
        askDoctor: ['Tiền sử sỏi thận, tăng canxi máu, cường cận giáp.', 'Không dung nạp lactose/ăn chay thiếu sữa → viên canxi 500 mg theo tư vấn.'],
        essential: true,
        nutrientRefId: 'calcium',
        supplementId: 'calcium_supplement',
        doseMax: 1000,
        vietnamNote: 'VN RDA 2016 khuyến nghị 1.200 mg/ngày.',
        sources: [
          { org: 'NIH/ODS', title: 'Calcium — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/' },
          VN_RDA_2016,
        ],
      },
      {
        id: 't2_vitamin_d',
        name: 'Vitamin D',
        dose: '400–600 IU/ngày (NHS 400; NIH/ACOG 600; VN RDA 800 IU)',
        timing: 'Uống cùng bữa ăn có chất béo; thường có sẵn trong viên tiền sản.',
        interactions: [],
        startStop: 'Cả thai kỳ — T3 canxi hấp thu mạnh nhất nên vitamin D càng quan trọng.',
        askDoctor: ['Nghi ngờ thiếu vitamin D → bác sĩ có thể cho 1.000–4.000 IU/ngày ngắn hạn.'],
        essential: true,
        nutrientRefId: 'vitamin_d',
        supplementId: 'vitamin_d_supplement',
        doseMax: 600,
        vietnamNote: 'VN RDA 2016 khuyến nghị 800 IU/ngày.',
        sources: [
          { org: 'NIH/ODS', title: 'Vitamin D — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/' },
          VN_RDA_2016,
        ],
      },
      {
        id: 't2_dha',
        name: 'DHA / Omega-3',
        dose: '≥200 mg DHA/ngày (200–300 mg nếu ít ăn cá)',
        timing: 'Uống hằng ngày cùng bữa ăn; ăn 2–3 phần cá ít thủy ngân/tuần.',
        interactions: ['Tránh dầu gan cá (thừa vitamin A); tránh cá thủy ngân cao (cá mập, cá kiếm, cá ngừ mắt to).'],
        startStop: 'Cả thai kỳ — T2 não thai bắt đầu phát triển mạnh.',
        askDoctor: ['Rối loạn chảy máu, đang dùng thuốc chống đông → hỏi bác sĩ trước liều cao.'],
        essential: true,
        nutrientRefId: 'dha',
        supplementId: 'dha_supplement',
        doseMax: 300,
        sources: [
          { org: 'FDA/EPA', title: 'Advice About Eating Fish', url: 'https://www.fda.gov/food/consumers/advice-about-eating-fish' },
          { org: 'ACOG', title: 'Update on Seafood Consumption During Pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/01/update-on-seafood-consumption-during-pregnancy' },
        ],
      },
      {
        id: 't2_choline',
        name: 'Choline',
        dose: '450 mg/ngày (AI); 2 quả trứng ≈ 294 mg',
        timing: 'Ưu tiên từ thức ăn (trứng, thịt, sữa, đậu); viên chỉ khi ăn không đủ.',
        interactions: ['Không cộng dồn nhiều viên chứa choline — UL 3.500 mg/ngày.'],
        startStop: 'Cả thai kỳ — quan trọng nhất T3 (não thai tăng trưởng vượt bậc).',
        askDoctor: ['Ăn chay/chay trường khó đạt choline → hỏi bác sĩ về viên bổ sung.'],
        essential: true,
        nutrientRefId: 'choline',
        supplementId: 'choline_supplement',
        doseMax: 900,
        sources: [
          { org: 'NIH/ODS', title: 'Choline — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Choline-HealthProfessional/' },
          { org: 'Harvard T.H. Chan', title: 'Choline — The Nutrition Source', url: 'https://nutritionsource.hsph.harvard.edu/choline/' },
        ],
      },
      {
        id: 't2_iodine',
        name: 'I-ốt',
        dose: '150–250 mcg/ngày (viên tiền sản 150 mcg + muối i-ốt)',
        timing: 'Uống hằng ngày; dùng muối i-ốt khi nấu ăn.',
        interactions: ['KHÔNG tự uống thêm viên i-ốt riêng nếu viên tiền sản đã có.'],
        startStop: 'Trước thụ thai → suốt thai kỳ → cho con bú.',
        askDoctor: ['Bệnh tuyến giáp, tiền sử bướu cổ, từng xạ trị vùng cổ.'],
        essential: true,
        nutrientRefId: 'iodine',
        supplementId: 'iodine_supplement',
        doseMax: 250,
        sources: [
          { org: 'ATA', title: 'Iodine Supplementation for Pregnancy and Lactation', url: 'https://www.thyroid.org/iodine-supplementation-pregnancy-lactation/' },
          { org: 'NIH/ODS', title: 'Iodine — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/' },
        ],
      },
      {
        id: 't2_zinc',
        name: 'Kẽm',
        dose: '11 mg/ngày (viên tiền sản thường ~10–15 mg)',
        timing: 'Uống hằng ngày.',
        interactions: ['Tránh uống cùng lúc với canxi liều cao (giảm hấp thu cả ba).'],
        startStop: 'Cả thai kỳ.',
        askDoctor: ['Tiền sử thiếu kẽm, chán ăn kéo dài, ăn chay.'],
        essential: false,
        nutrientRefId: 'zinc',
        supplementId: 'zinc_supplement',
        doseMax: 15,
        sources: [
          { org: 'NIH/ODS', title: 'Zinc — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/' },
          { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
        ],
      },
      {
        id: 't2_b12',
        name: 'Vitamin B12',
        dose: '2,6–12 mcg/ngày (viên tiền sản thường 2,6–12 mcg)',
        timing: 'Uống hằng ngày — mẹ ăn chay/chay trường BẮT BUỘC bổ sung.',
        interactions: [],
        startStop: 'Cả thai kỳ — thai tích trữ B12 ở gan chủ yếu T2–T3.',
        askDoctor: ['Mẹ ăn chay trường / thuần chay → bổ sung đều và kiểm tra máu theo lịch.'],
        essential: false,
        nutrientRefId: 'vitamin_b12',
        supplementId: 'vitamin_b12_supplement',
        doseMax: 12,
        sources: [
          { org: 'NIH/ODS', title: 'Vitamin B12 — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/' },
        ],
      },
    ],
  },

  // =========================================================================
  // T3 — TUẦN 27–40
  // =========================================================================
  {
    stageId: 'T3',
    label: 'Tam cá nguyệt 3',
    weeks: 'Tuần 27–40',
    note: 'Não thai tăng ~3× (DHA); sắt đạt đỉnh ~tuần 34 (dự trữ 6 tháng đầu đời cho bé); táo bón → chất xơ 28 g + nước ~2,3 L/ngày.',
    items: [
      {
        id: 't3_iron',
        name: 'Sắt',
        dose: '27–45 mg/ngày (an toàn); WHO/VN phổ cập 30–60 mg/ngày',
        timing: 'Uống cách xa sữa/trà/cà phê ≥2 giờ; kèm vitamin C tăng hấp thu.',
        interactions: [
          'Sắt + canxi uống cùng giờ giảm hấp thu cả hai → chia giờ (cách ≥2 giờ).',
          'Trà/cà phê (tannin) ức chế hấp thu sắt → cách ≥2 giờ.',
        ],
        startStop: 'Cả thai kỳ — T3 thai tích trữ sắt cho 6 tháng đầu đời (đỉnh ~tuần 30–36).',
        askDoctor: ['Thiếu máu thiếu sắt → 60–120 mg/ngày chỉ khi bác sĩ chỉ định (vượt UL 45 mg).'],
        essential: true,
        nutrientRefId: 'iron',
        supplementId: 'iron_supplement',
        doseMax: 45,
        vietnamNote: 'VN: bổ sung phổ cập 30–60 mg/ngày (RDA 2016/QĐ 776).',
        sources: [
          { org: 'WHO eLENA', title: 'Daily iron supplementation in pregnancy', url: 'https://www.who.int/elena/titles/daily_iron_pregnancy/en/' },
          VN_IRON_FOLIC,
        ],
      },
      {
        id: 't3_calcium',
        name: 'Canxi',
        dose: '1.000 mg/ngày (ACOG/NIH; VN RDA 1.200; WHO vùng ít canxi 1.500–2.000)',
        timing: 'Chia ≤500 mg/lần; canxi carbonat uống cùng bữa ăn, canxi citrat uống lúc nào cũng được.',
        interactions: [
          'KHÔNG uống chung giờ với sắt/kẽm liều cao (ức chế hấp thu cả ba).',
          'Cách xa giờ uống sắt ≥2 giờ.',
        ],
        startStop: 'Cả thai kỳ — T3 thai hấp thu canxi mạnh nhất khi cốt hóa xương.',
        askDoctor: ['Tiền sử sỏi thận, tăng canxi máu, cường cận giáp.', 'Không dung nạp lactose/ăn chay thiếu sữa → viên canxi 500 mg theo tư vấn.'],
        essential: true,
        nutrientRefId: 'calcium',
        supplementId: 'calcium_supplement',
        doseMax: 1000,
        vietnamNote: 'VN RDA 2016 khuyến nghị 1.200 mg/ngày.',
        sources: [
          { org: 'NIH/ODS', title: 'Calcium — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/' },
          VN_RDA_2016,
        ],
      },
      {
        id: 't3_dha',
        name: 'DHA / Omega-3',
        dose: '≥200 mg DHA/ngày (200–300 mg nếu ít ăn cá)',
        timing: 'Uống hằng ngày cùng bữa ăn; ăn 2–3 phần cá ít thủy ngân/tuần.',
        interactions: ['Tránh dầu gan cá (thừa vitamin A); tránh cá thủy ngân cao.'],
        startStop: 'Cả thai kỳ — NHẤN MẠNH T3: não thai tăng ~3×, DHA tích lũy nhanh nhất tuần 26–40.',
        askDoctor: ['Rối loạn chảy máu, đang dùng thuốc chống đông → hỏi bác sĩ trước liều cao.'],
        essential: true,
        nutrientRefId: 'dha',
        supplementId: 'dha_supplement',
        doseMax: 300,
        sources: [
          { org: 'ACOG', title: 'Update on Seafood Consumption During Pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/01/update-on-seafood-consumption-during-pregnancy' },
          { org: 'EFSA', title: 'Scientific Opinion on UL of EPA/DHA/DPA (2012)', url: 'https://www.efsa.europa.eu/en/efsajournal/pub/2815' },
        ],
      },
      {
        id: 't3_vitamin_d',
        name: 'Vitamin D',
        dose: '400–600 IU/ngày (NHS 400; NIH/ACOG 600; VN RDA 800 IU)',
        timing: 'Uống cùng bữa ăn có chất béo; thường có sẵn trong viên tiền sản.',
        interactions: [],
        startStop: 'Cả thai kỳ — T3 canxi hấp thu nhiều nhất → vitamin D càng quan trọng.',
        askDoctor: ['Nghi ngờ thiếu vitamin D → bác sĩ có thể cho 1.000–4.000 IU/ngày ngắn hạn.'],
        essential: true,
        nutrientRefId: 'vitamin_d',
        supplementId: 'vitamin_d_supplement',
        doseMax: 600,
        vietnamNote: 'VN RDA 2016 khuyến nghị 800 IU/ngày.',
        sources: [
          { org: 'NIH/ODS', title: 'Vitamin D — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/' },
          VN_RDA_2016,
        ],
      },
      {
        id: 't3_choline',
        name: 'Choline',
        dose: '450 mg/ngày (AI); 2 quả trứng ≈ 294 mg',
        timing: 'Ưu tiên từ thức ăn (trứng, thịt, sữa, đậu); viên chỉ khi ăn không đủ.',
        interactions: ['Không cộng dồn nhiều viên chứa choline — UL 3.500 mg/ngày.'],
        startStop: 'Cả thai kỳ — T3 não thai tăng trưởng vượt bậc → choline đặc biệt quan trọng.',
        askDoctor: ['Ăn chay/chay trường khó đạt choline → hỏi bác sĩ về viên bổ sung.'],
        essential: true,
        nutrientRefId: 'choline',
        supplementId: 'choline_supplement',
        doseMax: 900,
        sources: [
          { org: 'NIH/ODS', title: 'Choline — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Choline-HealthProfessional/' },
          { org: 'Harvard T.H. Chan', title: 'Choline — The Nutrition Source', url: 'https://nutritionsource.hsph.harvard.edu/choline/' },
        ],
      },
      {
        id: 't3_iodine',
        name: 'I-ốt',
        dose: '150–250 mcg/ngày (viên tiền sản 150 mcg + muối i-ốt)',
        timing: 'Uống hằng ngày; dùng muối i-ốt khi nấu ăn.',
        interactions: ['KHÔNG tự uống thêm viên i-ốt riêng nếu viên tiền sản đã có.'],
        startStop: 'Trước thụ thai → suốt thai kỳ → cho con bú.',
        askDoctor: ['Bệnh tuyến giáp, tiền sử bướu cổ, từng xạ trị vùng cổ.'],
        essential: true,
        nutrientRefId: 'iodine',
        supplementId: 'iodine_supplement',
        doseMax: 250,
        sources: [
          { org: 'ATA', title: 'Iodine Supplementation for Pregnancy and Lactation', url: 'https://www.thyroid.org/iodine-supplementation-pregnancy-lactation/' },
          { org: 'NIH/ODS', title: 'Iodine — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/' },
        ],
      },
      {
        id: 't3_b12',
        name: 'Vitamin B12',
        dose: '2,6–12 mcg/ngày (viên tiền sản thường 2,6–12 mcg)',
        timing: 'Uống hằng ngày — mẹ ăn chay/chay trường BẮT BUỘC bổ sung.',
        interactions: [],
        startStop: 'Cả thai kỳ.',
        askDoctor: ['Mẹ ăn chay trường / thuần chay → bổ sung đều và kiểm tra máu theo lịch.'],
        essential: false,
        nutrientRefId: 'vitamin_b12',
        supplementId: 'vitamin_b12_supplement',
        doseMax: 12,
        sources: [
          { org: 'NIH/ODS', title: 'Vitamin B12 — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/' },
        ],
      },
    ],
  },
]

/** Tra cứu kế hoạch theo giai đoạn — trả về undefined nếu không có. */
export function getStagePlan(stageId: SupplementStageId): SupplementStagePlan | undefined {
  return SUPPLEMENT_PLAN.find((s) => s.stageId === stageId)
}
