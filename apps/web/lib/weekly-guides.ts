// ===========================================================================
// weekly-guides.ts — Hướng dẫn TUẦN CỦA BÉ đầy đủ (Phase E1).
// Biến /tuan/[week] thành trang hướng dẫn tuần: Tuần của bé · Mẹ thay đổi gì ·
// Dinh dưỡng tuần · Checklist tuần · Lưu ý.
//
// Nguồn nội dung: orchestration/docs/development-nutrition-first-1000-days.md,
// nutrition-knowledge-base.md, lifestyle-exercise-sleep.md,
// lifestyle-mind-work-preconception.md — MỌI khẳng định có nguồn (tổ chức + URL).
// Dinh dưỡng tuần ghép từ weekly-focus-data.ts + nutrient-reference-data.ts
// (CHỈ import, không sửa). Thuần TS + dữ liệu tĩnh — chạy được bằng node.
// Số liệu kích thước thai là giá trị THAM KHẢO (bảng phổ biến), chỉ số thực tế
// theo siêu âm của bác sĩ. Nội dung giáo dục sức khỏe — KHÔNG thay thế tư vấn y khoa.
// ===========================================================================

import type { Citation } from './nutrition/weekly-focus-data'
import { getWeeklyFocus } from './nutrition/weekly-focus-data'
import { getNutrientReference } from './nutrition/nutrient-reference-data'
import { trimesterOf, type WeekTrimester } from './week'

export type { Citation }

// ---------------------------------------------------------------------------
// Nguồn dùng lặp lại (gọn & đảm bảo URL)
// ---------------------------------------------------------------------------

const SRC = {
  hhs: {
    org: "HHS — Office on Women's Health",
    title: 'Stages of pregnancy',
    url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what/stages-pregnancy',
  },
  nestle: {
    org: 'Nestlé Nutrition Institute / Karger',
    title: 'Nutritional Factors in Fetal and Infant Brain Development',
    url: 'https://www.nestlenutrition-institute.org/annales-77.2---young-brain-big-appetite/nutritional-factors-in-fetal-and-infant-brain-development',
  },
  cdcFolic: { org: 'CDC', title: 'Folic Acid', url: 'https://www.cdc.gov/ncbddd/folicacid/index.html' },
  whoAnc: {
    org: 'WHO',
    title: 'Antenatal care for a positive pregnancy experience (2016)',
    url: 'https://www.who.int/publications/i/item/9789241549912',
  },
  acogNutrition: {
    org: 'ACOG',
    title: 'Nutrition During Pregnancy',
    url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy',
  },
  acogExercise: {
    org: 'ACOG',
    title: 'Exercise During Pregnancy',
    url: 'https://www.acog.org/womens-health/faqs/exercise-during-pregnancy',
  },
  acogMental: {
    org: 'ACOG',
    title: 'Perinatal Mental Health: Patient Screening',
    url: 'https://www.acog.org/programs/perinatal-mental-health/patient-screening',
  },
  acog733: {
    org: 'ACOG',
    title: 'Employment Considerations During Pregnancy (CO 733)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29578986/',
  },
  acog690: {
    org: 'ACOG',
    title: 'Carrier Screening in the Age of Genomic Medicine (CO 690)',
    url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/03/carrier-screening-in-the-age-of-genomic-medicine',
  },
  acogImmunization: {
    org: 'ACOG',
    title: 'Maternal Immunization Schedule',
    url: 'https://www.acog.org/clinical-information/maternal-immunization-schedule',
  },
  whoActivity: {
    org: 'WHO',
    title: 'WHO guidelines on physical activity and sedentary behaviour (2020)',
    url: 'https://www.who.int/publications/i/item/9789240015128',
  },
  nhsExercise: {
    org: 'NHS',
    title: 'Exercise in pregnancy',
    url: 'https://www.nhs.uk/pregnancy/keeping-well/exercise/',
  },
  nhsInform: {
    org: 'NHS inform',
    title: 'Your mental health and wellbeing in pregnancy',
    url: 'https://www.nhsinform.scot/ready-steady-baby/pregnancy/relationships-and-wellbeing-in-pregnancy/your-mental-health-and-wellbeing-in-pregnancy/',
  },
  cleveland: {
    org: 'Cleveland Clinic',
    title: 'Pregnancy Insomnia',
    url: 'https://my.clevelandclinic.org/health/diseases/pregnancy-insomnia',
  },
  tommysSleep: {
    org: "Tommy's",
    title: 'Sleep position in pregnancy Q&A',
    url: 'https://www.tommys.org/pregnancy-information/im-pregnant/sleep-side/sleep-position-pregnancy-qa',
  },
  mayo: {
    org: 'Mayo Clinic',
    title: 'Leg cramps during pregnancy: Preventable?',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/expert-answers/leg-cramps-during-pregnancy/faq-20057766',
  },
  ats: {
    org: 'American Thoracic Society (ATS)',
    title: 'Sleep and Pregnancy (patient resource)',
    url: 'https://www.thoracic.org/patients/patient-resources/resources/sleep-and-pregnancy-pt2.pdf',
  },
  iomWeight: {
    org: 'IOM/NASEM',
    title: 'Weight Gain During Pregnancy (2009)',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK32801/table/ch7.t1/',
  },
} satisfies Record<string, Citation>

// ---------------------------------------------------------------------------
// Bảng kích thước thai theo tuần (1–42) — giá trị THAM KHẢO.
// Tuần 1–20: chiều dài đầu–mông (CRL); từ tuần ~21: chiều dài đầu–gót chân
// → có bước nhảy số (không phải lỗi). Khớp bảng tuần hiện có của app.
// ---------------------------------------------------------------------------

export interface FetalSizeRow {
  week: number
  /** Chiều dài (cm) — tham khảo. */
  lengthCm: number
  /** Cân nặng (g) — tham khảo. */
  weightG: number
  /** So sánh kích thước thú vị, VD "quả bơ". */
  comparison: string
}

export const FETAL_SIZES: FetalSizeRow[] = [
  { week: 1, lengthCm: 0.1, weightG: 0, comparison: 'hạt vừng (mè)' },
  { week: 2, lengthCm: 0.3, weightG: 0, comparison: 'hạt táo nhỏ' },
  { week: 3, lengthCm: 0.6, weightG: 0, comparison: 'hạt đậu xanh' },
  { week: 4, lengthCm: 0.8, weightG: 0.2, comparison: 'hạt mè' },
  { week: 5, lengthCm: 1.0, weightG: 0.5, comparison: 'hạt đậu đỏ' },
  { week: 6, lengthCm: 1.2, weightG: 1, comparison: 'hạt đậu lăng' },
  { week: 7, lengthCm: 1.4, weightG: 2, comparison: 'quả việt quất' },
  { week: 8, lengthCm: 1.6, weightG: 1, comparison: 'quả anh đào' },
  { week: 9, lengthCm: 2.3, weightG: 2, comparison: 'quả nho' },
  { week: 10, lengthCm: 3.1, weightG: 4, comparison: 'quả chanh nhỏ' },
  { week: 11, lengthCm: 4.1, weightG: 7, comparison: 'quả sung' },
  { week: 12, lengthCm: 5.4, weightG: 14, comparison: 'quả chanh' },
  { week: 13, lengthCm: 7.4, weightG: 23, comparison: 'quả đậu Hà Lan' },
  { week: 14, lengthCm: 8.7, weightG: 43, comparison: 'quả chanh vàng' },
  { week: 15, lengthCm: 10.1, weightG: 70, comparison: 'quả táo' },
  { week: 16, lengthCm: 11.6, weightG: 100, comparison: 'quả bơ' },
  { week: 17, lengthCm: 13, weightG: 140, comparison: 'củ cải trắng' },
  { week: 18, lengthCm: 14.2, weightG: 190, comparison: 'quả ớt chuông' },
  { week: 19, lengthCm: 15.3, weightG: 240, comparison: 'quả xoài' },
  { week: 20, lengthCm: 16.4, weightG: 300, comparison: 'quả chuối' },
  { week: 21, lengthCm: 26.7, weightG: 360, comparison: 'quả cà rốt' },
  { week: 22, lengthCm: 27.8, weightG: 430, comparison: 'quả đu đủ' },
  { week: 23, lengthCm: 28.9, weightG: 500, comparison: 'quả bưởi' },
  { week: 24, lengthCm: 30, weightG: 600, comparison: 'quả ngô (bắp)' },
  { week: 25, lengthCm: 34.6, weightG: 660, comparison: 'củ su hào' },
  { week: 26, lengthCm: 35.6, weightG: 760, comparison: 'quả bí xanh' },
  { week: 27, lengthCm: 36.6, weightG: 875, comparison: 'quả dưa lưới' },
  { week: 28, lengthCm: 37.6, weightG: 1005, comparison: 'quả cà tím' },
  { week: 29, lengthCm: 38.6, weightG: 1150, comparison: 'quả bí đỏ nhỏ' },
  { week: 30, lengthCm: 39.9, weightG: 1320, comparison: 'bắp cải' },
  { week: 31, lengthCm: 41.1, weightG: 1500, comparison: 'quả dừa' },
  { week: 32, lengthCm: 42.4, weightG: 1700, comparison: 'quả bí đao' },
  { week: 33, lengthCm: 43.7, weightG: 1920, comparison: 'quả dứa' },
  { week: 34, lengthCm: 45, weightG: 2150, comparison: 'củ khoai môn' },
  { week: 35, lengthCm: 46.2, weightG: 2380, comparison: 'quả dưa hấu nhỏ' },
  { week: 36, lengthCm: 47.4, weightG: 2620, comparison: 'quả bắp cải tím' },
  { week: 37, lengthCm: 48.6, weightG: 2860, comparison: 'bó cải xoăn' },
  { week: 38, lengthCm: 49.8, weightG: 3080, comparison: 'quả bí ngô' },
  { week: 39, lengthCm: 50.7, weightG: 3290, comparison: 'quả dưa hấu' },
  { week: 40, lengthCm: 51.2, weightG: 3460, comparison: 'quả bí đỏ' },
  { week: 41, lengthCm: 51.7, weightG: 3600, comparison: 'quả dưa hấu to' },
  { week: 42, lengthCm: 51.7, weightG: 3600, comparison: 'quả dưa hấu to' },
]

// ---------------------------------------------------------------------------
// Hướng dẫn theo TAM CÁ NGUYỆT (nội dung chung, có nguồn).
// ---------------------------------------------------------------------------

export interface TrimesterGuide {
  trimester: WeekTrimester
  /** Nhãn giai đoạn tiếng Việt. */
  phase: string
  /** Mốc phát triển của bé theo giai đoạn (mỗi mốc có nguồn trong babySources). */
  babyDevelopment: string[]
  babySources: Citation[]
  /** Thay đổi cơ thể mẹ. */
  momChanges: string[]
  /** Triệu chứng hay gặp giai đoạn. */
  momSymptoms: string[]
  /** Mệt mỏi & giấc ngủ. */
  sleepAndEnergy: string
  /** Vận động phù hợp giai đoạn. */
  exercise: string
  lifestyleSources: Citation[]
  /** Dấu hiệu cần gặp bác sĩ (warn). */
  warnings: string[]
  warningSources: Citation[]
  /** Checklist khám/sàng lọc bổ sung theo nguồn (mốc khám cụ thể đã có trong app). */
  generalChecklist: string[]
  generalChecklistSources: Citation[]
}

export const TRIMESTER_GUIDES: Record<WeekTrimester, TrimesterGuide> = {
  first: {
    trimester: 'first',
    phase: 'T1 — Hình thành cơ quan (tuần 1–13)',
    babyDevelopment: [
      'Ống thần kinh (mầm não–tủy sống) bắt đầu hình thành tuần 3–4 và đóng kín khoảng ngày 28 sau thụ thai — đủ acid folic từ trước + đầu thai kỳ giúp giảm 50–70% dị tật ống thần kinh.',
      'Tim thai bắt đầu đập khoảng tuần 4.',
      'Đến tuần 8, gần như toàn bộ cơ quan chính đã hình thành; tim đập nhịp đều.',
      'Tuần 12: bé dài ~7,5 cm, nặng ~28 g; cơ và thần kinh bắt đầu phối hợp (có thể nắm tay).',
      'Tuyến giáp của bé chưa hoạt động (chỉ bắt đầu ~tuần 12–14) → bé phụ thuộc hoàn toàn hormone giáp mẹ → mẹ cần đủ i-ốt.',
    ],
    babySources: [SRC.hhs, SRC.cdcFolic, SRC.nestle],
    momChanges: [
      'Mệt mỏi, buồn ngủ nhiều hơn do hormone estrogen/progesterone tăng mạnh.',
      'Cảm xúc dao động mạnh: mệt, buồn nôn, dễ khóc, vừa háo hức vừa lo lắng — điều này là bình thường.',
      'Tăng cân T1 chỉ nên ~0,5–2 kg; có thể không tăng hoặc giảm nhẹ do ốm nghén.',
    ],
    momSymptoms: [
      'Ốm nghén (buồn nôn/nôn) thường đỉnh ở tuần 5–8 và giảm dần cuối T1.',
    ],
    sleepAndEnergy:
      'Rất buồn ngủ, có thể cần 7–10 giờ/đêm; khoảng 25% thai phụ bị mất ngủ ở T1. Hãy nghe cơ thể và nghỉ ngắn ban ngày nếu cần.',
    exercise:
      'Vận động nhẹ nhàng, chia nhỏ; mục tiêu ≥150 phút/tuần cường độ vừa (talk test). Tránh quá nóng và môn va chạm/dễ ngã; khởi động 5–10 phút trước mỗi buổi.',
    lifestyleSources: [SRC.cleveland, SRC.nhsInform, SRC.acogExercise, SRC.whoActivity, SRC.acogNutrition, SRC.iomWeight],
    warnings: [
      'Ra máu âm đạo kèm đau bụng dữ dội — cần đi khám ngay.',
      'Nôn nhiều không uống được nước, sụt cân (nghi nôn nghén nặng) — gặp bác sĩ.',
      'Sốt cao, đau/rát khi tiểu (nguy cơ nhiễm trùng tiểu).',
      'Chóng mặt, đau ngực, khó thở tăng lên, đau/sưng một bên bắp chân — ngừng vận động và đi khám.',
      'Có ý nghĩ tự hại/tự sát → nói ngay với người tin cậy + cấp cứu, không chờ hẹn.',
    ],
    warningSources: [SRC.whoAnc, SRC.acogExercise, SRC.acogMental],
    generalChecklist: [
      'Khám thai lần đầu để lập hồ sơ: xét nghiệm máu (công thức máu/hemoglobin), nước tiểu, tầm soát HIV/viêm gan B/giang mai theo khuyến nghị của WHO.',
      'Trao đổi tiền sử bệnh và thuốc đang dùng; nói ngay nếu có tiền sử bệnh tâm thần để có kế hoạch theo dõi sớm.',
      'Sàng lọc tâm lý chu sinh tại lần khám đầu (theo ACOG).',
      'Sàng lọc người mang gen (carrier screening: xơ nang, teo cơ tủy sống, thalassemia...) nếu chưa làm trước thai kỳ.',
      'Chụp X-quang không khẩn cấp có thể hoãn (hệ thần kinh nhạy cảm nhất tuần 10–17) — hỏi bác sĩ nếu cần.',
    ],
    generalChecklistSources: [SRC.whoAnc, SRC.acogMental, SRC.acog690, SRC.acog733],
  },
  second: {
    trimester: 'second',
    phase: 'T2 — Giai đoạn phân chia neuron (tuần 14–27)',
    babyDevelopment: [
      'Hệ cơ–xương phát triển; bé bắt đầu mút tay (khoảng tuần 16).',
      'Tuần 20: bé nghe được âm thanh, biết nuốt, được phủ lông tơ và lớp vernix bảo vệ.',
      'Tuần 23–24: gần như toàn bộ neuron đã hình thành (~100 tỷ tế bào thần kinh); tủy xương bắt đầu tạo máu; bé có vị giác.',
      'Tuần 24: phổi hình thành (chưa hoạt động); bé dài ~30 cm, nặng ~0,7 kg.',
      'Thai máy thường cảm nhận rõ từ tuần 18–20 — cử động đều là dấu hiệu bé khỏe mạnh.',
    ],
    babySources: [SRC.hhs, SRC.nestle],
    momChanges: [
      'Ốm nghén giảm dần, năng lượng và tâm trạng ổn định hơn — thường là tam cá nguyệt dễ chịu nhất.',
      'Bụng to rõ, da vùng bụng căng; vết rạn có thể bắt đầu xuất hiện.',
      'Tăng cân đều ~0,4 kg/tuần ở T2/T3 với BMI bình thường (theo dõi xu hướng, cá thể hóa theo bác sĩ).',
    ],
    momSymptoms: [
      'Chuột rút chân về đêm dễ xảy ra (liên quan canxi/điện giải, mất nước, mỏi cơ).',
      'Ợ nóng/khó tiêu khi tử cung chèn ép dạ dày.',
    ],
    sleepAndEnergy:
      'Năng lượng tốt hơn, giấc ngủ trở lại gần bình thường (~7–8 giờ) — thường là giai đoạn ngủ ngon nhất. Từ tuần ~16–20 tránh nằm ngửa kéo dài (kể cả khi tập).',
    exercise:
      'Giai đoạn dồi dào năng lượng nhất → có thể tăng dần cường độ; tránh nằm ngửa khi tập sau tuần 16–20; chú ý thăng bằng khi bụng lớn. Bơi và đi bộ dưới nước rất phù hợp.',
    lifestyleSources: [SRC.nhsInform, SRC.cleveland, SRC.mayo, SRC.nhsExercise, SRC.acogExercise, SRC.iomWeight],
    warnings: [
      'Giảm thai máy rõ rệt sau khi đã cảm nhận đều — gặp bác sĩ.',
      'Ra máu âm đạo dai dẳng, đau bụng hoặc đau vùng chậu.',
      'Chuột rút nặng kèm sưng/đỏ/nóng/đau một bên chân (nghi huyết khối tĩnh mạch sâu).',
      'Ngáy to + ngắt thở + buồn ngủ ban ngày quá mức (nghi ngưng thở khi ngủ) — nhất là nếu kèm huyết áp cao.',
      'Mất ngủ kéo dài kèm buồn chán/tuyệt vọng (nghi trầm cảm thai kỳ) — nói với bác sĩ.',
    ],
    warningSources: [SRC.acogExercise, SRC.ats, SRC.mayo, SRC.cleveland, SRC.acogMental],
    generalChecklist: [
      'Nhắc tiêm cúm mùa nếu đang vào mùa (an toàn ở mọi tuổi thai).',
      'Sàng lọc tâm lý chu sinh lần 2 (cuối T2/T3 theo ACOG).',
    ],
    generalChecklistSources: [SRC.acogImmunization, SRC.acogMental],
  },
  third: {
    trimester: 'third',
    phase: 'T3 — Tăng trưởng & tích trữ (tuần 28–40)',
    babyDevelopment: [
      'Não và võng mạc tích lũy DHA nhanh nhất ở giai đoạn này (não thai tăng ~3× trọng lượng, tuần 26–40).',
      'Tuần 32: xương đã hình thành đầy đủ (còn mềm); bé bắt đầu tích trữ khoáng (sắt, canxi) cho 6 tháng đầu đời; phổi tập thở; mắt mở và nhạy cảm ánh sáng.',
      'Từ tuần ~30–36 bé tăng cân nhanh (~0,23 kg/tuần); mỡ dưới da tăng dần từ tuần 36.',
      'Tuần 37–39: đủ tháng, các cơ quan sẵn sàng hoạt động độc lập.',
    ],
    babySources: [SRC.hhs, SRC.nestle],
    momChanges: [
      'Mẹ nặng nề hơn, đi tiểu đêm, khó thở nhẹ khi hoạt động; tử cung chèn ép dạ dày → ăn ít nhưng nhiều bữa.',
      'Cơn gò Braxton Hicks có thể xuất hiện — cần phân biệt với chuyển dạ thật.',
      'Cuối thai kỳ bụng tụt xuống thấp khi bé vào khung chậu → mẹ dễ thở hơn.',
    ],
    momSymptoms: [
      'Rối loạn giấc ngủ tăng: tiểu đêm, đau lưng, chuột rút, ợ nóng, thai máy — tới ~80% thai phụ báo mất ngủ cuối T3.',
      'Phù nhẹ tay chân; táo bón/trĩ dễ xảy ra.',
      'Lo lắng về cuộc sinh và thay đổi cuộc sống trở lại gần ngày dự sinh.',
    ],
    sleepAndEnergy:
      'Từ tuần 28, bắt đầu mỗi giấc ngủ ở tư thế nằm nghiêng (trái/phải đều được) — tránh nằm ngửa kéo dài. Dùng gối kẹp giữa hai đầu gối + sau lưng. Thức dậy thấy đang nằm ngửa không phải khẩn cấp — nhẹ nhàng trở lại nằm nghiêng.',
    exercise:
      'Giảm cường độ, ưu tiên thoải mái, hít thở, giãn cơ và chuẩn bị sinh; tránh nhảy và môn dễ ngã; bơi/đi bộ dưới nước rất hợp. Có thể duy trì tập đến sát ngày sinh nếu không có dấu hiệu bất thường.',
    lifestyleSources: [SRC.cleveland, SRC.tommysSleep, SRC.nhsExercise, SRC.acogExercise, SRC.iomWeight],
    warnings: [
      'Giảm thai máy rõ rệt — gặp bác sĩ ngay.',
      'Cơn gò đều đặn, đau, ngày càng gần; ra máu hoặc rỉ nước ối — có thể chuyển dạ/sinh non.',
      'Đau đầu dữ dội + nhìn mờ + sưng phù đột ngột (dấu hiệu tiền sản giật) — cấp cứu.',
      'Sốt ≥38°C, khó thở tăng, đau ngực.',
      'Chuột rút kèm sưng/đỏ một bên chân; mất ngủ kéo dài kèm buồn chán/tuyệt vọng — nói với bác sĩ.',
    ],
    warningSources: [SRC.whoAnc, SRC.acogExercise, SRC.ats, SRC.mayo],
    generalChecklist: [
      'Tiêm Tdap (uốn ván–bạch hầu–ho gà) trong tuần 27–36.',
      'Vắc-xin RSV (nếu đang mùa thu–đông) trong tuần 32–36.',
      'Xét nghiệm máu lại cuối thai kỳ để phát hiện thiếu máu.',
      'Sàng lọc tâm lý chu sinh (cuối T2/T3 theo ACOG).',
    ],
    generalChecklistSources: [SRC.acogImmunization, SRC.whoAnc, SRC.acogMental],
  },
}

// ---------------------------------------------------------------------------
// Ghi chú theo TUẦN cụ thể (điểm nhấn phát triển + thay đổi mẹ).
// ---------------------------------------------------------------------------

export interface WeekNote {
  week: number
  /** Mốc phát triển nổi bật của tuần (nguồn trong babySources của tam cá nguyệt). */
  highlight?: string
  /** Thay đổi/triệu chứng riêng của mẹ tuần đó (nguồn trong lifestyleSources). */
  momNote?: string
}

export const WEEK_NOTES: WeekNote[] = [
  { week: 4, highlight: 'Tim thai bắt đầu đập khoảng tuần 4 — một mốc đáng nhớ.' },
  { week: 6, highlight: 'Ống thần kinh đóng kín khoảng ngày 28 sau thụ thai (~tuần 6) — lý do phải uống đủ acid folic.' },
  { week: 8, highlight: 'Gần như toàn bộ cơ quan chính đã hình thành; tim đập nhịp đều.' },
  { week: 12, highlight: 'Bé dài ~7,5 cm, nặng ~28 g; cơ–thần kinh bắt đầu phối hợp, có thể nắm tay.' },
  {
    week: 16,
    highlight: 'Hệ cơ–xương phát triển; bé bắt đầu mút tay.',
    momNote: 'Ốm nghén thường giảm rõ — mẹ ăn ngon miệng và năng lượng trở lại.',
  },
  { week: 18, momNote: 'Nhiều mẹ cảm nhận thai máy lần đầu quanh tuần này.' },
  {
    week: 20,
    highlight: 'Bé nghe được âm thanh, biết nuốt; được phủ lông tơ và lớp vernix bảo vệ.',
    momNote: 'Cảm nhận thai máy rõ hơn — cử động đều là dấu hiệu tốt.',
  },
  {
    week: 24,
    highlight:
      'Gần như toàn bộ neuron đã hình thành (~100 tỷ tế bào thần kinh); tủy xương tạo máu; phổi hình thành (chưa hoạt động).',
    momNote: 'Chuột rút chân về đêm dễ xảy ra — chú ý canxi, đủ nước, kéo giãn trước khi ngủ.',
  },
  { week: 28, momNote: 'Bước sang tam cá nguyệt thứ ba — từ tuần này hãy bắt đầu giấc ngủ ở tư thế nằm nghiêng.' },
  { week: 32, highlight: 'Xương hình thành đầy đủ (còn mềm); bé tích trữ sắt–canxi; phổi tập thở; mắt mở, nhạy cảm ánh sáng.' },
  { week: 36, highlight: 'Mỡ dưới da tăng; bé có chu kỳ ngủ–thức rõ ràng.' },
  { week: 38, momNote: 'Bé quay đầu vào khung chậu — mẹ dễ thở hơn nhưng đi tiểu nhiều hơn; chuyển dạ có thể đến bất cứ lúc nào.' },
]

// ---------------------------------------------------------------------------
// Ghép hướng dẫn 1 tuần.
// ---------------------------------------------------------------------------

export interface WeekGuideNutritionFocus {
  name: string
  /** Nhu cầu/ngày theo tam cá nguyệt của tuần, VD "27 mg/ngày (RDA...)". */
  need: string
  reason: string
  /** Món/thực phẩm gợi ý (weekly-focus + nguồn thực phẩm từ nutrient-reference). */
  foods: string[]
  /** Cảnh báo an toàn/UL ngắn nếu có. */
  ul?: string
}

export interface WeekGuide {
  week: number
  trimester: WeekTrimester
  /** Nhãn giai đoạn (VD "T1 — Hình thành cơ quan (tuần 1–13)"). */
  phase: string
  baby: {
    sizeCm: number
    weightG: number
    comparison: string
    development: string[]
    sources: Citation[]
  }
  mom: {
    changes: string[]
    symptoms: string[]
    sleepAndEnergy: string
    exercise: string
    sources: Citation[]
  }
  nutrition: {
    focus: WeekGuideNutritionFocus[]
    /** Món/thực phẩm gợi ý của nhóm tuần (weekly-focus). */
    suggestedFoods: string[]
    dailyGoals: string | null
    notes: string | null
    sources: Citation[]
  }
  checklist: string[]
  checklistSources: Citation[]
  warnings: string[]
  warningSources: Citation[]
}

function uniqueByUrl(cs: Citation[]): Citation[] {
  const seen = new Set<string>()
  const out: Citation[] = []
  for (const c of cs) {
    if (!c.url || seen.has(c.url)) continue
    seen.add(c.url)
    out.push(c)
  }
  return out
}

/**
 * Hướng dẫn đầy đủ cho một tuần (1–42). Tuần ngoài 1–42 → null.
 * Tuần 41–42 (quá ngày dự sinh) dùng trọng tâm dinh dưỡng của tuần 40.
 */
export function getWeekGuide(week: number): WeekGuide | null {
  if (!Number.isInteger(week) || week < 1 || week > 42) return null

  const trimester = trimesterOf(week)
  const t = TRIMESTER_GUIDES[trimester]
  const note = WEEK_NOTES.find((n) => n.week === week)
  const size = FETAL_SIZES.find((r) => r.week === week)

  // Dinh dưỡng: trọng tâm tuần (weekly-focus) + hàm lượng cụ thể (nutrient-reference).
  const focus = getWeeklyFocus(week) ?? (week > 40 ? getWeeklyFocus(40) : null)
  const nutritionFocus: WeekGuideNutritionFocus[] = focus
    ? focus.focus.map((f) => {
        const ref = getNutrientReference(f.nutrientId)
        const need = ref ? ref.needs[focus.trimester].display : null
        return {
          name: ref?.name ?? f.nutrientId,
          need: need ?? '',
          reason: f.reason,
          foods: ref?.foodSources ?? [],
          ul: ref?.ulNote ?? undefined,
        }
      })
    : []

  return {
    week,
    trimester,
    phase: t.phase,
    baby: {
      sizeCm: size?.lengthCm ?? 0,
      weightG: size?.weightG ?? 0,
      comparison: size?.comparison ?? 'bé đang lớn từng ngày',
      development: note?.highlight ? [note.highlight, ...t.babyDevelopment] : t.babyDevelopment,
      sources: t.babySources,
    },
    mom: {
      changes: note?.momNote ? [note.momNote, ...t.momChanges] : t.momChanges,
      symptoms: t.momSymptoms,
      sleepAndEnergy: t.sleepAndEnergy,
      exercise: t.exercise,
      sources: t.lifestyleSources,
    },
    nutrition: {
      focus: nutritionFocus,
      suggestedFoods: focus?.suggestedFoods ?? [],
      dailyGoals: focus?.dailyGoals ?? null,
      notes: focus?.notes ?? null,
      sources: focus?.citations ?? [],
    },
    checklist: t.generalChecklist,
    checklistSources: t.generalChecklistSources,
    warnings: t.warnings,
    warningSources: t.warningSources,
  }
}

// ---------------------------------------------------------------------------
// Self-check — chạy: node --experimental-strip-types --import scripts/test-web-loader.mjs apps/web/lib/weekly-guides.check.ts
// ---------------------------------------------------------------------------

export function selfCheck(): void {
  const assert = (c: boolean, m: string) => {
    if (!c) throw new Error(`weekly-guides selfCheck: ${m}`)
  }
  const hasUrl = (c: Citation) => typeof c.url === 'string' && /^https?:\/\//.test(c.url)
  const check = (w: number) => {
    const g = getWeekGuide(w)
    assert(g !== null, `tuần ${w} có guide`)
    assert(g!.week === w, `tuần ${w} đúng số`)
    assert(Number.isFinite(g!.baby.sizeCm) && Number.isFinite(g!.baby.weightG), `tuần ${w} size không NaN`)
    assert(g!.baby.development.length > 0, `tuần ${w} có mốc phát triển`)
    assert(g!.mom.changes.length > 0 && g!.mom.symptoms.length >= 0, `tuần ${w} có mục mẹ`)
    assert(g!.nutrition.focus.length > 0, `tuần ${w} có dinh dưỡng`)
    assert(g!.nutrition.focus.every((f) => f.name.length > 0 && f.need.length > 0 && f.foods.length > 0), `tuần ${w} focus đủ cấu trúc`)
    assert(g!.checklist.length > 0, `tuần ${w} có checklist`)
    assert(g!.warnings.length > 0, `tuần ${w} có lưu ý`)
    const all = [
      ...g!.baby.sources,
      ...g!.mom.sources,
      ...g!.nutrition.sources,
      ...g!.checklistSources,
      ...g!.warningSources,
    ]
    assert(all.length > 0, `tuần ${w} có nguồn`)
    assert(all.every(hasUrl), `tuần ${w} mọi nguồn có URL`)
  }
  ;[1, 5, 12, 20, 27, 28, 34, 40, 42].forEach(check)
  assert(getWeekGuide(0) === null && getWeekGuide(99) === null, 'tuần ngoài 1–42 → null')
  console.log('✅ weekly-guides selfCheck OK — cấu trúc đủ, không NaN, mọi nguồn có URL')
}
