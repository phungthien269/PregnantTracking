// ===========================================================================
// Mock data layer — Agent 3 (Backend data)
// Seed tiếng Việt thực tế cho một gia đình Việt, triển khai đầy đủ `DataApi`.
// Type: `D.*` từ @mevabe/domain (Agent 2) — khi domain đổi, tsc báo ngay chỗ lệch.
//
// ## Bối cảnh demo (ngày cố định 2026-08-03)
// - Mẹ 31 tuổi, bố 35 tuổi.
// - Thai kỳ hiện tại: tuần 20 (LMP 2026-03-16, EDD 2026-12-21 theo Naegele),
//   1 thai nhi. Kèm bé trai 9 tháng (Minh, sinh 2025-11-03 từ thai kỳ trước) để
//   phần sau sinh demo được — pregnancy hiện tại vẫn `ongoing`.
// - Bữa ăn demo dịch theo NGÀY THẬT (REAL_TODAY, giờ VN) — "hôm nay/hôm qua"
//   hiển thị đúng trên dashboard /bo-an dù ngày chạy khác 2026-08-03.
//
// `ponytail:` mock lưu trong memory (mảng), mutations thay đổi ngay; thêm
// persistent store khi cần chạy nhiều phiên thật.
// ===========================================================================

import { weekFromLmp as weekFromLmpStd } from '../pregnancy-math'
import type * as D from '@mevabe/domain'
import type {
  AppointmentInput,
  AppointmentUpdateInput,
  BirthRecordInput,
  BudgetInput,
  BudgetUpdateInput,
  ChildInput,
  ConditionMeasurementInput,
  ConditionPlanInput,
  DailyIntakeInput,
  DailyIntakeItem,
  DailyIntakeLog,
  DataApi,
  DashboardSummary,
  FetusInput,
  GrowthPoint,
  GrowthPointInput,
  KnowledgeChunkInput,
  MealEntryInput,
  MealPhotoInput,
  MeasurementInput,
  MedicalVisit,
  MedicalVisitInput,
  NutrientFocus,
  NutritionFocus,
  NutritionProfileInput,
  NutrientSummary,
  ReminderInput,
  ShoppingItemUpdateInput,
  SymptomReportInput,
  TaskInput,
  VaccinationInput,
  VisitDocument,
  VisitDocumentInput,
  WaterCaffeine,
  WeekInfo,
} from './api'
import { aggregateNutrients, buildNutrientSummary } from '../nutrition/intake-calcs'
// Agent 6 (Library): merge dữ liệu import vào getter đọc mock để /thu-vien
// hiển thị nguồn + quiz vừa import (đã báo orchestrator, 2026-08-04).
// Import tương đối + node-loader để self-check chạy được trên Node 24
// (không cần alias `@/`). Lệnh: node --experimental-strip-types --import
// ./lib/library/node-loader.mjs lib/data/mock.ts
import { libraryStore } from '../library/store'
// Health-sync (Agent 4, phase 3): dedupe mẫu HealthKit — chỉ thêm, không đổi hàm có sẵn.
import { dedupeHealthMetrics, healthMetricKey, type HealthMetricInput } from '../health-sync'
// Phase 4B: active user (client sync qua POST /api/v1/auth/sync) để lọc private_owner_id.
import { getActiveUser, setActiveUser } from '../auth/active-user'

// ---------------------------------------------------------------------------
// Hằng số bối cảnh (khớp với supabase/seed/seed.sql)
// ---------------------------------------------------------------------------

// TODAY = mốc "hôm nay" của câu chuyện demo (thai kỳ tuần 20). Giữ cố định để
// LMP/EDD/DAYS_LEFT/CURRENT_WEEK khớp nhau và khớp seed supabase.
// REAL_TODAY = ngày lịch thật theo giờ VN (khớp lib/format.todayStr()) — dùng cho
// bộ đếm "hôm nay" (bữa ăn) để dashboard không mâu thuẫn giữa stat và danh sách.
export const TODAY = '2026-08-03'
export const LMP = '2026-03-16'
export const EDD = '2026-12-21'
export const DAYS_LEFT = 140 // EDD - TODAY
export const CURRENT_WEEK = 20

const vnIsoFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
export const REAL_TODAY = vnIsoFmt.format(new Date())
const DAY_MS = 86_400_000
const deltaDays = Math.round((Date.parse(REAL_TODAY) - Date.parse(TODAY)) / DAY_MS)

/** Dịch ISO datetime `YYYY-MM-DDTHH:mm:ss+07:00` đi `days` ngày (giữ giờ + offset). */
function shiftDate(iso: string, days: number): string {
  const [datePart = '', rest = ''] = iso.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const dt = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10) + 'T' + rest
}

export const FAMILY_ID = '10000000-0000-0000-0000-000000000001'
export const MOM_ID = '10000000-0000-0000-0000-000000000002'
export const DAD_ID = '10000000-0000-0000-0000-000000000003'
export const PREG_ID = '20000000-0000-0000-0000-000000000001'
export const FETUS_ID = '20000000-0000-0000-0000-000000000011'
export const HEALTH_ID = '20000000-0000-0000-0000-000000000021'
export const PREG_PREV_ID = '20000000-0000-0000-0000-000000000002'
export const BIRTH_ID = '30000000-0000-0000-0000-000000000001'
export const CHILD_ID = '30000000-0000-0000-0000-000000000002'
export const CHILD_DOB = '2025-11-03'
export const SESSION_ID = '40000000-0000-0000-0000-000000000001'
export const QUIZ_ID = '40000000-0000-0000-0000-000000000002'
export const SOURCE_NUTRITION_ID = '40000000-0000-0000-0000-000000000011'
export const SOURCE_PREGNANCY_ID = '40000000-0000-0000-0000-000000000012'

const uid = (): string => crypto.randomUUID()

const ts = (iso: string): string => iso // timestamps đã có offset +07:00

/**
 * Lọc quyền riêng (Phase 4B): mục private_owner_id===null → dùng chung (ai cũng
 * thấy); ===activeUser → chủ sở hữu thấy; khác → ẨN. KHÔNG có active user →
 * trả toàn bộ (tương thích ngược — 62 check smoke + self-check mock.demo).
 */
export function visible<T extends { private_owner_id: string | null }>(items: T[]): T[] {
  const uid_ = getActiveUser()?.user_id ?? null
  if (!uid_) return items
  return items.filter((i) => i.private_owner_id === null || i.private_owner_id === uid_)
}

/** Naegele: EDD = LMP + 280 ngày (khớp rules.ts của Agent 2). */
export function eddFromLmp(lmp: string): string {
  const [y, m, d] = lmp.split('-').map(Number)
  const date = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, d ?? 1))
  date.setUTCDate(date.getUTCDate() + 280)
  return date.toISOString().slice(0, 10)
}

/** Naegele ngược: LMP = EDD − 280 ngày. */
export function lmpFromEdd(edd: string): string {
  const [y, m, d] = edd.split('-').map(Number)
  const date = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, d ?? 1))
  date.setUTCDate(date.getUTCDate() - 280)
  return date.toISOString().slice(0, 10)
}

/**
 * Tuần thai hiện tại từ LMP của thai kỳ ongoing — UỶ THÁC hàm chuẩn
 * `lib/pregnancy-math.weekFromLmp` (1 nguồn quy ước duy nhất toàn app), với mốc
 * NGÀY THẬT (REAL_TODAY, giờ VN) để tuần tự chạy theo ngày (fix Phase 7).
 * Quy ước completed-weeks (floor days/7, clamp 1..42): ngày LMP = tuần 1, EDD = tuần 40;
 * seed LMP 2026-03-16 tại REAL_TODAY vẫn cho CURRENT_WEEK=20 — dashboard/onboarding
 * /tuan/dinh-dưỡng giờ hiển thị cùng một tuần.
 */
export function weekFromLmp(lmp: string): number {
  return weekFromLmpStd(lmp, REAL_TODAY)
}

export function trimesterOf(week: number): D.Trimester {
  if (week <= 13) return 'first'
  if (week <= 27) return 'second'
  return 'third'
}

export function nutritionOf(week: number): string[] {
  if (week <= 13) return ['Acid folic', 'Sắt', 'Protein', 'Vitamin B6']
  if (week <= 27) return ['Sắt', 'Canxi', 'DHA', 'Protein']
  return ['Canxi', 'Sắt', 'DHA', 'Protein']
}

const w = (
  week: number,
  fetalSize: string,
  fetalLengthCm: number,
  fetalWeightG: number,
  momChanges: string[],
  appointmentsDue: string[] = [],
  todo: string[] = [],
): WeekInfo => ({
  week,
  trimester: trimesterOf(week),
  fetalSize,
  fetalLengthCm,
  fetalWeightG,
  momChanges,
  nutritionFocus: nutritionOf(week),
  appointmentsDue,
  todo,
})

// ---------------------------------------------------------------------------
// Bảng 42 tuần (0–41) — kích thước thai (tham khảo), thay đổi mẹ, mốc khám.
// ---------------------------------------------------------------------------

export const WEEKS: WeekInfo[] = [
  w(0, 'hạt giống nhỏ', 0, 0, ['Trứng đã thụ tinh — mẹ chưa có dấu hiệu rõ rệt'], [], ['Bắt đầu bổ sung acid folic 400µg mỗi ngày', 'Ghi nhận ngày đầu kỳ kinh cuối']),
  w(1, 'hạt vừng (mè)', 0.1, 0, ['Có thể chưa nhận ra mình mang thai'], [], ['Giữ chế độ ăn lành mạnh', 'Lên lịch khám thai lần đầu']),
  w(2, 'hạt táo nhỏ', 0.3, 0, ['Ốm nghén nhẹ có thể bắt đầu'], [], ['Tránh rượu bia, thuốc lá', 'Uống đủ nước']),
  w(3, 'hạt đậu xanh', 0.6, 0, ['Trễ kinh là dấu hiệu đầu tiên đáng chú ý'], [], ['Làm test thử thai nếu chưa chắc chắn']),
  w(4, 'hạt mè', 0.8, 0.2, ['Ngực căng tức, buồn nôn nhẹ'], [], ['Bổ sung acid folic đều đặn']),
  w(5, 'hạt đậu đỏ', 1.0, 0.5, ['Mệt mỏi, thèm hoặc chán ăn'], [], ['Ghi nhật ký các triệu chứng']),
  w(6, 'hạt đậu lăng', 1.2, 1, ['Ốm nghén rõ hơn, đi tiểu nhiều hơn'], ['Khám thai lần đầu — lập hồ sơ thai kỳ'], ['Đặt lịch khám thai lần đầu', 'Chuẩn bị giấy tờ và câu hỏi cho bác sĩ']),
  w(7, 'quả việt quất', 1.4, 2, ['Bụng vẫn chưa rõ, quần áo chật dần'], [], ['Ăn chia nhỏ nhiều bữa giảm buồn nôn']),
  w(8, 'quả anh đào', 1.6, 1, ['Đau tức ngực, thay đổi khẩu vị'], ['Khám thai định kỳ, siêu âm nghe tim thai'], ['Siêu âm xác nhận tim thai']),
  w(9, 'quả nho', 2.3, 2, ['Ốm nghén đỉnh điểm với nhiều mẹ'], [], ['Uống đủ nước, nghỉ ngơi khi mệt']),
  w(10, 'quả chanh nhỏ', 3.1, 4, ['Bé đã thành hình các cơ quan chính'], ['Xét nghiệm máu, nước tiểu lần đầu'], ['Làm xét nghiệm máu cơ bản']),
  w(11, 'quả sung', 4.1, 7, ['Bụng bắt đầu nhô nhẹ'], [], ['Bổ sung thực phẩm giàu sắt']),
  w(12, 'quả chanh', 5.4, 14, ['Nguy cơ sảy thai giảm rõ rệt'], ['Đo độ mờ da gáy (NT) — nên làm trong 11–13 tuần 6 ngày'], ['Đặt lịch đo độ mờ da gáy', 'Chuẩn bị câu hỏi tầm soát dị tật']),
  w(13, 'quả đậu Hà Lan', 7.4, 23, ['Bụng bầu rõ hơn, da vùng bụng căng'], [], ['Bắt đầu dưỡng ẩm da bụng']),
  w(14, 'quả chanh vàng', 8.7, 43, ['Ốm nghén thường giảm dần'], [], ['Duy trì tập luyện nhẹ nhàng']),
  w(15, 'quả táo', 10.1, 70, ['Năng lượng trở lại, ăn ngon hơn'], [], ['Tăng khẩu phần canxi']),
  w(16, 'quả bơ', 11.6, 100, ['Cân nặng tăng dần, chân có thể chuột rút'], ['Siêu âm + xét nghiệm sàng lọc (Triple test)'], ['Làm sàng lọc Triple test nếu được chỉ định', 'Bổ sung canxi 1000–1200mg/ngày']),
  w(17, 'củ cải trắng', 13, 140, ['Da sạm nhẹ, vết rạn bắt đầu xuất hiện'], [], ['Tập các bài nhẹ cho vùng lưng']),
  w(18, 'quả ớt chuông', 14.2, 190, ['Cảm nhận thai máy lần đầu với nhiều mẹ'], [], ['Bắt đầu theo dõi thai máy']),
  w(19, 'quả xoài', 15.3, 240, ['Bụng to rõ, khó ngủ tư thế nằm ngửa'], [], ['Tập nằm nghiêng trái khi ngủ']),
  w(20, 'quả chuối', 16.4, 300, ['Bé đạp nhiều hơn, mẹ dễ thấy cử động'], ['Siêu âm hình thái học — nên làm trong tuần 20–22'], ['Đặt lịch siêu âm hình thái học', 'Đếm thai máy buổi tối', 'Lên danh sách câu hỏi cho bác sĩ']),
  w(21, 'quả cà rốt', 26.7, 360, ['Bé nuốt nước ối, mẹ tăng cân đều'], [], ['Bổ sung DHA từ cá béo 2–3 bữa/tuần']),
  w(22, 'quả đu đủ', 27.8, 430, ['Da căng, ngứa nhẹ vùng bụng'], [], ['Giữ tư thế đúng khi ngồi làm việc']),
  w(23, 'quả bưởi', 28.9, 500, ['Chuột rút chân về đêm dễ xảy ra'], [], ['Massage chân, bổ sung canxi và magie']),
  w(24, 'quả ngô (bắp)', 30, 600, ['Bé phản ứng với âm thanh'], ['Nghiệm pháp dung nạp glucose — nên làm tuần 24–28'], ['Đặt lịch nghiệm pháp đường huyết']),
  w(25, 'củ su hào', 34.6, 660, ['Có thể ợ nóng, khó thở nhẹ'], [], ['Ăn chậm, chia nhiều bữa nhỏ']),
  w(26, 'quả bí xanh', 35.6, 760, ['Tử cung lớn đè lên các cơ quan'], ['Khám thai định kỳ + xét nghiệm nước tiểu'], ['Làm xét nghiệm nước tiểu định kỳ']),
  w(27, 'quả dưa lưới', 36.6, 875, ['Mắt bé bắt đầu mở'], [], ['Bắt đầu học các dấu hiệu chuyển dạ']),
  w(28, 'quả cà tím', 37.6, 1005, ['Bước sang tam cá nguyệt thứ ba'], ['Tiêm phòng uốn ván mũi 1 (AT)'], ['Tiêm uốn ván mũi 1', 'Chuẩn bị đồ đi sinh dần']),
  w(29, 'quả bí đỏ nhỏ', 38.6, 1150, ['Mẹ nặng nề hơn, hay đi tiểu đêm'], [], ['Bổ sung sắt và vitamin C cùng nhau']),
  w(30, 'bắp cải', 39.9, 1320, ['Bé quay đầu xuống dần'], ['Siêu âm tăng trưởng — nên làm tuần 30–32'], ['Đặt lịch siêu âm tăng trưởng']),
  w(31, 'quả dừa', 41.1, 1500, ['Ngủ khó, có thể phù nhẹ tay chân'], [], ['Kê gối hỗ trợ khi ngủ nghiêng']),
  w(32, 'quả bí đao', 42.4, 1700, ['Bé đạp mạnh, mẹ thấy rõ từng cú'], ['Tiêm phòng uốn ván mũi 2 (AT)'], ['Tiêm uốn ván mũi 2']),
  w(33, 'quả dứa', 43.7, 1920, ['Khó thở khi hoạt động nhẹ'], [], ['Nghỉ ngơi nhiều hơn, tránh đứng lâu']),
  w(34, 'củ khoai môn', 45, 2150, ['Bé có chu kỳ ngủ–thức rõ ràng'], [], ['Hoàn thiện hồ sơ sinh tại bệnh viện']),
  w(35, 'quả dưa hấu nhỏ', 46.2, 2380, ['Cơn gò Braxton Hicks có thể xuất hiện'], [], ['Phân biệt cơn gò giả với chuyển dạ thật']),
  w(36, 'quả bắp cải tím', 47.4, 2620, ['Bụng thấp hơn — bé đã vào khung chậu'], ['Khám thai tuần cuối + xét nghiệm liên cầu khuẩn nhóm B (GBS)'], ['Làm xét nghiệm GBS', 'Chuẩn bị vali đi sinh']),
  w(37, 'bó cải xoăn', 48.6, 2860, ['Đủ tháng — bé sẵn sàng chào đời'], [], ['Trao đổi kế hoạch sinh với bác sĩ']),
  w(38, 'quả bí ngô', 49.8, 3080, ['Bé quay đầu, mẹ dễ thở hơn'], ['Khám thai định kỳ — đánh giá sẵn sàng sinh'], ['Khám thai định kỳ hằng tuần']),
  w(39, 'quả dưa hấu', 50.7, 3290, ['Chuyển dạ có thể đến bất cứ lúc nào'], ['Khám thai định kỳ — kiểm tra ngôi thai'], ['Theo dõi dấu hiệu chuyển dạ']),
  w(40, 'quả bí đỏ', 51.2, 3460, ['Sắp gặp bé rồi — giữ bình tĩnh'], ['Theo dõi sau ngày dự sinh — hẹn khám lại'], ['Chuẩn bị tâm lý và đồ đạc sẵn sàng']),
  w(41, 'quả dưa hấu to', 51.7, 3600, ['Quá ngày dự sinh — cần bác sĩ theo dõi'], ['Khám lại để đánh giá tình trạng nước ối'], ['Đi khám ngay khi có chỉ định']),
]

// ---------------------------------------------------------------------------
// Thai kỳ & sức khỏe (seed — supabase.ts truy vấn cùng bảng)
// ---------------------------------------------------------------------------

export const pregnancies: D.Pregnancy[] = [
  { id: PREG_ID, family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-03-20T08:00:00+07:00'), updated_at: ts('2026-08-03T07:30:00+07:00'), lmp: LMP, edd: EDD, status: 'ongoing', notes: 'Thai kỳ thứ 2, mẹ khỏe mạnh, bé phát triển bình thường.', source: 'manual' },
  { id: PREG_PREV_ID, family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2025-02-10T08:00:00+07:00'), updated_at: ts('2025-11-03T10:00:00+07:00'), lmp: '2025-02-01', edd: '2025-11-08', status: 'birth_recorded', notes: 'Thai kỳ sinh bé Minh.', source: 'manual' },
]

export const fetuses: D.Fetus[] = [
  { id: FETUS_ID, family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-03-20T08:00:00+07:00'), updated_at: ts('2026-08-03T07:30:00+07:00'), pregnancy_id: PREG_ID, name: null, sex: 'unknown', birth_order: 1, notes: null },
]

export const healthProfiles: D.HealthProfile[] = [
  { id: HEALTH_ID, family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-03-20T08:00:00+07:00'), updated_at: ts('2026-08-03T07:30:00+07:00'), pregnancy_id: PREG_ID, height_cm: 158, pre_pregnancy_weight_kg: 52, blood_type: 'O+', allergies: ['Hải sản'], preexisting_conditions: [], notes: 'Không có bệnh lý nền. Tiền sử sinh thường một bé đủ tháng.' },
]

// Hồ sơ dinh dưỡng — chứa `conditions` (typed, kích hoạt mô-đun Tình trạng) +
// `doctor_instructions`. Bắt đầu trống → trang Tình trạng hiện empty state.
export const nutritionProfiles: D.NutritionProfile[] = []

export const measurements: D.MaternalMeasurement[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-11T07:00:00+07:00'), updated_at: ts('2026-05-11T07:00:00+07:00'), pregnancy_id: PREG_ID, type: 'weight', value: 52, unit: 'kg', taken_at: ts('2026-05-11T07:00:00+07:00'), note: 'Tuần 8', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-25T07:00:00+07:00'), updated_at: ts('2026-05-25T07:00:00+07:00'), pregnancy_id: PREG_ID, type: 'weight', value: 52.5, unit: 'kg', taken_at: ts('2026-05-25T07:00:00+07:00'), note: 'Tuần 10', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-06-08T07:00:00+07:00'), updated_at: ts('2026-06-08T07:00:00+07:00'), pregnancy_id: PREG_ID, type: 'weight', value: 53, unit: 'kg', taken_at: ts('2026-06-08T07:00:00+07:00'), note: 'Tuần 12', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-06-08T08:00:00+07:00'), updated_at: ts('2026-06-08T08:00:00+07:00'), pregnancy_id: PREG_ID, type: 'blood_pressure', value: 115, unit: 'mmHg', diastolic: 75, taken_at: ts('2026-06-08T08:00:00+07:00'), note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-06-22T07:00:00+07:00'), updated_at: ts('2026-06-22T07:00:00+07:00'), pregnancy_id: PREG_ID, type: 'weight', value: 53.8, unit: 'kg', taken_at: ts('2026-06-22T07:00:00+07:00'), note: 'Tuần 14', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-06-29T07:00:00+07:00'), updated_at: ts('2026-06-29T07:00:00+07:00'), pregnancy_id: PREG_ID, type: 'weight', value: 54.2, unit: 'kg', taken_at: ts('2026-06-29T07:00:00+07:00'), note: 'Tuần 15', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-06T07:00:00+07:00'), updated_at: ts('2026-07-06T07:00:00+07:00'), pregnancy_id: PREG_ID, type: 'weight', value: 54.8, unit: 'kg', taken_at: ts('2026-07-06T07:00:00+07:00'), note: 'Tuần 16', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-06T08:00:00+07:00'), updated_at: ts('2026-07-06T08:00:00+07:00'), pregnancy_id: PREG_ID, type: 'blood_pressure', value: 118, unit: 'mmHg', diastolic: 76, taken_at: ts('2026-07-06T08:00:00+07:00'), note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-06T09:00:00+07:00'), updated_at: ts('2026-07-06T09:00:00+07:00'), pregnancy_id: PREG_ID, type: 'blood_glucose', value: 5.2, unit: 'mmol/L', taken_at: ts('2026-07-06T09:00:00+07:00'), note: 'Đường huyết lúc đói', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-13T07:00:00+07:00'), updated_at: ts('2026-07-13T07:00:00+07:00'), pregnancy_id: PREG_ID, type: 'weight', value: 55.4, unit: 'kg', taken_at: ts('2026-07-13T07:00:00+07:00'), note: 'Tuần 17', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-20T07:00:00+07:00'), updated_at: ts('2026-07-20T07:00:00+07:00'), pregnancy_id: PREG_ID, type: 'weight', value: 56, unit: 'kg', taken_at: ts('2026-07-20T07:00:00+07:00'), note: 'Tuần 18', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-27T07:00:00+07:00'), updated_at: ts('2026-07-27T07:00:00+07:00'), pregnancy_id: PREG_ID, type: 'weight', value: 56.6, unit: 'kg', taken_at: ts('2026-07-27T07:00:00+07:00'), note: 'Tuần 19', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T07:00:00+07:00'), updated_at: ts('2026-08-03T07:00:00+07:00'), pregnancy_id: PREG_ID, type: 'weight', value: 57.2, unit: 'kg', taken_at: ts('2026-08-03T07:00:00+07:00'), note: 'Tuần 20', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:00:00+07:00'), updated_at: ts('2026-08-03T08:00:00+07:00'), pregnancy_id: PREG_ID, type: 'blood_pressure', value: 120, unit: 'mmHg', diastolic: 78, taken_at: ts('2026-08-03T08:00:00+07:00'), note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T09:00:00+07:00'), updated_at: ts('2026-08-03T09:00:00+07:00'), pregnancy_id: PREG_ID, type: 'blood_glucose', value: 5.4, unit: 'mmol/L', taken_at: ts('2026-08-03T09:00:00+07:00'), note: 'Đường huyết lúc đói', source: 'manual' },
]

export const symptoms: D.SymptomReport[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-05-11T08:00:00+07:00'), updated_at: ts('2026-06-22T08:00:00+07:00'), pregnancy_id: PREG_ID, symptom: 'Buồn nôn buổi sáng', severity: 'mild', started_at: ts('2026-05-11T08:00:00+07:00'), ended_at: ts('2026-06-22T08:00:00+07:00'), note: 'Giảm dần sau tuần 13', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-05-15T09:00:00+07:00'), updated_at: ts('2026-07-06T09:00:00+07:00'), pregnancy_id: PREG_ID, symptom: 'Mệt mỏi', severity: 'mild', started_at: ts('2026-05-15T09:00:00+07:00'), ended_at: ts('2026-07-06T09:00:00+07:00'), note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-07-20T10:00:00+07:00'), updated_at: ts('2026-07-20T10:00:00+07:00'), pregnancy_id: PREG_ID, symptom: 'Đau lưng nhẹ', severity: 'mild', started_at: ts('2026-07-20T10:00:00+07:00'), ended_at: null, note: 'Tập yoga bầu giúp đỡ hơn', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-07-27T18:00:00+07:00'), updated_at: ts('2026-07-27T18:00:00+07:00'), pregnancy_id: PREG_ID, symptom: 'Ợ nóng', severity: 'mild', started_at: ts('2026-07-27T18:00:00+07:00'), ended_at: null, note: 'Ăn chậm và chia bữa nhỏ', source: 'manual' },
]

export const fetalMovementLogs: D.FetalMovementLog[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-07-29T21:30:00+07:00'), updated_at: ts('2026-07-29T21:30:00+07:00'), pregnancy_id: PREG_ID, felt_at: ts('2026-07-29T21:30:00+07:00'), feeling: 'normal', duration_min: null, note: 'Bé đạp nhẹ nhàng' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-07-30T22:15:00+07:00'), updated_at: ts('2026-07-30T22:15:00+07:00'), pregnancy_id: PREG_ID, felt_at: ts('2026-07-30T22:15:00+07:00'), feeling: 'normal', duration_min: null, note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-08-01T08:10:00+07:00'), updated_at: ts('2026-08-01T08:10:00+07:00'), pregnancy_id: PREG_ID, felt_at: ts('2026-08-01T08:10:00+07:00'), feeling: 'normal', duration_min: null, note: 'Sau bữa sáng bé cử động đều' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-08-01T23:05:00+07:00'), updated_at: ts('2026-08-01T23:05:00+07:00'), pregnancy_id: PREG_ID, felt_at: ts('2026-08-01T23:05:00+07:00'), feeling: 'normal', duration_min: null, note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-08-02T21:40:00+07:00'), updated_at: ts('2026-08-02T21:40:00+07:00'), pregnancy_id: PREG_ID, felt_at: ts('2026-08-02T21:40:00+07:00'), feeling: 'normal', duration_min: null, note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-08-03T07:25:00+07:00'), updated_at: ts('2026-08-03T07:25:00+07:00'), pregnancy_id: PREG_ID, felt_at: ts('2026-08-03T07:25:00+07:00'), feeling: 'normal', duration_min: null, note: 'Buổi sáng đạp nhẹ vài cái' },
]

// now = mốc 'hiện tại' của demo để phân biệt lịch sắp tới/đã qua
export const DEMO_NOW = `${TODAY}T23:59:59+07:00`

// Lượng nước đã uống hôm nay (addWater tăng dần; getDashboard/getWaterCaffeine đọc).
export let waterLoggedMl = 1400

export const appointments: D.Appointment[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-03-25T08:00:00+07:00'), updated_at: ts('2026-04-27T09:00:00+07:00'), pregnancy_id: PREG_ID, type: 'first_visit', scheduled_at: ts('2026-04-27T09:00:00+07:00'), location: 'Bệnh viện Phụ sản Hà Nội', doctor: 'TS.BS Nguyễn Thu Hà', summary_before: null, outcome: 'Xác nhận thai 6 tuần, tim thai rõ', notes: null, followup_at: ts('2026-06-08T09:00:00+07:00') },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-20T08:00:00+07:00'), updated_at: ts('2026-06-08T09:00:00+07:00'), pregnancy_id: PREG_ID, type: 'ultrasound', scheduled_at: ts('2026-06-08T09:00:00+07:00'), location: 'Bệnh viện Phụ sản Hà Nội', doctor: 'TS.BS Nguyễn Thu Hà', summary_before: null, outcome: 'NT 1.2 mm — kết quả bình thường', notes: null, followup_at: ts('2026-07-06T09:00:00+07:00') },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-06-20T08:00:00+07:00'), updated_at: ts('2026-07-06T09:00:00+07:00'), pregnancy_id: PREG_ID, type: 'screening', scheduled_at: ts('2026-07-06T09:00:00+07:00'), location: 'Bệnh viện Phụ sản Hà Nội', doctor: null, summary_before: null, outcome: 'Nguy cơ thấp, bé khỏe', notes: null, followup_at: ts('2026-08-10T08:30:00+07:00') },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-28T08:00:00+07:00'), updated_at: ts('2026-07-28T08:00:00+07:00'), pregnancy_id: PREG_ID, type: 'ultrasound', scheduled_at: ts('2026-08-10T08:30:00+07:00'), location: 'Bệnh viện Phụ sản Hà Nội', doctor: 'TS.BS Nguyễn Thu Hà', summary_before: 'Mốc quan trọng khảo sát toàn bộ cơ quan thai nhi. Chuẩn bị sổ khám và câu hỏi.', outcome: null, notes: null, followup_at: ts('2026-08-24T09:00:00+07:00') },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:00:00+07:00'), updated_at: ts('2026-08-03T08:00:00+07:00'), pregnancy_id: PREG_ID, type: 'prenatal', scheduled_at: ts('2026-08-24T09:00:00+07:00'), location: 'Bệnh viện Phụ sản Hà Nội', doctor: null, summary_before: 'Đánh giá kết quả siêu âm hình thái', outcome: null, notes: null, followup_at: ts('2026-09-28T07:30:00+07:00') },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:00:00+07:00'), updated_at: ts('2026-08-03T08:00:00+07:00'), pregnancy_id: PREG_ID, type: 'blood_test', scheduled_at: ts('2026-09-28T07:30:00+07:00'), location: 'Bệnh viện Phụ sản Hà Nội', doctor: null, summary_before: 'Nhịn ăn trước xét nghiệm 8 tiếng', outcome: null, notes: null, followup_at: ts('2026-10-05T14:00:00+07:00') },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:00:00+07:00'), updated_at: ts('2026-08-03T08:00:00+07:00'), pregnancy_id: PREG_ID, type: 'vaccination', scheduled_at: ts('2026-10-05T14:00:00+07:00'), location: 'Trạm y tế phường', doctor: null, summary_before: null, outcome: null, notes: null, followup_at: ts('2026-11-02T14:00:00+07:00') },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:00:00+07:00'), updated_at: ts('2026-08-03T08:00:00+07:00'), pregnancy_id: PREG_ID, type: 'vaccination', scheduled_at: ts('2026-11-02T14:00:00+07:00'), location: 'Trạm y tế phường', doctor: null, summary_before: null, outcome: null, notes: null, followup_at: ts('2026-12-14T09:00:00+07:00') },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:00:00+07:00'), updated_at: ts('2026-08-03T08:00:00+07:00'), pregnancy_id: PREG_ID, type: 'blood_test', scheduled_at: ts('2026-12-14T09:00:00+07:00'), location: 'Bệnh viện Phụ sản Hà Nội', doctor: null, summary_before: 'Xét nghiệm liên cầu khuẩn nhóm B', outcome: null, notes: null, followup_at: null },
]

export const documents: D.DocumentRecord[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-06-08T10:00:00+07:00'), updated_at: ts('2026-06-08T10:00:00+07:00'), pregnancy_id: PREG_ID, title: 'Kết quả siêu âm thai 12 tuần', file_name: 'sieu-am-12-tuan.pdf', file_url: null, status: 'ready', notes: 'Độ mờ da gáy 1.2 mm; nhịp tim 156 lần/phút; chiều dài đầu–mông 54 mm.', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-07-06T11:00:00+07:00'), updated_at: ts('2026-07-06T11:00:00+07:00'), pregnancy_id: PREG_ID, title: 'Kết quả xét nghiệm sàng lọc 16 tuần', file_name: 'xet-nghiem-sang-loc-16-tuan.pdf', file_url: null, status: 'ready', notes: 'Nguy cơ Trisomy 21 thấp; nguy cơ Trisomy 18 thấp; chỉ số beta-hCG, PAPP-A trong giới hạn.', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: MOM_ID, created_at: ts('2026-08-10T11:00:00+07:00'), updated_at: ts('2026-08-10T11:00:00+07:00'), pregnancy_id: PREG_ID, title: 'Biên bản siêu âm hình thái 20 tuần', file_name: 'sieu-am-hinh-thai-20-tuan.jpg', file_url: null, status: 'uploaded', notes: 'Đang chờ trích xuất chỉ số từ ảnh.', source: 'document' },
]

// ---------------------------------------------------------------------------
// Dinh dưỡng
// ---------------------------------------------------------------------------

/** Bản ghi ảnh bữa ăn (meal_photos) — mock lưu mảng memory, mỗi record gắn meal_id. */
export const mealPhotos: D.MealPhoto[] = []

// Bữa ăn demo dịch theo ngày thật: "hôm nay" = REAL_TODAY, "hôm qua" = REAL_TODAY - 1.
// (Bối cảnh thai kỳ giữ ở TODAY cố định; riêng bữa ăn dùng ngày lịch thật để
// dashboard /bo-an hiển thị bữa ăn hôm nay đúng, không mâu thuẫn stat vs list.)
const mealYday = shiftDate(`${TODAY}T00:00:00+07:00`, deltaDays - 1).slice(0, 10)
const mealToday = shiftDate(`${TODAY}T00:00:00+07:00`, deltaDays).slice(0, 10)

export const meals: D.MealEntry[] = [
  // Hôm qua (mealYday)
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts(`${mealYday}T07:00:00+07:00`), updated_at: ts(`${mealYday}T07:00:00+07:00`), meal_type: 'breakfast', name: 'Bánh mì trứng ốp la + sữa đậu nành', logged_at: ts(`${mealYday}T07:00:00+07:00`), calories: null, note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts(`${mealYday}T12:00:00+07:00`), updated_at: ts(`${mealYday}T12:00:00+07:00`), meal_type: 'lunch', name: 'Cơm cá kho tộ + canh cua mồng tơi', logged_at: ts(`${mealYday}T12:00:00+07:00`), calories: null, note: 'Cá kho đậm đà, ăn kèm dưa leo', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts(`${mealYday}T15:00:00+07:00`), updated_at: ts(`${mealYday}T15:00:00+07:00`), meal_type: 'snack', name: 'Xoài chín', logged_at: ts(`${mealYday}T15:00:00+07:00`), calories: null, note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts(`${mealYday}T18:30:00+07:00`), updated_at: ts(`${mealYday}T18:30:00+07:00`), meal_type: 'dinner', name: 'Bún riêu cua', logged_at: ts(`${mealYday}T18:30:00+07:00`), calories: null, note: null, source: 'manual' },
  // Hôm nay (mealToday)
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts(`${mealToday}T07:00:00+07:00`), updated_at: ts(`${mealToday}T07:00:00+07:00`), meal_type: 'breakfast', name: 'Phở gà', logged_at: ts(`${mealToday}T07:00:00+07:00`), calories: null, note: 'Thêm hành, rau sống, ít mỡ', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts(`${mealToday}T09:30:00+07:00`), updated_at: ts(`${mealToday}T09:30:00+07:00`), meal_type: 'snack', name: 'Sữa chua + chuối', logged_at: ts(`${mealToday}T09:30:00+07:00`), calories: null, note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts(`${mealToday}T12:00:00+07:00`), updated_at: ts(`${mealToday}T12:00:00+07:00`), meal_type: 'lunch', name: 'Cơm gà luộc + canh rau ngót nấu thịt băm', logged_at: ts(`${mealToday}T12:00:00+07:00`), calories: null, note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts(`${mealToday}T15:30:00+07:00`), updated_at: ts(`${mealToday}T15:30:00+07:00`), meal_type: 'snack', name: 'Đu đủ chín + hạt óc chó', logged_at: ts(`${mealToday}T15:30:00+07:00`), calories: null, note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts(`${mealToday}T18:30:00+07:00`), updated_at: ts(`${mealToday}T18:30:00+07:00`), meal_type: 'dinner', name: 'Cháo thịt bằm + rau cải xanh luộc', logged_at: ts(`${mealToday}T18:30:00+07:00`), calories: null, note: null, source: 'manual' },
]

export const supplements: D.SupplementPlan[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-02-20T08:00:00+07:00'), updated_at: ts('2026-03-01T08:00:00+07:00'), name: 'Acid folic', dosage: '400', unit: 'µg', frequency: 'daily', start_date: '2026-02-20', end_date: null, status: 'confirmed', prescribed_by: 'TS.BS Nguyễn Thu Hà', notes: 'Phòng dị tật ống thần kinh; uống trước và trong 3 tháng đầu.' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-11T08:00:00+07:00'), updated_at: ts('2026-05-11T08:00:00+07:00'), name: 'Sắt', dosage: '60', unit: 'mg', frequency: 'daily', start_date: '2026-05-11', end_date: null, status: 'confirmed', prescribed_by: 'TS.BS Nguyễn Thu Hà', notes: 'Uống sau bữa sáng, kèm vitamin C để hấp thu tốt.' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-06T08:00:00+07:00'), updated_at: ts('2026-07-06T08:00:00+07:00'), name: 'Canxi', dosage: '500', unit: 'mg', frequency: 'daily', start_date: '2026-07-06', end_date: null, status: 'taken', prescribed_by: 'TS.BS Nguyễn Thu Hà', notes: 'Tránh uống cùng lúc với sắt.' },
]

export const savedMeals: D.SavedMeal[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-01T08:00:00+07:00'), updated_at: ts('2026-05-01T08:00:00+07:00'), name: 'Cháo gà tía tô', meal_type: 'dinner', servings: '1 bát to (300 ml)', calories: 350, ingredients: ['Thịt gà', 'Tía tô', 'Gạo tẻ', 'Hành lá'], instructions: 'Ninh gạo nhừ, băm thịt gà, thêm tía tô.', tags: ['Sắt', 'Protein'] },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-01T08:00:00+07:00'), updated_at: ts('2026-05-01T08:00:00+07:00'), name: 'Canh rau ngót nấu thịt băm', meal_type: 'lunch', servings: '1 bát canh', calories: 120, ingredients: ['Rau ngót', 'Thịt băm'], instructions: 'Xào thịt, đổ nước, thả rau ngót.', tags: ['Sắt', 'Canxi', 'Vitamin A'] },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-01T08:00:00+07:00'), updated_at: ts('2026-05-01T08:00:00+07:00'), name: 'Cá hồi áp chảo', meal_type: 'dinner', servings: '150 g cá', calories: 280, ingredients: ['Phi lê cá hồi', 'Chanh', 'Rau thơm'], instructions: 'Áp chảo chín đều, vắt chanh.', tags: ['DHA', 'Protein', 'Omega-3'] },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-01T08:00:00+07:00'), updated_at: ts('2026-05-01T08:00:00+07:00'), name: 'Sữa chua + các loại hạt', meal_type: 'snack', servings: '1 hũ + 2 thìa hạt', calories: 180, ingredients: ['Sữa chua', 'Hạt óc chó', 'Hạnh nhân'], instructions: 'Trộn hạt vào sữa chua.', tags: ['Canxi', 'Protein'] },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-01T08:00:00+07:00'), updated_at: ts('2026-05-01T08:00:00+07:00'), name: 'Cơm gạo lứt + thịt bò xào bông cải', meal_type: 'lunch', servings: '1 bát cơm + 150 g thịt bò', calories: 520, ingredients: ['Gạo lứt', 'Thịt bò', 'Bông cải xanh'], instructions: 'Xào thịt bò chín tới với bông cải.', tags: ['Sắt', 'Protein', 'Chất xơ'] },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-01T08:00:00+07:00'), updated_at: ts('2026-05-01T08:00:00+07:00'), name: 'Súp lơ xanh hấp', meal_type: 'snack', servings: '1 bát con', calories: 60, ingredients: ['Súp lơ xanh'], instructions: 'Hấp chín, chấm nước tương.', tags: ['Canxi', 'Acid folic'] },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-01T08:00:00+07:00'), updated_at: ts('2026-05-01T08:00:00+07:00'), name: 'Trứng gà luộc', meal_type: 'breakfast', servings: '2 quả', calories: 155, ingredients: ['Trứng gà'], instructions: 'Luộc chín.', tags: ['Protein', 'Choline'] },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-01T08:00:00+07:00'), updated_at: ts('2026-05-01T08:00:00+07:00'), name: 'Đu đủ chín', meal_type: 'snack', servings: '1 miếng (150 g)', calories: 60, ingredients: ['Đu đủ chín'], instructions: 'Gọt vỏ, cắt miếng.', tags: ['Acid folic', 'Vitamin A', 'Chất xơ'] },
]

// ---------------------------------------------------------------------------
// Sau sinh & bé
// ---------------------------------------------------------------------------

export const birthRecord: D.BirthRecord = {
  id: BIRTH_ID,
  family_id: FAMILY_ID,
  private_owner_id: null,
  created_at: ts('2025-11-03T10:00:00+07:00'),
  updated_at: ts('2025-11-05T10:00:00+07:00'),
  pregnancy_id: PREG_PREV_ID,
  birth_date: CHILD_DOB,
  birth_type: 'vaginal',
  hospital: 'Bệnh viện Phụ sản Trung ương',
  duration_hours: 6,
  complications: [],
  notes: 'Chuyển dạ tự nhiên, không biến chứng, bé khóc to sau sinh.',
}

export const children: D.Child[] = [
  {
    id: CHILD_ID,
    family_id: FAMILY_ID,
    private_owner_id: null,
    created_at: ts('2025-11-03T10:00:00+07:00'),
    updated_at: ts('2026-08-03T07:00:00+07:00'),
    birth_record_id: BIRTH_ID,
    name: 'Bé Minh',
    sex: 'male',
    birth_date: CHILD_DOB,
    birth_weight_kg: 3.2,
    birth_length_cm: 50,
    head_circumference_cm: 34,
    blood_type: 'O+',
    allergies: [],
  },
]

export const feedings: D.FeedingLog[] = [
  // Hôm qua (2026-08-02)
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-02T06:30:00+07:00'), updated_at: ts('2026-08-02T06:30:00+07:00'), child_id: CHILD_ID, method: 'formula', side: null, amount_ml: 180, started_at: ts('2026-08-02T06:30:00+07:00'), duration_min: 15, note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-02T10:00:00+07:00'), updated_at: ts('2026-08-02T10:00:00+07:00'), child_id: CHILD_ID, method: 'formula', side: null, amount_ml: 150, started_at: ts('2026-08-02T10:00:00+07:00'), duration_min: 12, note: 'Sau bữa cháo thịt', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-02T13:30:00+07:00'), updated_at: ts('2026-08-02T13:30:00+07:00'), child_id: CHILD_ID, method: 'formula', side: null, amount_ml: 170, started_at: ts('2026-08-02T13:30:00+07:00'), duration_min: 14, note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-02T17:00:00+07:00'), updated_at: ts('2026-08-02T17:00:00+07:00'), child_id: CHILD_ID, method: 'formula', side: null, amount_ml: 150, started_at: ts('2026-08-02T17:00:00+07:00'), duration_min: 12, note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-02T21:00:00+07:00'), updated_at: ts('2026-08-02T21:00:00+07:00'), child_id: CHILD_ID, method: 'formula', side: null, amount_ml: 180, started_at: ts('2026-08-02T21:00:00+07:00'), duration_min: 16, note: null, source: 'manual' },
  // Hôm nay (2026-08-03)
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T06:30:00+07:00'), updated_at: ts('2026-08-03T06:30:00+07:00'), child_id: CHILD_ID, method: 'formula', side: null, amount_ml: 180, started_at: ts('2026-08-03T06:30:00+07:00'), duration_min: 15, note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T10:00:00+07:00'), updated_at: ts('2026-08-03T10:00:00+07:00'), child_id: CHILD_ID, method: 'formula', side: null, amount_ml: 150, started_at: ts('2026-08-03T10:00:00+07:00'), duration_min: 12, note: 'Sau bữa cháo bí đỏ', source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T13:30:00+07:00'), updated_at: ts('2026-08-03T13:30:00+07:00'), child_id: CHILD_ID, method: 'formula', side: null, amount_ml: 170, started_at: ts('2026-08-03T13:30:00+07:00'), duration_min: 14, note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T17:00:00+07:00'), updated_at: ts('2026-08-03T17:00:00+07:00'), child_id: CHILD_ID, method: 'formula', side: null, amount_ml: 150, started_at: ts('2026-08-03T17:00:00+07:00'), duration_min: 12, note: null, source: 'manual' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T21:00:00+07:00'), updated_at: ts('2026-08-03T21:00:00+07:00'), child_id: CHILD_ID, method: 'formula', side: null, amount_ml: 180, started_at: ts('2026-08-03T21:00:00+07:00'), duration_min: 16, note: null, source: 'manual' },
]

export const sleeps: D.SleepLog[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-02T23:30:00+07:00'), updated_at: ts('2026-08-03T05:30:00+07:00'), child_id: CHILD_ID, started_at: ts('2026-08-02T23:30:00+07:00'), ended_at: ts('2026-08-03T05:30:00+07:00'), place: 'cot', note: 'Ngủ xuyên đêm, thức 1 lần bú' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T09:00:00+07:00'), updated_at: ts('2026-08-03T10:00:00+07:00'), child_id: CHILD_ID, started_at: ts('2026-08-03T09:00:00+07:00'), ended_at: ts('2026-08-03T10:00:00+07:00'), place: 'bassinet', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T14:00:00+07:00'), updated_at: ts('2026-08-03T15:30:00+07:00'), child_id: CHILD_ID, started_at: ts('2026-08-03T14:00:00+07:00'), ended_at: ts('2026-08-03T15:30:00+07:00'), place: 'cot', note: null },
]

export const diapers: D.DiaperLog[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-02T07:00:00+07:00'), updated_at: ts('2026-08-02T07:00:00+07:00'), child_id: CHILD_ID, changed_at: ts('2026-08-02T07:00:00+07:00'), type: 'pee', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-02T09:30:00+07:00'), updated_at: ts('2026-08-02T09:30:00+07:00'), child_id: CHILD_ID, changed_at: ts('2026-08-02T09:30:00+07:00'), type: 'mixed', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-02T15:00:00+07:00'), updated_at: ts('2026-08-02T15:00:00+07:00'), child_id: CHILD_ID, changed_at: ts('2026-08-02T15:00:00+07:00'), type: 'poo', note: 'Màu vàng, khuôn đặc' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T07:00:00+07:00'), updated_at: ts('2026-08-03T07:00:00+07:00'), child_id: CHILD_ID, changed_at: ts('2026-08-03T07:00:00+07:00'), type: 'pee', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T09:30:00+07:00'), updated_at: ts('2026-08-03T09:30:00+07:00'), child_id: CHILD_ID, changed_at: ts('2026-08-03T09:30:00+07:00'), type: 'mixed', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T12:00:00+07:00'), updated_at: ts('2026-08-03T12:00:00+07:00'), child_id: CHILD_ID, changed_at: ts('2026-08-03T12:00:00+07:00'), type: 'pee', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T15:00:00+07:00'), updated_at: ts('2026-08-03T15:00:00+07:00'), child_id: CHILD_ID, changed_at: ts('2026-08-03T15:00:00+07:00'), type: 'poo', note: 'Sau bữa cháo trưa' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T18:00:00+07:00'), updated_at: ts('2026-08-03T18:00:00+07:00'), child_id: CHILD_ID, changed_at: ts('2026-08-03T18:00:00+07:00'), type: 'pee', note: null },
]

// Theo WHO, bé trai khỏe mạnh 0–9 tháng — đúng `GrowthPoint` view model của api.ts
export const growthByChild: Record<string, GrowthPoint[]> = {
  [CHILD_ID]: [
    { date: '2025-11-03', weightKg: 3.2, heightCm: 50, headCm: 34 },
    { date: '2025-12-03', weightKg: 4.4, heightCm: 54, headCm: 37 },
    { date: '2026-01-03', weightKg: 5.6, heightCm: 58, headCm: 39 },
    { date: '2026-02-03', weightKg: 6.5, heightCm: 61, headCm: 41 },
    { date: '2026-03-03', weightKg: 7.2, heightCm: 64, headCm: 42 },
    { date: '2026-04-03', weightKg: 7.9, heightCm: 66, headCm: 43 },
    { date: '2026-05-03', weightKg: 8.5, heightCm: 68, headCm: 44 },
    { date: '2026-06-03', weightKg: 9.0, heightCm: 70, headCm: 45 },
    { date: '2026-07-03', weightKg: 9.4, heightCm: 72, headCm: 46 },
    { date: '2026-08-03', weightKg: 9.8, heightCm: 74, headCm: 46.5 },
  ],
}

export const milestones: D.Milestone[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-01-15T08:00:00+07:00'), updated_at: ts('2026-01-15T08:00:00+07:00'), child_id: CHILD_ID, name: 'Lẫy sấp', stage: 'Vận động', status: 'achieved', achieved_at: ts('2026-01-15T08:00:00+07:00'), note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-04-20T08:00:00+07:00'), updated_at: ts('2026-04-20T08:00:00+07:00'), child_id: CHILD_ID, name: 'Biết bò', stage: 'Vận động', status: 'achieved', achieved_at: ts('2026-04-20T08:00:00+07:00'), note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-06-10T08:00:00+07:00'), updated_at: ts('2026-06-10T08:00:00+07:00'), child_id: CHILD_ID, name: 'Tự ngồi vững', stage: 'Vận động', status: 'achieved', achieved_at: ts('2026-06-10T08:00:00+07:00'), note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-02T08:00:00+07:00'), updated_at: ts('2026-05-02T08:00:00+07:00'), child_id: CHILD_ID, name: 'Nói bập bẹ (ba ba, ma ma)', stage: 'Ngôn ngữ', status: 'achieved', achieved_at: ts('2026-05-02T08:00:00+07:00'), note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-01T08:00:00+07:00'), updated_at: ts('2026-07-01T08:00:00+07:00'), child_id: CHILD_ID, name: 'Mọc chiếc răng đầu tiên', stage: 'Thể chất', status: 'achieved', achieved_at: ts('2026-07-01T08:00:00+07:00'), note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-20T08:00:00+07:00'), updated_at: ts('2026-07-20T08:00:00+07:00'), child_id: CHILD_ID, name: 'Đứng vịn', stage: 'Vận động', status: 'not_yet', achieved_at: null, note: 'Đang tập đứng bám thành giường' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-20T08:00:00+07:00'), updated_at: ts('2026-07-20T08:00:00+07:00'), child_id: CHILD_ID, name: 'Chỉ tay gọi đồ vật', stage: 'Nhận thức', status: 'questionable', achieved_at: null, note: null },
]

export const vaccinations: D.Vaccination[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2025-11-03T08:00:00+07:00'), updated_at: ts('2025-11-03T08:00:00+07:00'), child_id: CHILD_ID, vaccine_name: 'Viêm gan B', dose_number: 1, scheduled_date: '2025-11-03', administered_date: '2025-11-03', location: 'Bệnh viện Phụ sản Trung ương', notes: 'Mũi sơ sinh' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2025-11-03T08:00:00+07:00'), updated_at: ts('2025-11-04T08:00:00+07:00'), child_id: CHILD_ID, vaccine_name: 'Lao (BCG)', dose_number: 1, scheduled_date: '2025-11-03', administered_date: '2025-11-04', location: 'Bệnh viện Phụ sản Trung ương', notes: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-01-03T08:00:00+07:00'), updated_at: ts('2026-01-03T08:00:00+07:00'), child_id: CHILD_ID, vaccine_name: '6 trong 1 (bạch hầu, ho gà, uốn ván, bại liệt, Hib, viêm gan B)', dose_number: 1, scheduled_date: '2026-01-03', administered_date: '2026-01-03', location: 'Trạm y tế phường', notes: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-02-03T08:00:00+07:00'), updated_at: ts('2026-02-03T08:00:00+07:00'), child_id: CHILD_ID, vaccine_name: '6 trong 1', dose_number: 2, scheduled_date: '2026-02-03', administered_date: '2026-02-03', location: 'Trạm y tế phường', notes: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-03-03T08:00:00+07:00'), updated_at: ts('2026-03-03T08:00:00+07:00'), child_id: CHILD_ID, vaccine_name: '6 trong 1', dose_number: 3, scheduled_date: '2026-03-03', administered_date: '2026-03-03', location: 'Trạm y tế phường', notes: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-01-03T08:00:00+07:00'), updated_at: ts('2026-03-03T08:00:00+07:00'), child_id: CHILD_ID, vaccine_name: 'Rota virus (uống)', dose_number: 1, scheduled_date: '2026-01-03', administered_date: '2026-03-03', location: 'Trạm y tế phường', notes: 'Đã uống đủ 3 liều (1, 2, 3 tháng)' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-06-03T08:00:00+07:00'), updated_at: ts('2026-06-03T08:00:00+07:00'), child_id: CHILD_ID, vaccine_name: 'Viêm gan B', dose_number: 4, scheduled_date: '2026-06-03', administered_date: '2026-06-03', location: 'Trạm y tế phường', notes: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:00:00+07:00'), updated_at: ts('2026-08-03T08:00:00+07:00'), child_id: CHILD_ID, vaccine_name: 'Sởi', dose_number: 1, scheduled_date: '2026-08-03', administered_date: null, location: 'Trạm y tế phường', notes: 'Đến hạn trong tháng 8' },
]

// ---------------------------------------------------------------------------
// Điều phối gia đình
// ---------------------------------------------------------------------------

export const tasks: D.Task[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-28T08:00:00+07:00'), updated_at: ts('2026-07-28T08:00:00+07:00'), title: 'Đặt lịch siêu âm hình thái tuần 20', description: null, status: 'todo', due_date: '2026-08-10', assignee_id: MOM_ID, completed_at: null, reminder_id: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-28T08:00:00+07:00'), updated_at: ts('2026-08-03T08:00:00+07:00'), title: 'Mua canxi và sắt dự trữ', description: 'Mua thêm 1 hộp sắt, 1 hộp canxi ở hiệu thuốc.', status: 'in_progress', due_date: '2026-08-07', assignee_id: DAD_ID, completed_at: null, reminder_id: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-28T08:00:00+07:00'), updated_at: ts('2026-08-03T19:00:00+07:00'), title: 'Tập yoga bầu buổi tối', description: null, status: 'done', due_date: '2026-08-03', assignee_id: MOM_ID, completed_at: ts('2026-08-03T19:00:00+07:00'), reminder_id: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-28T08:00:00+07:00'), updated_at: ts('2026-07-28T08:00:00+07:00'), title: 'Đặt lịch tiêm phòng uốn ván mũi 1', description: null, status: 'todo', due_date: '2026-09-28', assignee_id: DAD_ID, completed_at: null, reminder_id: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-28T08:00:00+07:00'), updated_at: ts('2026-07-28T08:00:00+07:00'), title: 'Sắp xếp phòng và mua đồ sơ sinh', description: 'Lên danh sách đồ cần mua, dọn phòng cho bé.', status: 'in_progress', due_date: '2026-08-15', assignee_id: DAD_ID, completed_at: null, reminder_id: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-28T08:00:00+07:00'), updated_at: ts('2026-07-28T08:00:00+07:00'), title: 'Chuẩn bị hồ sơ sinh tại bệnh viện', description: null, status: 'todo', due_date: '2026-11-20', assignee_id: MOM_ID, completed_at: null, reminder_id: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-20T08:00:00+07:00'), updated_at: ts('2026-07-22T08:00:00+07:00'), title: 'Chuyển bé Minh sang phòng riêng', description: null, status: 'done', due_date: '2026-07-25', assignee_id: DAD_ID, completed_at: ts('2026-07-22T08:00:00+07:00'), reminder_id: null },
]

export const shopping: D.ShoppingItem[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-10T08:00:00+07:00'), updated_at: ts('2026-07-10T08:00:00+07:00'), name: 'Nôi em bé', category: 'Đồ bé', quantity: 1, unit: 'cái', estimated_price: 2200000, actual_price: 1980000, status: 'bought', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-10T08:00:00+07:00'), updated_at: ts('2026-07-10T08:00:00+07:00'), name: 'Máy hút sữa', category: 'Đồ mẹ', quantity: 1, unit: 'cái', estimated_price: 1500000, actual_price: null, status: 'pending', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-10T08:00:00+07:00'), updated_at: ts('2026-07-10T08:00:00+07:00'), name: 'Bỉm tã (lốc 100)', category: 'Đồ bé', quantity: 1, unit: 'lốc', estimated_price: 350000, actual_price: null, status: 'pending', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-10T08:00:00+07:00'), updated_at: ts('2026-07-10T08:00:00+07:00'), name: 'Địu em bé', category: 'Đồ bé', quantity: 1, unit: 'cái', estimated_price: 800000, actual_price: null, status: 'pending', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-20T08:00:00+07:00'), updated_at: ts('2026-07-20T08:00:00+07:00'), name: 'Sữa công thức (hộp 900 g)', category: 'Đồ bé', quantity: 2, unit: 'hộp', estimated_price: 450000, actual_price: 429000, status: 'bought', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-20T08:00:00+07:00'), updated_at: ts('2026-07-20T08:00:00+07:00'), name: 'Bộ quần áo sơ sinh', category: 'Đồ bé', quantity: 3, unit: 'bộ', estimated_price: 600000, actual_price: null, status: 'pending', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-25T08:00:00+07:00'), updated_at: ts('2026-07-25T08:00:00+07:00'), name: 'Áo bầu', category: 'Đồ mẹ', quantity: 2, unit: 'cái', estimated_price: 300000, actual_price: 280000, status: 'bought', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-25T08:00:00+07:00'), updated_at: ts('2026-07-25T08:00:00+07:00'), name: 'Vitamin tổng hợp cho bà bầu', category: 'Đồ mẹ', quantity: 1, unit: 'hộp', estimated_price: 500000, actual_price: null, status: 'pending', note: null },
]

export const budget: D.BudgetEntry[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-05T08:00:00+07:00'), updated_at: ts('2026-07-05T08:00:00+07:00'), title: 'Khám + siêu âm tuần 16', amount: 1200000, type: 'expense', category: 'Khám thai', occurred_at: '2026-07-05', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-10T08:00:00+07:00'), updated_at: ts('2026-07-10T08:00:00+07:00'), title: 'Sữa công thức + bỉm', amount: 900000, type: 'expense', category: 'Sữa và đồ bé', occurred_at: '2026-07-10', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-12T08:00:00+07:00'), updated_at: ts('2026-07-12T08:00:00+07:00'), title: 'Nôi, quần áo, địu', amount: 1500000, type: 'expense', category: 'Đồ sơ sinh', occurred_at: '2026-07-12', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-06T08:00:00+07:00'), updated_at: ts('2026-07-06T08:00:00+07:00'), title: 'Xét nghiệm sàng lọc 16 tuần', amount: 2500000, type: 'expense', category: 'Xét nghiệm', occurred_at: '2026-07-06', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-15T08:00:00+07:00'), updated_at: ts('2026-07-15T08:00:00+07:00'), title: 'Thực phẩm bổ sung cho mẹ', amount: 1800000, type: 'expense', category: 'Ăn uống', occurred_at: '2026-07-15', note: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-20T08:00:00+07:00'), updated_at: ts('2026-07-20T08:00:00+07:00'), title: 'Vitamin tổng hợp cho bà bầu', amount: 500000, type: 'expense', category: 'Vitamin', occurred_at: '2026-07-20', note: 'Dự kiến chi tháng 8' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-28T08:00:00+07:00'), updated_at: ts('2026-07-28T08:00:00+07:00'), title: 'Chi phí dự kiến ca sinh', amount: 5000000, type: 'expense', category: 'Dự phòng sinh', occurred_at: '2026-11-15', note: 'Dự trù cho ca sinh cuối tháng 11' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-06-20T08:00:00+07:00'), updated_at: ts('2026-06-20T08:00:00+07:00'), title: 'Khám định kỳ tuần 12', amount: 800000, type: 'expense', category: 'Khám thai', occurred_at: '2026-06-20', note: null },
]

export const reminders: D.Reminder[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-03-20T08:00:00+07:00'), updated_at: ts('2026-03-20T08:00:00+07:00'), title: 'Uống vitamin (acid folic + sắt)', scheduled_at: ts('2026-08-03T08:00:00+07:00'), frequency: 'daily', channels: ['in_app', 'push'], active: true, last_sent_at: null, payload: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-28T08:00:00+07:00'), updated_at: ts('2026-07-28T08:00:00+07:00'), title: 'Khám thai — siêu âm hình thái', scheduled_at: ts('2026-08-10T08:00:00+07:00'), frequency: 'once', channels: ['in_app', 'push'], active: true, last_sent_at: null, payload: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-28T08:00:00+07:00'), updated_at: ts('2026-07-28T08:00:00+07:00'), title: 'Tập yoga bầu', scheduled_at: ts('2026-08-03T18:00:00+07:00'), frequency: 'daily', channels: ['in_app'], active: true, last_sent_at: null, payload: null },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-28T08:00:00+07:00'), updated_at: ts('2026-07-28T08:00:00+07:00'), title: 'Cho bé Minh ăn cháo chiều', scheduled_at: ts('2026-08-03T17:00:00+07:00'), frequency: 'daily', channels: ['in_app', 'push'], active: true, last_sent_at: null, payload: null },
]

// Mặc định: 6 nhóm × 3 kênh, chỉ push tắt.
export const notificationPrefs: D.NotificationPreference[] = [
  ...(['appointments', 'reminders', 'feeding', 'growth', 'tasks', 'safety'] as const).flatMap((group) =>
    (['in_app', 'email', 'push'] as const).map((channel) => ({
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: ts('2026-03-20T08:00:00+07:00'),
      updated_at: ts('2026-03-20T08:00:00+07:00'),
      group,
      channel,
      enabled: channel !== 'push',
      quiet_start: null,
      quiet_end: null,
    })),
  ),
]

// ---------------------------------------------------------------------------
// Nội dung & học cùng con
// ---------------------------------------------------------------------------

export const weeklyGuides: D.WeeklyGuide[] = [
  {
    id: uid(),
    family_id: FAMILY_ID,
    private_owner_id: null,
    created_at: ts('2026-05-01T08:00:00+07:00'),
    updated_at: ts('2026-05-01T08:00:00+07:00'),
    week: 20,
    trimester: 'second',
    title: 'Tuần 20: Bé đạp nhiều hơn, mẹ chú ý canxi',
    content: 'Bé bằng quả chuối, mẹ dễ cảm nhận thai máy. Đây là lúc bổ sung canxi và sắt đều đặn, đặt lịch siêu âm hình thái học.\n\nBé trai hoặc bé gái đều có thể phát hiện qua siêu âm hình thái ở tuần 20–22, nhưng mẹ không bắt buộc phải biết giới tính.\n\nThai máy trung bình 10 lần trong 2 giờ; nếu thấy giảm đột ngột, uống nước, nằm nghiêng trái và đếm lại 1–2 giờ.',
    nutrition_focus: ['Sắt', 'Canxi', 'DHA', 'Protein'],
    appointments_due: ['Siêu âm hình thái học — nên làm trong tuần 20–22'],
    todo: ['Đặt lịch siêu âm hình thái học', 'Đếm thai máy buổi tối', 'Lên danh sách câu hỏi cho bác sĩ'],
  },
]

export const articles: D.Article[] = [
  {
    id: uid(),
    family_id: FAMILY_ID,
    private_owner_id: null,
    created_at: ts('2026-06-10T08:00:00+07:00'),
    updated_at: ts('2026-06-10T08:00:00+07:00'),
    title: 'Dinh dưỡng 3 tháng giữa: Sắt và canxi cho mẹ và bé',
    slug: 'dinh-duong-3-thang-giua-sat-va-canxi',
    summary: '3 tháng giữa là giai đoạn bé tăng nhanh về xương và máu — mẹ cần sắt và canxi nhiều hơn.',
    body: 'Sắt giúp vận chuyển oxy; mẹ cần khoảng 27 mg sắt/ngày, nguồn từ thịt đỏ, trứng, rau ngót, đậu đỗ.\n\nCanxi 1000–1200 mg/ngày từ sữa, sữa chua, cá nhỏ ăn cả xương, rau xanh đậm.\n\nUống sắt kèm vitamin C (nước cam, ổi) để hấp thu tốt; tránh uống cùng canxi.',
    source: 'Cẩm nang thai kỳ — Bệnh viện Từ Dũ, bản 2026',
    version: 2,
    stages: ['pregnancy'],
    tags: ['sắt', 'canxi', '3 tháng giữa'],
    author: 'ThS.BS Lê Thị Hương',
    published_at: ts('2026-06-10T08:00:00+07:00'),
    medical_reviewed: true,
  },
  {
    id: uid(),
    family_id: FAMILY_ID,
    private_owner_id: null,
    created_at: ts('2026-05-20T08:00:00+07:00'),
    updated_at: ts('2026-05-20T08:00:00+07:00'),
    title: 'Nhận biết cơn chuyển dạ thật',
    slug: 'nhan-biet-con-chuyen-da-that',
    summary: 'Phân biệt cơn gò giả và chuyển dạ thật để đến viện đúng lúc.',
    body: 'Chuyển dạ thật: cơn gò đều đặn, tăng dần tần suất và cường độ, kèm đau lưng dưới lan xuống bụng.\n\nDấu hiệu cần đến viện ngay: ra nước ối, ra máu, thai máy giảm đột ngột.\n\nGò giả (Braxton Hicks) không đều, giảm khi thay đổi tư thế.',
    source: 'Sổ tay sản khoa — Bộ Y tế, bản 2025',
    version: 2,
    stages: ['pregnancy'],
    tags: ['chuyển dạ', 'sinh'],
    author: null,
    published_at: ts('2026-05-20T08:00:00+07:00'),
    medical_reviewed: true,
  },
  {
    id: uid(),
    family_id: FAMILY_ID,
    private_owner_id: null,
    created_at: ts('2026-04-15T08:00:00+07:00'),
    updated_at: ts('2026-04-15T08:00:00+07:00'),
    title: 'Vì sao cần khám tiền sản định kỳ',
    slug: 'vi-sao-can-kham-tien-san-dinh-ky',
    summary: 'Lịch khám thai giúp theo dõi sức khỏe mẹ và sự phát triển của bé suốt thai kỳ.',
    body: 'Khám tháng đầu: xác nhận thai, tầm soát nguy cơ, lập hồ sơ.\n\nTháng 3–4: đo độ mờ da gáy, sàng lọc dị tật.\n\nTháng 5–6: siêu âm hình thái học, nghiệm pháp đường huyết.\n\nTháng cuối: khám hằng tuần, đánh giá ngôi thai và nước ối.',
    source: 'Cẩm nang mang thai — Bộ Y tế, bản 2025',
    version: 1,
    stages: ['pregnancy'],
    tags: ['khám thai', 'tiền sản'],
    author: null,
    published_at: ts('2026-04-15T08:00:00+07:00'),
    medical_reviewed: true,
  },
  {
    id: uid(),
    family_id: FAMILY_ID,
    private_owner_id: null,
    created_at: ts('2026-07-01T08:00:00+07:00'),
    updated_at: ts('2026-07-01T08:00:00+07:00'),
    title: 'Ăn dặm cho bé 6–12 tháng: bắt đầu thế nào',
    slug: 'an-dam-cho-be-6-12-thang',
    summary: 'Hướng dẫn cho bé Minh bắt đầu ăn dặm đúng cách, đủ chất.',
    body: 'Bắt đầu từ bột loãng → đặc dần, cháo nghiền, rau củ và thịt băm nhuyễn.\n\nCho bé ăn 2–3 bữa cháo/ngày, vẫn duy trì sữa 500–700 ml/ngày.\n\nGiới thiệu từng loại thực phẩm, theo dõi phản ứng dị ứng.\n\nKhông thêm muối, đường cho bé dưới 1 tuổi.',
    source: 'Hội Nhi khoa Việt Nam, bản 2024',
    version: 1,
    stages: ['age_6_12m'],
    tags: ['ăn dặm', 'bé 6-12 tháng'],
    author: null,
    published_at: ts('2026-07-01T08:00:00+07:00'),
    medical_reviewed: true,
  },
]

export const quizSets: D.QuizSet[] = [
  {
    id: QUIZ_ID,
    family_id: FAMILY_ID,
    private_owner_id: null,
    created_at: ts('2026-07-20T08:00:00+07:00'),
    updated_at: ts('2026-07-20T08:00:00+07:00'),
    title: 'Thai kỳ tuần 20',
    stage: 'pregnancy',
    source_ids: [],
    status: 'ready',
    question_count: 5,
  },
]

// DataApi chưa có hàm trả quiz questions (chỉ trả QuizSet). Giữ seed ở đây
// cho bảng quiz_questions; đã báo orchestrator + Agent 1 xem xét bổ sung.
export const quizQuestions: D.QuizQuestion[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-20T08:00:00+07:00'), updated_at: ts('2026-07-20T08:00:00+07:00'), quiz_set_id: QUIZ_ID, type: 'multiple_choice', prompt: 'Ở tuần 20, mẹ nên bổ sung bao nhiêu canxi mỗi ngày?', options: ['400 mg', '600 mg', '1000–1200 mg', '2000 mg'], correct_index: 2, explanation: 'Thai kỳ cần khoảng 1000–1200 mg canxi/ngày để phát triển xương và răng của bé.', citation: 'Cẩm nang thai kỳ — Bệnh viện Từ Dũ, 2026' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-20T08:00:00+07:00'), updated_at: ts('2026-07-20T08:00:00+07:00'), quiz_set_id: QUIZ_ID, type: 'multiple_choice', prompt: 'Siêu âm hình thái học nên thực hiện ở tuần nào?', options: ['Tuần 8–10', 'Tuần 12–14', 'Tuần 20–22', 'Tuần 30–32'], correct_index: 2, explanation: 'Tuần 20–22 là thời điểm vàng khảo sát toàn bộ cơ quan thai nhi.', citation: 'Hướng dẫn quốc gia về chăm sóc tiền sản' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-20T08:00:00+07:00'), updated_at: ts('2026-07-20T08:00:00+07:00'), quiz_set_id: QUIZ_ID, type: 'multiple_choice', prompt: 'Số lần thai máy bình thường trong 2 giờ là bao nhiêu?', options: ['Dưới 5 lần', 'Từ 10 lần trở lên', 'Chỉ 1–2 lần', 'Không quan trọng'], correct_index: 1, explanation: 'Trung bình mẹ cảm nhận từ 10 lần thai máy trong 2 giờ là dấu hiệu bé khỏe.', citation: 'Cẩm nang thai kỳ — Bệnh viện Từ Dũ, 2026' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-20T08:00:00+07:00'), updated_at: ts('2026-07-20T08:00:00+07:00'), quiz_set_id: QUIZ_ID, type: 'multiple_choice', prompt: 'Lượng caffeine tối đa được khuyến nghị khi mang thai là bao nhiêu mỗi ngày?', options: ['0 mg — tuyệt đối tránh', '100 mg', '200 mg', '400 mg'], correct_index: 2, explanation: 'Khuyến nghị giới hạn caffeine dưới 200 mg/ngày trong thai kỳ.', citation: 'Tổ chức Y tế Thế giới (WHO)' },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-07-20T08:00:00+07:00'), updated_at: ts('2026-07-20T08:00:00+07:00'), quiz_set_id: QUIZ_ID, type: 'scenario', prompt: 'Buổi tối mẹ thấy bé đạp ít hơn mọi ngày nhưng vẫn còn cảm nhận được. Mẹ nên làm gì trước tiên?', options: ['Đi khám ngay trong đêm', 'Uống nước, nằm nghiêng trái và đếm thai máy 1–2 giờ; nếu vẫn ít thì đi khám', 'Uống cà phê để kích thích bé', 'Ngủ và chờ đến sáng mới kiểm tra'], correct_index: 1, explanation: 'Đầu tiên bình tĩnh đếm thai máy sau khi uống nước và nằm nghiêng trái. Nếu dưới 10 lần/2 giờ hoặc tiếp tục giảm, đến cơ sở y tế.', citation: 'Hướng dẫn quốc gia về chăm sóc tiền sản' },
]

// DataApi chưa có hàm getChatSessions — chỉ cần getChatMessages(sessionId).
export const chatSession: D.ChatSession = {
  id: SESSION_ID,
  family_id: FAMILY_ID,
  private_owner_id: null,
  created_at: ts('2026-08-03T08:00:00+07:00'),
  updated_at: ts('2026-08-03T08:05:00+07:00'),
  title: 'Hỏi AI thai kỳ',
  stage: 'pregnancy',
  model: 'OpenRouter — model free đã duyệt',
  status: 'active',
  pinned: false,
}

export const chatMessages: D.ChatMessage[] = [
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:00:00+07:00'), updated_at: ts('2026-08-03T08:00:00+07:00'), session_id: SESSION_ID, role: 'user', content: 'Thai tuần 20 ăn gì để bổ sung sắt?', sources: [] },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:01:00+07:00'), updated_at: ts('2026-08-03T08:01:00+07:00'), session_id: SESSION_ID, role: 'assistant', content: 'Mẹ nên ăn thịt bò, trứng, rau ngót và các loại đậu. Uống sắt cùng thực phẩm giàu vitamin C (nước cam, ổi) để hấp thu tốt hơn, và tránh uống sắt cùng lúc với canxi.', sources: [SOURCE_NUTRITION_ID] },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:02:00+07:00'), updated_at: ts('2026-08-03T08:02:00+07:00'), session_id: SESSION_ID, role: 'user', content: 'Bé đạp nhiều lúc đêm có sao không?', sources: [] },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:03:00+07:00'), updated_at: ts('2026-08-03T08:03:00+07:00'), session_id: SESSION_ID, role: 'assistant', content: 'Không sao. Bé có chu kỳ ngủ–thức riêng, nhiều bé nghịch nhiều nhất vào buổi tối và sáng sớm. Chỉ cần chú ý nếu thai máy giảm rõ so với thường lệ.', sources: [SOURCE_PREGNANCY_ID] },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:04:00+07:00'), updated_at: ts('2026-08-03T08:04:00+07:00'), session_id: SESSION_ID, role: 'user', content: 'Caffeine bao nhiêu là an toàn khi mang thai?', sources: [] },
  { id: uid(), family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-08-03T08:05:00+07:00'), updated_at: ts('2026-08-03T08:05:00+07:00'), session_id: SESSION_ID, role: 'assistant', content: 'Khuyến nghị giới hạn dưới 200 mg caffeine mỗi ngày (khoảng 1–2 cốc cà phê nhỏ). Nếu có thể, hạn chế cà phê, trà đặc và nước tăng lực.', sources: [SOURCE_NUTRITION_ID] },
]

export const knowledgeSources: D.KnowledgeSource[] = [
  { id: SOURCE_NUTRITION_ID, family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-06-01T08:00:00+07:00'), updated_at: ts('2026-06-01T08:00:00+07:00'), content_source_id: null, title: 'Cẩm nang thai kỳ — Bệnh viện Từ Dũ', stage: 'pregnancy', status: 'ready', chunk_count: 24 },
  { id: SOURCE_PREGNANCY_ID, family_id: FAMILY_ID, private_owner_id: null, created_at: ts('2026-05-10T08:00:00+07:00'), updated_at: ts('2026-05-10T08:00:00+07:00'), content_source_id: null, title: 'Sổ tay sản khoa — Bộ Y tế', stage: 'pregnancy', status: 'ready', chunk_count: 18 },
]

// ---- Phase 6 seed (mock): condition plans/measurements, chunks, content versions ----
// Bắt đầu trống để không phá luồng Phase 4A (nutrition_profiles.conditions vẫn là nguồn chính).
export const conditionPlans: D.ConditionPlan[] = []
export const conditionMeasurements: D.ConditionMeasurement[] = []
export const knowledgeChunks: D.KnowledgeChunk[] = []
export const contentVersions: D.ContentVersion[] = []
export const dailyIntakeLogs: DailyIntakeLog[] = []
export const intakeItems: DailyIntakeItem[] = []

// ---- Phase 7: Hồ sơ khám (medical visits) — seed demo PER-USER (private_owner_id = MOM) ----
export const MEDICAL_VISIT_IDS = {
  v12: '50000000-0000-0000-0000-000000000001',
  v16: '50000000-0000-0000-0000-000000000002',
  v20: '50000000-0000-0000-0000-000000000003',
} as const

/** Ảnh demo 1×1 PNG (data URL) — UI sẽ hiển thị/upload ảnh thật; seed chỉ cần đủ hình dạng. */
const DEMO_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

export const medicalVisits: MedicalVisit[] = [
  {
    id: MEDICAL_VISIT_IDS.v12,
    family_id: FAMILY_ID,
    private_owner_id: MOM_ID,
    visit_date: '2026-06-08',
    clinic: 'Bệnh viện Phụ sản Hà Nội',
    reason: 'Khám thai định kỳ tuần 12 — siêu âm',
    notes: 'Đo độ mờ da gáy (NT), nhịp tim thai. Kết quả trong giới hạn bình thường.',
    child_id: null,
    pregnancy_id: PREG_ID,
    created_at: ts('2026-06-08T09:00:00+07:00'),
    updated_at: ts('2026-06-08T09:00:00+07:00'),
  },
  {
    id: MEDICAL_VISIT_IDS.v16,
    family_id: FAMILY_ID,
    private_owner_id: MOM_ID,
    visit_date: '2026-07-06',
    clinic: 'Bệnh viện Phụ sản Hà Nội',
    reason: 'Xét nghiệm sàng lọc trước sinh tuần 16',
    notes: 'Xét nghiệm máu sàng lọc Trisomy — nguy cơ thấp. Hẹn khám lại tuần 20.',
    child_id: null,
    pregnancy_id: PREG_ID,
    created_at: ts('2026-07-06T09:00:00+07:00'),
    updated_at: ts('2026-07-06T09:00:00+07:00'),
  },
  {
    id: MEDICAL_VISIT_IDS.v20,
    family_id: FAMILY_ID,
    private_owner_id: MOM_ID,
    visit_date: '2026-08-03',
    clinic: 'Bệnh viện Phụ sản Hà Nội',
    reason: 'Khám thai định kỳ tuần 20',
    notes: 'Đo chiều cao tử cung, nghe tim thai. Tư vấn mốc siêu âm hình thái tuần 21.',
    child_id: null,
    pregnancy_id: PREG_ID,
    created_at: ts('2026-08-03T09:00:00+07:00'),
    updated_at: ts('2026-08-03T09:00:00+07:00'),
  },
]

export const visitDocuments: VisitDocument[] = [
  {
    id: '51000000-0000-0000-0000-000000000001',
    family_id: FAMILY_ID,
    visit_id: MEDICAL_VISIT_IDS.v12,
    private_owner_id: MOM_ID,
    filename: 'sieu-am-12-tuan.jpg',
    mime: 'image/jpeg',
    image_data: DEMO_IMG,
    ocr_text: 'Siêu âm thai 12 tuần: NT 1.2 mm, tim thai 156 lần/phút, CRL 54 mm.',
    created_at: ts('2026-06-08T10:00:00+07:00'),
  },
  {
    id: '51000000-0000-0000-0000-000000000002',
    family_id: FAMILY_ID,
    visit_id: MEDICAL_VISIT_IDS.v16,
    private_owner_id: MOM_ID,
    filename: 'xet-nghiem-sang-loc-16-tuan.jpg',
    mime: 'image/jpeg',
    image_data: DEMO_IMG,
    ocr_text: 'Sàng lọc Trisomy 21: nguy cơ thấp. beta-hCG, PAPP-A trong giới hạn.',
    created_at: ts('2026-07-06T11:00:00+07:00'),
  },
]

// ---------------------------------------------------------------------------
// Impl DataApi — mock
// ---------------------------------------------------------------------------

/** Dinh dưỡng theo tuần (first/second/third) — export để local.ts dùng chung. */
export function computeNutritionFocus(week: number): NutritionFocus {
  const byNutrient = (name: string, role: string, foods: string[], substitutes: string[], safetyNotes?: string[]): NutrientFocus => ({
    name,
    role,
    foods,
    substitutes,
    safetyNotes,
  })
  const first: NutrientFocus[] = [
    byNutrient('Acid folic', 'Phòng dị tật ống thần kinh', ['Rau xanh đậm (cải bó xôi, rau ngót)', 'Đậu đỗ', 'Cam, chuối'], ['Viên acid folic 400µg theo chỉ định'], []),
    byNutrient('Sắt', 'Tạo máu cho mẹ và bé', ['Thịt đỏ', 'Trứng', 'Rau ngót, rau dền'], ['Các loại đậu, hạt'], ['Uống sắt cùng vitamin C']),
    byNutrient('Protein', 'Xây dựng tế bào', ['Thịt, cá, trứng, sữa', 'Đậu phụ'], ['Các loại hạt'], []),
    byNutrient('Vitamin B6', 'Giảm buồn nôn', ['Chuối, khoai tây', 'Gà, cá', 'Hạt hướng dương'], ['Bổ sung theo chỉ định bác sĩ'], []),
  ]
  const second: NutrientFocus[] = [
    byNutrient('Sắt', 'Tạo máu, phòng thiếu máu cho mẹ và bé', ['Thịt bò, thịt lợn nạc', 'Trứng gà', 'Rau ngót, rau dền', 'Các loại đậu'], ['Tim heo, gan gà (hạn chế)', 'Đậu hũ non'], ['Uống sắt cùng vitamin C để hấp thu tốt', 'Không uống chung với canxi']),
    byNutrient('Canxi', 'Phát triển xương và răng của bé', ['Sữa, sữa chua', 'Cá nhỏ ăn cả xương', 'Cải xanh, súp lơ xanh'], ['Sữa đậu nành bổ sung canxi', 'Vừng, mè đen'], ['Uống canxi riêng thời điểm khác sắt']),
    byNutrient('DHA', 'Phát triển não bộ và thị giác', ['Cá hồi, cá thu, cá basa', 'Trứng gà', 'Hạt óc chó'], ['Hạt chia, hạt lanh', 'Viên DHA theo chỉ định'], ['Cá nấu chín kỹ, hạn chế cá lớn nhiều thủy ngân']),
    byNutrient('Protein', 'Xây dựng tế bào cho bé', ['Thịt gà, thịt bò', 'Trứng, sữa', 'Đậu phụ, đậu đỗ'], ['Cá, tôm', 'Các loại hạt'], []),
  ]
  const third: NutrientFocus[] = [
    byNutrient('Canxi', 'Củng cố xương bé, chuẩn bị sữa mẹ', ['Sữa, sữa chua, phô mai', 'Cá nhỏ ăn cả xương', 'Vừng'], ['Sữa đậu nành bổ sung canxi'], ['Tách riêng thời điểm uống với sắt']),
    byNutrient('Sắt', 'Dự trữ cho cuộc sinh', ['Thịt đỏ, trứng', 'Rau ngót, rau dền', 'Đậu đỗ'], ['Tim, gan (hạn chế)'], ['Không uống chung với sữa, trà']),
    byNutrient('DHA', 'Hoàn thiện não bộ bé', ['Cá béo', 'Trứng gà', 'Hạt óc chó'], ['Viên DHA theo chỉ định'], ['Cá nấu chín kỹ']),
    byNutrient('Protein', 'Hỗ trợ tăng cân hợp lý cho bé', ['Thịt, cá, trứng, sữa', 'Đậu phụ, đậu đỗ'], ['Các loại hạt'], []),
  ]
  const nutrients = trimesterOf(week) === 'first' ? first : trimesterOf(week) === 'second' ? second : third
  return { week, nutrients }
}

const mockImpl = {
  // ---- Thai kỳ & sức khỏe ----
  async getPregnancy(): Promise<D.Pregnancy | null> {
    return pregnancies.find((p) => p.status === 'ongoing') ?? null
  },

  async getFetuses(): Promise<D.Fetus[]> {
    return fetuses
  },

  async getWeekInfo(week: number): Promise<WeekInfo> {
    const clamped = Math.min(41, Math.max(0, week))
    return { ...WEEKS[clamped]! }
  },

  async getDashboard(): Promise<DashboardSummary> {
    const upcoming = appointments.filter((a) => a.scheduled_at > DEMO_NOW).slice(0, 2)
    const latestWeights = measurements.filter((m) => m.type === 'weight').slice(-2)
    const latestBp = measurements.filter((m) => m.type === 'blood_pressure').slice(-1)
    const ongoing = symptoms.filter((s) => s.ended_at === null)
    // Tuần/EDD/ngày còn lại derive từ thai kỳ ongoing — updatePregnancy (chọn tuần thai)
    // đổi LMP/EDD là dashboard + AI context thấy ngay. Seed vẫn ra 20 / 2026-12-21 / 140.
    const preg = pregnancies.find((p) => p.status === 'ongoing')
    const week = preg?.lmp ? weekFromLmp(preg.lmp) : CURRENT_WEEK
    const dueDate = preg?.edd ?? EDD
    const daysLeft = preg?.edd ? Math.round((Date.parse(preg.edd) - Date.parse(TODAY)) / DAY_MS) : DAYS_LEFT
    return {
      week,
      trimester: trimesterOf(week),
      dueDate,
      daysLeft,
      taskCount: tasks.length,
      tasksDone: tasks.filter((t) => t.status === 'done').length,
      mealCountToday: meals.filter((m) => m.logged_at.startsWith(REAL_TODAY)).length,
      waterLoggedMl,
      waterGoalMl: 2000,
      upcomingAppointments: upcoming,
      latestMeasurements: [...latestWeights, ...latestBp],
      recentSymptoms: visible(ongoing),
      dailyInsight: 'Bé đang lớn nhanh — tuần này mẹ chú ý canxi và sắt. Thai máy đều đặn là dấu hiệu tốt.',
    }
  },

  async getMeasurements(): Promise<D.MaternalMeasurement[]> {
    return visible(measurements)
  },

  async getSymptoms(): Promise<D.SymptomReport[]> {
    return visible(symptoms)
  },

  async getFetalMovementLogs(): Promise<D.FetalMovementLog[]> {
    return visible(fetalMovementLogs)
  },

  async getAppointments(): Promise<D.Appointment[]> {
    return visible(appointments)
  },

  async getDocuments(): Promise<D.DocumentRecord[]> {
    return visible(documents)
  },

  // ---- Dinh dưỡng ----
  async getMeals(): Promise<D.MealEntry[]> {
    return visible(meals)
  },

  async getMealsByDate(date: string): Promise<D.MealEntry[]> {
    return visible(meals.filter((m) => m.logged_at.startsWith(date)))
  },

  async getNutritionFocus(week: number): Promise<NutritionFocus> {
    return computeNutritionFocus(week)
  },

  async getWaterCaffeine(): Promise<WaterCaffeine> {
    return { waterGoalMl: 2000, waterLoggedMl, caffeineLimitMg: 200, caffeineLoggedMg: 0 }
  },

  async getSupplements(): Promise<D.SupplementPlan[]> {
    return visible(supplements)
  },

  async getSavedMeals(): Promise<D.SavedMeal[]> {
    return visible(savedMeals)
  },

  /** Hồ sơ dinh dưỡng của thai kỳ hiện tại — chứa `conditions` typed + `doctor_instructions`. */
  async getNutritionProfile(): Promise<D.NutritionProfile | null> {
    return visible(nutritionProfiles).find((n) => n.pregnancy_id === PREG_ID) ?? null
  },

  /** Khai báo/bỏ tình trạng + ghi chú bác sĩ. Tạo hồ sơ nếu chưa có (empty state → khai báo). */
  async updateNutritionProfile(input: NutritionProfileInput): Promise<D.NutritionProfile> {
    const now = new Date().toISOString()
    let np = nutritionProfiles.find((n) => n.pregnancy_id === PREG_ID)
    if (!np) {
      np = {
        id: uid(),
        family_id: FAMILY_ID,
        private_owner_id: null,
        created_at: now,
        updated_at: now,
        pregnancy_id: PREG_ID,
        dietary_pattern: 'omnivore',
        allergies: [],
        dislikes: [],
        budget_per_week: null,
        cook_time_min: null,
        pre_pregnancy_weight_kg: null,
        conditions: [],
        doctor_instructions: null,
      }
      nutritionProfiles.push(np)
    }
    if (input.conditions !== undefined) np.conditions = input.conditions
    if (input.doctor_instructions !== undefined) np.doctor_instructions = input.doctor_instructions
    np.updated_at = now
    return np
  },

  // ---- Sau sinh & bé ----
  async getBirthRecord(): Promise<D.BirthRecord | null> {
    return birthRecord
  },

  async getChildren(): Promise<D.Child[]> {
    return children
  },

  async getFeedings(childId: string): Promise<D.FeedingLog[]> {
    return visible(feedings.filter((f) => f.child_id === childId))
  },

  async getSleeps(childId: string): Promise<D.SleepLog[]> {
    return visible(sleeps.filter((s) => s.child_id === childId))
  },

  async getDiapers(childId: string): Promise<D.DiaperLog[]> {
    return visible(diapers.filter((d) => d.child_id === childId))
  },

  async getGrowth(childId: string): Promise<GrowthPoint[]> {
    return growthByChild[childId] ?? []
  },

  async getMilestones(childId: string): Promise<D.Milestone[]> {
    return visible(milestones.filter((m) => m.child_id === childId))
  },

  async getVaccinations(childId: string): Promise<D.Vaccination[]> {
    return visible(vaccinations.filter((v) => v.child_id === childId))
  },

  // ---- Phase 7: Sau sinh — mutation (dữ liệu gia đình, shared) ----
  async addBirthRecord(input: BirthRecordInput): Promise<D.BirthRecord> {
    const now = new Date().toISOString()
    const created: D.BirthRecord = {
      id: BIRTH_ID,
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      pregnancy_id: input.pregnancy_id ?? PREG_PREV_ID,
      birth_date: input.birth_date,
      birth_type: input.birth_type,
      hospital: input.hospital ?? null,
      duration_hours: input.duration_hours ?? null,
      complications: input.complications ?? [],
      notes: input.notes ?? null,
    }
    // getBirthRecord trả singleton `birthRecord` → ghi đè tại chỗ để thấy ngay.
    Object.assign(birthRecord, created)
    return { ...birthRecord }
  },

  async updateBirthRecord(id: string, input: Partial<BirthRecordInput>): Promise<D.BirthRecord> {
    if (id !== birthRecord.id) throw new Error('Không tìm thấy bản ghi sinh')
    // KHÔNG để trống các trường bắt buộc hiện có (birth_date/birth_type).
    if (input.birth_date !== undefined && !input.birth_date) throw new Error('birth_date không được để trống')
    if (input.birth_type !== undefined && !input.birth_type) throw new Error('birth_type không được để trống')
    if (input.pregnancy_id !== undefined) birthRecord.pregnancy_id = input.pregnancy_id
    if (input.birth_date !== undefined) birthRecord.birth_date = input.birth_date
    if (input.birth_type !== undefined) birthRecord.birth_type = input.birth_type
    if (input.hospital !== undefined) birthRecord.hospital = input.hospital
    if (input.duration_hours !== undefined) birthRecord.duration_hours = input.duration_hours
    if (input.complications !== undefined) birthRecord.complications = input.complications
    if (input.notes !== undefined) birthRecord.notes = input.notes
    birthRecord.updated_at = new Date().toISOString()
    return { ...birthRecord }
  },

  async addChild(input: ChildInput): Promise<D.Child> {
    const now = new Date().toISOString()
    const created: D.Child = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      birth_record_id: input.birth_record_id ?? null,
      name: input.name,
      sex: input.sex,
      birth_date: input.birth_date,
      birth_weight_kg: input.birth_weight_kg ?? null,
      birth_length_cm: input.birth_length_cm ?? null,
      head_circumference_cm: input.head_circumference_cm ?? null,
      blood_type: input.blood_type ?? null,
      allergies: input.allergies ?? [],
    }
    children.unshift(created)
    return created
  },

  async addGrowthPoint(childId: string, input: GrowthPointInput): Promise<GrowthPoint> {
    const created: GrowthPoint = {
      date: input.date,
      weightKg: input.weightKg ?? null,
      heightCm: input.heightCm ?? null,
      headCm: input.headCm ?? null,
    }
    ;(growthByChild[childId] ??= []).push(created)
    return created
  },

  async addVaccination(childId: string, input: VaccinationInput): Promise<D.Vaccination> {
    const now = new Date().toISOString()
    const created: D.Vaccination = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      child_id: childId,
      vaccine_name: input.vaccine_name,
      dose_number: input.dose_number ?? null,
      scheduled_date: input.scheduled_date ?? input.administered_date ?? REAL_TODAY,
      administered_date: input.administered_date ?? null,
      location: input.location ?? null,
      notes: input.notes ?? null,
    }
    vaccinations.unshift(created)
    return created
  },

  // ---- Điều phối gia đình ----
  async getTasks(): Promise<D.Task[]> {
    return visible(tasks)
  },

  async getShopping(): Promise<D.ShoppingItem[]> {
    return visible(shopping)
  },

  async getBudget(): Promise<D.BudgetEntry[]> {
    return visible(budget)
  },

  async getReminders(): Promise<D.Reminder[]> {
    return visible(reminders)
  },

  /** Tạo nhắc nhở đo theo lịch bác sĩ chỉ định — mock lưu cùng mảng `reminders` (nối hệ reminder có sẵn). */
  async addReminder(input: ReminderInput): Promise<D.Reminder> {
    const now = new Date().toISOString()
    const created: D.Reminder = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      title: input.title,
      scheduled_at: input.scheduled_at,
      frequency: input.frequency,
      channels: input.channels?.length ? input.channels : ['in_app'],
      active: true,
      last_sent_at: null,
      payload: input.payload ?? null,
    }
    reminders.unshift(created)
    return created
  },

  /** Tắt/bật nhắc nhở (ngừng theo dõi tình trạng → active=false, giữ lịch sử). */
  async updateReminder(id: string, input: { active?: boolean }): Promise<D.Reminder> {
    const r = reminders.find((x) => x.id === id)
    if (!r) throw new Error('Không tìm thấy nhắc nhở')
    if (input.active !== undefined) r.active = input.active
    r.updated_at = new Date().toISOString()
    return r
  },

  async getNotificationPreferences(): Promise<D.NotificationPreference[]> {
    return visible(notificationPrefs)
  },

  // ---- Gia đình (Phase 4B) — mock: active user sync từ client ----
  async getFamilyMembers() {
    return getActiveUser()?.members ?? []
  },

  async getFamilyCode() {
    return getActiveUser()?.family_code ?? null
  },

  async setNotificationPreference(input: { group: D.NotificationGroup; channel: D.NotificationChannel; enabled: boolean }): Promise<void> {
    const existing = notificationPrefs.find((p) => p.group === input.group && p.channel === input.channel)
    if (existing) existing.enabled = input.enabled
    else {
      const now = new Date().toISOString()
      notificationPrefs.push({
        id: uid(),
        family_id: FAMILY_ID,
        private_owner_id: null,
        created_at: now,
        updated_at: now,
        group: input.group,
        channel: input.channel,
        enabled: input.enabled,
        quiet_start: null,
        quiet_end: null,
      })
    }
  },

  // ---- Nội dung & học cùng con ----
  async getWeeklyGuides(): Promise<D.WeeklyGuide[]> {
    return visible(weeklyGuides)
  },

  async getArticles(): Promise<D.Article[]> {
    return visible(articles)
  },

  async getQuizSets(): Promise<D.QuizSet[]> {
    return visible([...libraryStore.listQuizSets(), ...quizSets])
  },

  async getQuizQuestions(quizSetId: string): Promise<D.QuizQuestion[]> {
    return visible([
      ...libraryStore.listQuizQuestions().filter((q) => q.quiz_set_id === quizSetId),
      ...quizQuestions.filter((q) => q.quiz_set_id === quizSetId),
    ])
  },

  async getKnowledgeSources(): Promise<D.KnowledgeSource[]> {
    return visible([...libraryStore.listSources(), ...knowledgeSources])
  },

  async getChatMessages(sessionId: string): Promise<D.ChatMessage[]> {
    return visible(chatMessages.filter((c) => c.session_id === sessionId))
  },

  // ---- Mutation (mock: lưu vào mảng trong memory) ----
  async addMeal(entry: MealEntryInput): Promise<D.MealEntry> {
    const now = new Date().toISOString()
    const created: D.MealEntry = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      meal_type: entry.meal_type,
      name: entry.name,
      logged_at: entry.logged_at,
      calories: entry.calories ?? null,
      note: entry.note ?? null,
      source: 'manual',
    }
    meals.unshift(created)
    return created
  },

  async addMealPhoto(input: MealPhotoInput): Promise<D.MealPhoto> {
    const now = new Date().toISOString()
    const created: D.MealPhoto = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      meal_id: input.meal_id,
      // storage_path (mock: "uploads/x.jpg") → file_url browser truy cập được "/uploads/x.jpg".
      file_url: input.storage_path
        ? `/${input.storage_path.replace(/^\/+/, '')}`
        : `/uploads/${input.file_name}`,
      ai_suggested_name: null,
      confirmed: true,
      confirmed_by: null,
    }
    mealPhotos.unshift(created)
    return created
  },

  /** Đồng bộ HealthKit (iOS): dedupe source='healthkit' + type + taken_at, không ghi đè manual. */
  async upsertHealthMetric(rows: HealthMetricInput[]): Promise<{ created: D.MaternalMeasurement[]; duplicates: number }> {
    const now = new Date().toISOString()
    const existingKeys = new Set(
      measurements.filter((m) => m.source === 'healthkit').map((m) => healthMetricKey(m)),
    )
    const { kept, duplicates } = dedupeHealthMetrics(rows, existingKeys)
    const created: D.MaternalMeasurement[] = kept.map((r) => ({
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      pregnancy_id: PREG_ID,
      type: r.type,
      value: r.value,
      unit: r.unit,
      diastolic: r.diastolic ?? null,
      taken_at: r.taken_at,
      note: null,
      source: 'healthkit',
    }))
    measurements.push(...created)
    return { created, duplicates }
  },

  async addMeasurement(m: MeasurementInput): Promise<D.MaternalMeasurement> {
    const now = new Date().toISOString()
    const created: D.MaternalMeasurement = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      pregnancy_id: PREG_ID,
      type: m.type,
      value: m.value,
      unit: m.unit,
      diastolic: m.diastolic ?? null,
      taken_at: m.taken_at,
      note: m.note ?? null,
      source: 'manual',
    }
    measurements.push(created)
    return created
  },

  async addSymptom(s: SymptomReportInput): Promise<D.SymptomReport> {
    const now = new Date().toISOString()
    const created: D.SymptomReport = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: s.private ? (getActiveUser()?.user_id ?? null) : null,
      created_at: now,
      updated_at: now,
      pregnancy_id: PREG_ID,
      symptom: s.symptom,
      severity: s.severity,
      started_at: s.started_at,
      ended_at: null,
      note: s.note ?? null,
      source: 'manual',
    }
    symptoms.unshift(created)
    return created
  },

  /** Import hàng loạt triệu chứng (cùng store addSymptom — AI/dashboard đọc qua getSymptoms/getDashboard). */
  async importSymptoms(items: SymptomReportInput[]): Promise<{ created: number }> {
    const now = new Date().toISOString()
    const ownerId = getActiveUser()?.user_id ?? null
    for (const s of items) {
      symptoms.unshift({
        id: uid(),
        family_id: FAMILY_ID,
        private_owner_id: ownerId,
        created_at: now,
        updated_at: now,
        pregnancy_id: PREG_ID,
        symptom: s.symptom,
        severity: s.severity,
        started_at: s.started_at,
        ended_at: null,
        note: s.note ?? null,
        source: 'manual',
      })
    }
    return { created: items.length }
  },

  async addTask(t: TaskInput): Promise<D.Task> {
    const now = new Date().toISOString()
    const created: D.Task = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      title: t.title,
      description: null,
      status: 'todo',
      due_date: t.due_date ?? null,
      assignee_id: t.assignee_id ?? null,
      completed_at: null,
      reminder_id: null,
    }
    tasks.push(created)
    return created
  },

  async toggleTask(id: string, done: boolean): Promise<void> {
    const task = tasks.find((t) => t.id === id)
    if (task) {
      task.status = done ? 'done' : 'todo'
      task.completed_at = done ? new Date().toISOString() : null
      task.updated_at = new Date().toISOString()
    }
  },

  // ---- Mutation mở rộng (đa thai, bé, nước, mua sắm, mốc, quiz) ----
  async startPregnancy(input: { lmp: string; edd?: string | null; fetalCount?: number }): Promise<D.Pregnancy> {
    const now = new Date().toISOString()
    const created: D.Pregnancy = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      lmp: input.lmp,
      edd: input.edd ?? eddFromLmp(input.lmp),
      status: 'ongoing',
      notes: null,
      source: 'manual',
    }
    pregnancies.unshift(created)
    // Đa thai: fetalCount 1–3 → tự tạo N fetus (birth_order 1..N, name A/B/C).
    const count = Math.min(3, Math.max(1, input.fetalCount ?? 1))
    for (let i = 1; i <= count; i++) {
      fetuses.push({
        id: uid(),
        family_id: FAMILY_ID,
        private_owner_id: null,
        created_at: now,
        updated_at: now,
        pregnancy_id: created.id,
        name: count > 1 ? String.fromCharCode(64 + i) : null,
        sex: 'unknown',
        birth_order: i,
        notes: null,
      })
    }
    return created
  },

  /** Cập nhật thai kỳ hiện tại (chọn tuần thai). Chỉ nhập LMP → tái tính EDD; chỉ EDD → tái tính LMP (Naegele). */
  async updatePregnancy(input: { lmp?: string; edd?: string; notes?: string }): Promise<D.Pregnancy> {
    const p = pregnancies.find((pr) => pr.status === 'ongoing')
    if (!p) throw new Error('Không tìm thấy thai kỳ hiện tại để cập nhật')
    if (input.lmp && input.edd && input.edd <= input.lmp) {
      throw new Error('Ngày dự sinh (EDD) phải sau ngày đầu kỳ kinh cuối (LMP)')
    }
    if (input.lmp) p.lmp = input.lmp
    if (input.edd) p.edd = input.edd
    if (input.lmp && !input.edd) p.edd = eddFromLmp(input.lmp)
    if (input.edd && !input.lmp) p.lmp = lmpFromEdd(input.edd)
    if (input.notes !== undefined) p.notes = input.notes
    p.updated_at = new Date().toISOString()
    return p
  },

  /** Cập nhật hồ sơ sức khỏe cá nhân (bản ghi HEALTH_ID có sẵn trong seed). */
  async updateHealthProfile(input: {
    height_cm?: number
    pre_pregnancy_weight_kg?: number
    blood_type?: string
    allergies?: string[]
    preexisting_conditions?: string[]
    notes?: string
  }): Promise<D.HealthProfile> {
    const hp = healthProfiles.find((h) => h.id === HEALTH_ID)
    if (!hp) throw new Error('Không tìm thấy hồ sơ sức khỏe')
    if (input.height_cm !== undefined) hp.height_cm = input.height_cm
    if (input.pre_pregnancy_weight_kg !== undefined) hp.pre_pregnancy_weight_kg = input.pre_pregnancy_weight_kg
    if (input.blood_type !== undefined) hp.blood_type = input.blood_type as D.BloodType
    if (input.allergies !== undefined) hp.allergies = input.allergies
    if (input.preexisting_conditions !== undefined) hp.preexisting_conditions = input.preexisting_conditions
    if (input.notes !== undefined) hp.notes = input.notes
    hp.updated_at = new Date().toISOString()
    return hp
  },

  async addFeeding(
    childId: string,
    input: { method: D.FeedingMethod; amount_ml?: number | null; started_at: string; duration_min?: number | null; side?: D.FeedingSide | null; note?: string },
  ): Promise<D.FeedingLog> {
    const now = new Date().toISOString()
    const created: D.FeedingLog = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      child_id: childId,
      method: input.method,
      side: input.side ?? null,
      amount_ml: input.amount_ml ?? null,
      started_at: input.started_at,
      duration_min: input.duration_min ?? null,
      note: input.note ?? null,
      source: 'manual',
    }
    feedings.unshift(created)
    return created
  },

  async addSleep(
    childId: string,
    input: { started_at: string; ended_at?: string | null; place: D.SleepPlace; note?: string },
  ): Promise<D.SleepLog> {
    const now = new Date().toISOString()
    const created: D.SleepLog = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      child_id: childId,
      started_at: input.started_at,
      ended_at: input.ended_at ?? null,
      place: input.place,
      note: input.note ?? null,
    }
    sleeps.unshift(created)
    return created
  },

  async addDiaper(
    childId: string,
    input: { changed_at: string; type: D.DiaperType; note?: string },
  ): Promise<D.DiaperLog> {
    const now = new Date().toISOString()
    const created: D.DiaperLog = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      child_id: childId,
      changed_at: input.changed_at,
      type: input.type,
      note: input.note ?? null,
    }
    diapers.unshift(created)
    return created
  },

  async addFetalMovement(
    input: { felt_at: string; feeling: D.FetalMovementFeeling; duration_min?: number | null; note?: string },
  ): Promise<D.FetalMovementLog> {
    const now = new Date().toISOString()
    const created: D.FetalMovementLog = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: getActiveUser()?.user_id ?? null,
      created_at: now,
      updated_at: now,
      pregnancy_id: PREG_ID,
      felt_at: input.felt_at,
      feeling: input.feeling,
      duration_min: input.duration_min ?? null,
      note: input.note ?? null,
    }
    fetalMovementLogs.unshift(created)
    return created
  },

  async addWater(input: { logged_at: string; amount_ml: number }): Promise<void> {
    waterLoggedMl += input.amount_ml
  },

  async addShoppingItem(
    input: { name: string; category?: string | null; quantity?: number | null; unit?: string | null; estimated_price?: number | null },
  ): Promise<D.ShoppingItem> {
    const now = new Date().toISOString()
    const created: D.ShoppingItem = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      name: input.name,
      category: input.category ?? null,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      estimated_price: input.estimated_price ?? null,
      actual_price: null,
      status: 'pending',
      note: null,
    }
    shopping.unshift(created)
    return created
  },

  async toggleShopping(id: string, done: boolean): Promise<void> {
    const item = shopping.find((s) => s.id === id)
    if (item) {
      item.status = done ? 'bought' : 'pending'
      item.updated_at = new Date().toISOString()
    }
  },

  async deleteShoppingItem(id: string): Promise<void> {
    const idx = shopping.findIndex((s) => s.id === id)
    if (idx < 0) throw new Error('Không tìm thấy món cần mua')
    shopping.splice(idx, 1)
  },

  async updateShoppingItem(id: string, input: ShoppingItemUpdateInput): Promise<D.ShoppingItem> {
    const item = shopping.find((s) => s.id === id)
    if (!item) throw new Error('Không tìm thấy món cần mua')
    if (input.name !== undefined && !input.name) throw new Error('name không được để trống')
    if (input.name !== undefined) item.name = input.name
    if (input.category !== undefined) item.category = input.category
    if (input.estimated_price !== undefined) item.estimated_price = input.estimated_price
    if (input.note !== undefined) item.note = input.note
    if (input.done !== undefined) item.status = input.done ? 'bought' : 'pending'
    item.updated_at = new Date().toISOString()
    return { ...item }
  },

  async addMilestone(
    childId: string,
    input: { name: string; stage?: string | null; status: D.MilestoneStatus; achieved_at?: string | null; note?: string },
  ): Promise<D.Milestone> {
    const now = new Date().toISOString()
    const created: D.Milestone = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      child_id: childId,
      name: input.name,
      stage: input.stage ?? null,
      achieved_at: input.achieved_at ?? null,
      status: input.status,
      note: input.note ?? null,
    }
    milestones.unshift(created)
    return created
  },

  // ---- Phase 6: Lịch khám (CRUD) ----
  async addAppointment(input: AppointmentInput): Promise<D.Appointment> {
    const now = new Date().toISOString()
    const created: D.Appointment = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      pregnancy_id: PREG_ID,
      type: input.type,
      scheduled_at: input.scheduled_at,
      location: input.location ?? null,
      doctor: input.doctor ?? null,
      summary_before: input.summary_before ?? null,
      outcome: input.outcome ?? null,
      followup_at: input.followup_at ?? null,
      notes: input.notes ?? null,
      prescription: input.prescription ?? null,
      tasks_after: input.tasks_after ?? null,
    }
    appointments.push(created)
    return created
  },

  async updateAppointment(id: string, input: AppointmentUpdateInput): Promise<D.Appointment> {
    const i = appointments.findIndex((a) => a.id === id)
    if (i < 0) throw new Error('Không tìm thấy lịch khám')
    const merged: D.Appointment = { ...appointments[i]!, ...input, id, updated_at: new Date().toISOString() }
    appointments[i] = merged
    return merged
  },

  // ---- Phase 6: Món → mua sắm ----
  async addMealToShopping(meal: D.SavedMeal): Promise<D.ShoppingItem[]> {
    const now = new Date().toISOString()
    const created: D.ShoppingItem[] = (meal.ingredients ?? []).map((ingredient) => ({
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      name: ingredient.trim(),
      category: 'Nguyên liệu',
      quantity: 1,
      unit: null,
      estimated_price: null,
      actual_price: null,
      status: 'pending',
      note: `Món: ${meal.name}`,
    }))
    for (const item of created) shopping.push(item)
    return created
  },

  // ---- Phase 6: Ngân sách ----
  async addBudget(input: BudgetInput): Promise<D.BudgetEntry> {
    const now = new Date().toISOString()
    const created: D.BudgetEntry = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      title: input.title,
      amount: input.amount,
      type: input.type,
      category: input.category ?? null,
      occurred_at: input.occurred_at,
      note: input.note ?? null,
    }
    budget.push(created)
    return created
  },

  async updateBudget(id: string, input: BudgetUpdateInput): Promise<D.BudgetEntry> {
    const i = budget.findIndex((b) => b.id === id)
    if (i < 0) throw new Error('Không tìm thấy khoản thu/chi')
    const merged: D.BudgetEntry = { ...budget[i]!, ...input, id, updated_at: new Date().toISOString() }
    budget[i] = merged
    return merged
  },

  // ---- Phase 6: Đa thai ----
  async addFetus(input: FetusInput): Promise<D.Fetus> {
    const now = new Date().toISOString()
    const order = input.birth_order ?? Math.max(0, ...fetuses.map((f) => f.birth_order)) + 1
    const created: D.Fetus = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      pregnancy_id: PREG_ID,
      name: input.name ?? (order > 1 ? String.fromCharCode(64 + order) : null),
      sex: input.sex ?? 'unknown',
      birth_order: order,
      notes: input.notes ?? null,
    }
    fetuses.push(created)
    return created
  },

  // ---- Phase 6: Condition plans / measurements ----
  async getConditionPlans(): Promise<D.ConditionPlan[]> {
    return visible(conditionPlans)
  },

  async addConditionPlan(input: ConditionPlanInput): Promise<D.ConditionPlan> {
    const now = new Date().toISOString()
    const created: D.ConditionPlan = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      condition_type: input.condition_type,
      plan_text: input.plan_text,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      doctor_notes: input.doctor_notes ?? null,
    }
    conditionPlans.push(created)
    return created
  },

  async getConditionMeasurements(): Promise<D.ConditionMeasurement[]> {
    return visible(conditionMeasurements)
  },

  async addConditionMeasurement(input: ConditionMeasurementInput): Promise<D.ConditionMeasurement> {
    const now = new Date().toISOString()
    const created: D.ConditionMeasurement = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      condition_plan_id: input.condition_plan_id,
      type: input.type,
      value: input.value,
      unit: input.unit,
      measured_at: input.measured_at,
      note: input.note ?? null,
    }
    conditionMeasurements.push(created)
    return created
  },

  // ---- Phase 6: Knowledge retrieval ----
  async searchKnowledgeChunks(query: string): Promise<D.KnowledgeChunk[]> {
    const q = query.trim().toLocaleLowerCase('vi')
    if (!q) return []
    return knowledgeChunks
      .filter(
        (c) =>
          c.content.toLocaleLowerCase('vi').includes(q) ||
          c.citation.toLocaleLowerCase('vi').includes(q),
      )
      .sort((a, b) => a.position - b.position)
      .slice(0, 50)
  },

  async saveKnowledgeChunks(sourceId: string, chunks: KnowledgeChunkInput[]): Promise<void> {
    const now = new Date().toISOString()
    for (const c of chunks) {
      knowledgeChunks.push({
        id: uid(),
        family_id: FAMILY_ID,
        private_owner_id: null,
        knowledge_source_id: sourceId,
        content: c.content,
        citation: c.citation,
        position: c.position,
        embedding: c.embedding ?? null,
        created_at: now,
        updated_at: now,
      })
    }
  },

  // ---- Phase 6: Content versions ----
  async getContentVersions(
    contentType: D.ContentVersion['content_type'],
    contentId: string,
  ): Promise<D.ContentVersion[]> {
    return visible(contentVersions.filter((v) => v.content_type === contentType && v.content_id === contentId))
  },

  // ---- Phase 6J: Theo dõi dinh dưỡng hằng ngày ----
  async addDailyIntake(input: DailyIntakeInput): Promise<DailyIntakeLog> {
    const now = new Date().toISOString()
    const ownerId = getActiveUser()?.user_id ?? null
    const log: DailyIntakeLog = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: ownerId, // per-user — chỉ chủ sở hữu thấy (Phase 4B)
      date: input.date,
      note: input.note ?? null,
      items: [],
      created_at: now,
      updated_at: now,
    }
    const items: DailyIntakeItem[] = input.items.map((it) => ({
      id: uid(),
      family_id: FAMILY_ID,
      log_id: log.id,
      kind: it.kind,
      name: it.name,
      ref_id: it.ref_id ?? null,
      amount_g: it.amount_g ?? null,
      qty: it.qty ?? null,
      dose_mg: it.dose_mg ?? null,
      pills: it.pills ?? null,
      nutrients: it.nutrients ?? {},
      estimated: it.estimated ?? false,
      note: it.note ?? null,
      created_at: now,
    }))
    dailyIntakeLogs.push(log)
    for (const item of items) intakeItems.push(item)
    return { ...log, items }
  },

  async getDailyIntake(id: string): Promise<DailyIntakeLog | null> {
    const log = dailyIntakeLogs.find((l) => l.id === id)
    if (!log) return null
    const au = getActiveUser()
    if (au && log.private_owner_id !== null && log.private_owner_id !== au.user_id) return null
    const items = intakeItems.filter((i) => i.log_id === id)
    return { ...log, items }
  },

  async listIntakeHistory(limit = 30): Promise<DailyIntakeLog[]> {
    const logs = visible(dailyIntakeLogs)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit)
    return logs.map((log) => ({ ...log, items: intakeItems.filter((i) => i.log_id === log.id) }))
  },

  async getNutrientSummary(period: { from: string; to: string }): Promise<NutrientSummary> {
    const logs = visible(dailyIntakeLogs)
      .filter((l) => l.date >= period.from && l.date <= period.to)
      .sort((a, b) => a.date.localeCompare(b.date))
    const days = logs.map((log) => {
      const items = intakeItems.filter((i) => i.log_id === log.id)
      return { date: log.date, nutrients: aggregateNutrients(items), itemCount: items.length }
    })
    const ongoing = pregnancies.find((p) => p.status === 'ongoing')
    const week = ongoing?.lmp ? weekFromLmp(ongoing.lmp) : null
    return buildNutrientSummary(period.from, period.to, days, week)
  },

  // ---- Phase 7: Hồ sơ khám (medical visits) — PER-USER ----
  async getMedicalVisits(): Promise<MedicalVisit[]> {
    return visible(medicalVisits)
      .slice()
      .sort((a, b) => b.visit_date.localeCompare(a.visit_date))
  },

  async addMedicalVisit(input: MedicalVisitInput): Promise<MedicalVisit> {
    const now = new Date().toISOString()
    const visit: MedicalVisit = {
      id: uid(),
      family_id: FAMILY_ID,
      private_owner_id: getActiveUser()?.user_id ?? null, // per-user — chỉ chủ sở hữu thấy
      visit_date: input.visit_date,
      clinic: input.clinic ?? null,
      reason: input.reason ?? null,
      notes: input.notes ?? null,
      child_id: input.child_id ?? null,
      pregnancy_id: input.pregnancy_id ?? null,
      created_at: now,
      updated_at: now,
    }
    medicalVisits.push(visit)
    return visit
  },

  async getVisitDocuments(visitId: string): Promise<VisitDocument[]> {
    return visible(visitDocuments).filter((d) => d.visit_id === visitId)
  },

  async addVisitDocument(visitId: string, input: VisitDocumentInput): Promise<VisitDocument> {
    const now = new Date().toISOString()
    const doc: VisitDocument = {
      id: uid(),
      family_id: FAMILY_ID,
      visit_id: visitId,
      private_owner_id: getActiveUser()?.user_id ?? null,
      filename: input.filename,
      mime: input.mime,
      image_data: input.imageDataUrl,
      ocr_text: input.ocrText ?? null,
      created_at: now,
    }
    visitDocuments.push(doc)
    return doc
  },

  async deleteFamilyData(): Promise<void> {
    // Guard: xoá dữ liệu gia đình phải có active user (route /api/v1/export trả
    // 401 khi chưa đăng nhập — bản sao phòng thủ ở method cho mọi caller khác).
    if (!getActiveUser()) throw new Error('Cần đăng nhập để xoá dữ liệu gia đình')
    // ponytail: reset toàn bộ memory (mảng seed demo) — đúng nghĩa "xóa dữ liệu gia đình".
    measurements.length = 0
    symptoms.length = 0
    fetalMovementLogs.length = 0
    appointments.length = 0
    documents.length = 0
    meals.length = 0
    supplements.length = 0
    savedMeals.length = 0
    feedings.length = 0
    sleeps.length = 0
    diapers.length = 0
    milestones.length = 0
    vaccinations.length = 0
    tasks.length = 0
    shopping.length = 0
    budget.length = 0
    reminders.length = 0
    nutritionProfiles.length = 0
    conditionPlans.length = 0
    conditionMeasurements.length = 0
    knowledgeChunks.length = 0
    contentVersions.length = 0
    dailyIntakeLogs.length = 0
    intakeItems.length = 0
    medicalVisits.length = 0
    visitDocuments.length = 0
    waterLoggedMl = 0
    children.length = 0
    for (const k of Object.keys(growthByChild)) delete growthByChild[k]
    // (birthRecord, weeklyGuides, articles, quiz, chat giữ seed để UI không vỡ — chỉ xóa dữ liệu người dùng tạo.
    // children là mảng mutation Phase 7 → reset. birthRecord là singleton const — seed giữ.)
  },
}

export const mockApi: DataApi = mockImpl

// ---------------------------------------------------------------------------
// Self-check đơn giản — chạy: node --experimental-strip-types --import ./lib/library/node-loader.mjs mock.ts
// ---------------------------------------------------------------------------

export function __selfcheck(): string[] {
  const errors: string[] = []
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (WEEKS.length !== 42) errors.push(`WEEKS phải đủ 42 tuần, hiện ${WEEKS.length}`)
  WEEKS.forEach((wEntry, i) => {
    if (wEntry.week !== i) errors.push(`WEEKS[${i}].week = ${wEntry.week}`)
    if (!wEntry.fetalSize) errors.push(`WEEKS[${i}] thiếu fetalSize`)
    if (wEntry.nutritionFocus.length < 3) errors.push(`WEEKS[${i}] thiếu nutritionFocus`)
  })

  if (pregnancies[0]!.lmp !== LMP) errors.push('LMP không khớp pregnancy')
  if (pregnancies[0]!.edd !== EDD) errors.push('EDD không khớp pregnancy')
  if (pregnancies[0]!.status !== 'ongoing') errors.push('Pregnancy hiện tại phải là ongoing')

  for (const id of [FAMILY_ID, MOM_ID, DAD_ID, PREG_ID, FETUS_ID, HEALTH_ID, PREG_PREV_ID, BIRTH_ID, CHILD_ID, SESSION_ID, QUIZ_ID]) {
    if (!uuidRe.test(id)) errors.push(`UUID không hợp lệ: ${id}`)
  }

  const mealToday = meals.filter((m) => m.logged_at.startsWith(REAL_TODAY)).length
  if (mealToday !== 5) errors.push(`mealCountToday phải là 5, hiện ${mealToday}`)

  const growth = growthByChild[CHILD_ID] ?? []
  if (growth.length < 2) errors.push('Thiếu dữ liệu tăng trưởng bé')
  if (growth[0]?.date !== CHILD_DOB) errors.push(`Growth bắt đầu không khớp DOB (${CHILD_DOB})`)
  for (let i = 1; i < growth.length; i++) {
    if ((growth[i]!.weightKg ?? 0) <= (growth[i - 1]!.weightKg ?? 0)) errors.push(`Growth tháng ${i} không tăng cân`)
  }

  const quiz = quizSets[0]!
  if (quiz.question_count !== quizQuestions.filter((q) => q.quiz_set_id === quiz.id).length) {
    errors.push('question_count không khớp số câu hỏi')
  }

  return errors
}

// ---------------------------------------------------------------------------
// demo — tự kiểm tra nhanh (chạy: node --experimental-strip-types --import ./lib/library/node-loader.mjs mock.ts)
// ---------------------------------------------------------------------------
async function demo(): Promise<void> {
  const assert = (cond: boolean, msg: string): void => {
    if (!cond) throw new Error(`mock.demo: ${msg}`)
  }

  const errors = __selfcheck()
  assert(errors.length === 0, errors.join('; ') || 'selfcheck')

  const week20 = await mockApi.getWeekInfo(20)
  assert(week20.week === 20 && week20.trimester === 'second' && week20.fetalSize.includes('chuối'), 'getWeekInfo(20)')
  assert((await mockApi.getWeekInfo(-5)).week === 0, 'getWeekInfo clamp thấp')
  assert((await mockApi.getWeekInfo(99)).week === 41, 'getWeekInfo clamp cao')

  const dash = await mockApi.getDashboard()
  // Tuần thai derive từ LMP seed + NGÀY THẬT (weekFromLmp dùng REAL_TODAY) nên KHÔNG
  // assert cứng số tuần — nó tự trôi theo lịch (lỗi "hạn sử dụng" từng khiến demo
  // fail khi sang tuần 21+). daysLeft/dueDate thì neo vào đồng hồ demo TODAY/EDD cố định.
  assert(
    dash.week === weekFromLmp(LMP)
      && dash.daysLeft === Math.round((Date.parse(EDD) - Date.parse(TODAY)) / DAY_MS)
      && dash.dueDate === EDD,
    'dashboard (Naegele)',
  )
  assert(dash.mealCountToday === 5 && dash.waterGoalMl === 2000, 'dashboard meals/nước')
  assert(dash.upcomingAppointments.length >= 1, 'dashboard upcomingAppointments')

  assert((await mockApi.getMealsByDate(REAL_TODAY)).length === 5, 'getMealsByDate')

  const mealForPhoto = await mockApi.addMeal({ meal_type: 'lunch', name: 'Cơm tấm', logged_at: new Date().toISOString() })
  const mealPhoto = await mockApi.addMealPhoto({ meal_id: mealForPhoto.id, file_name: 'com-tam.jpg', mime: 'image/jpeg', size_bytes: 2048, storage_path: 'uploads/com-tam.jpg' })
  assert(mealPhoto.meal_id === mealForPhoto.id && mealPhoto.confirmed === true && mealPhoto.file_url === '/uploads/com-tam.jpg', 'addMealPhoto (meal_id + file_url)')

  const task = await mockApi.addTask({ title: 'Task check', due_date: '2026-08-10', assignee_id: MOM_ID })
  await mockApi.toggleTask(task.id, true)
  assert((await mockApi.getTasks()).find((t) => t.id === task.id)?.status === 'done', 'toggleTask')

  const childrenList = await mockApi.getChildren()
  assert(childrenList.length === 1 && childrenList[0]!.sex === 'male', 'children')
  const childId = childrenList[0]!.id
  assert((await mockApi.getFeedings(childId)).length >= 5, 'feedings')
  const growth = await mockApi.getGrowth(childId)
  assert(growth.length === 10 && (growth[9]!.weightKg ?? 0) > 9, 'growth 9m')

  assert((await mockApi.getFetuses()).length === 1, 'getFetuses')
  assert((await mockApi.getQuizQuestions('40000000-0000-0000-0000-000000000002')).length === 5, 'getQuizQuestions')
  assert((await mockApi.getKnowledgeSources()).length === 2, 'getKnowledgeSources')

  const pregnancy = await mockApi.startPregnancy({ lmp: '2026-04-01' })
  assert(pregnancy.status === 'ongoing' && pregnancy.edd === '2027-01-06', 'startPregnancy Naegele')

  const feedBefore = (await mockApi.getFeedings(childId)).length
  await mockApi.addFeeding(childId, { method: 'formula', amount_ml: 160, started_at: '2026-08-03T22:00:00+07:00' })
  assert((await mockApi.getFeedings(childId)).length === feedBefore + 1, 'addFeeding')

  const wc0 = await mockApi.getWaterCaffeine()
  await mockApi.addWater({ logged_at: '2026-08-03T16:00:00+07:00', amount_ml: 250 })
  assert((await mockApi.getWaterCaffeine()).waterLoggedMl === wc0.waterLoggedMl + 250, 'addWater')

  const shop = await mockApi.addShoppingItem({ name: 'Gối bầu', estimated_price: 400000 })
  await mockApi.toggleShopping(shop.id, true)
  assert((await mockApi.getShopping()).find((s) => s.id === shop.id)?.status === 'bought', 'toggleShopping')

  const ms = await mockApi.addMilestone(childId, { name: 'Tập đứng', stage: 'Vận động', status: 'questionable' })
  assert(ms.child_id === childId && ms.status === 'questionable', 'addMilestone')

  // ---- Phase 3e: chọn tuần thai (updatePregnancy) + import triệu chứng + hồ sơ sức khỏe ----
  const dashBefore = await mockApi.getDashboard()
  await mockApi.updatePregnancy({ lmp: '2026-05-01' })
  const upd = (await mockApi.getPregnancy())!
  assert(upd.lmp === '2026-05-01' && upd.edd === '2027-02-05', 'updatePregnancy LMP→EDD Naegele')
  await mockApi.updatePregnancy({ edd: '2027-02-05' })
  const upd2 = (await mockApi.getPregnancy())!
  assert(upd2.lmp === '2026-05-01' && upd2.edd === '2027-02-05', 'updatePregnancy EDD→LMP trùng khớp')
  const dashAfter = await mockApi.getDashboard()
  // Tuần sau updatePregnancy = weekFromLmp(LMP mới, REAL_TODAY) — không assert cứng
  // số tuần (đổi theo ngày thật, xem ghi chú assert dashboard ở trên).
  assert(dashAfter.week === weekFromLmp('2026-05-01') && dashAfter.week !== dashBefore.week, 'updatePregnancy đổi tuần trên dashboard')

  const symCount = (await mockApi.getSymptoms()).length
  const imp = await mockApi.importSymptoms([
    { symptom: 'Đau đầu nhẹ', severity: 'mild', started_at: '2026-08-03T14:00:00+07:00' },
    { symptom: 'Chuột rút chân', severity: 'moderate', started_at: '2026-08-03T21:00:00+07:00', note: 'Về đêm' },
  ])
  assert(imp.created === 2, 'importSymptoms created=2')
  assert((await mockApi.getSymptoms()).length === symCount + 2, 'importSymptoms thêm vào getSymptoms')
  const dashSyms = (await mockApi.getDashboard()).recentSymptoms
  assert(
    dashSyms.some((s) => s.symptom === 'Đau đầu nhẹ') && dashSyms.some((s) => s.symptom === 'Chuột rút chân'),
    'importSymptoms → getDashboard.recentSymptoms (AI context thấy)',
  )

  const hp = await mockApi.updateHealthProfile({ height_cm: 160, allergies: ['Hải sản', 'Đậu phộng'], preexisting_conditions: ['Thiếu máu nhẹ'] })
  assert(hp.height_cm === 160 && hp.allergies.includes('Đậu phộng') && hp.preexisting_conditions.includes('Thiếu máu nhẹ'), 'updateHealthProfile')

  // ---- Phase 4B: lọc private_owner_id theo active user + gia đình ----
  const demoMembers = [
    { user_id: MOM_ID, name: 'Mẹ demo', email: 'me@demo.vn', role: 'owner' as const },
    { user_id: DAD_ID, name: 'Bố demo', email: 'bo@demo.vn', role: 'member' as const },
  ]
  // Không active user → getter trả toàn bộ (tương thích ngược).
  setActiveUser(null)
  assert((await mockApi.getSymptoms()).length > 0, 'không active user → getSymptoms trả toàn bộ')

  // Active = Mẹ → thấy mục dùng chung + mục riêng của Mẹ.
  setActiveUser({ user_id: MOM_ID, family_id: FAMILY_ID, family_code: 'MEVABE', members: demoMembers })
  const momSyms = await mockApi.getSymptoms()
  assert(
    momSyms.every((s) => s.private_owner_id === null || s.private_owner_id === MOM_ID),
    'Mẹ thấy mục dùng chung + mục riêng của mình',
  )
  const privSym = await mockApi.addSymptom({ symptom: 'Riêng tư — chỉ mẹ', severity: 'mild', started_at: new Date().toISOString(), private: true })
  assert(privSym.private_owner_id === MOM_ID, 'addSymptom private → private_owner_id = active user (Mẹ)')
  const sharedSym = await mockApi.addSymptom({ symptom: 'Dùng chung', severity: 'mild', started_at: new Date().toISOString() })
  assert(sharedSym.private_owner_id === null, 'addSymptom mặc định → dùng chung (null)')

  // Active = Bố → KHÔNG thấy mục riêng của Mẹ; thấy mục dùng chung.
  setActiveUser({ user_id: DAD_ID, family_id: FAMILY_ID, family_code: 'MEVABE', members: demoMembers })
  const dadSyms = await mockApi.getSymptoms()
  assert(!dadSyms.some((s) => s.private_owner_id === MOM_ID), 'Bố KHÔNG thấy triệu chứng riêng của Mẹ')
  assert(dadSyms.some((s) => s.symptom === 'Dùng chung'), 'Bố thấy triệu chứng dùng chung')

  // Gia đình getters theo active user.
  assert((await mockApi.getFamilyMembers()).length === 2, 'getFamilyMembers trả 2 thành viên')
  assert((await mockApi.getFamilyCode()) === 'MEVABE', 'getFamilyCode trả mã demo')

  // Chats/knowledge: seed dùng chung (null) → luôn thấy.
  assert((await mockApi.getChatMessages(SESSION_ID)).length === 6, 'getChatMessages dùng chung thấy đủ')
  assert((await mockApi.getKnowledgeSources()).length === 2, 'getKnowledgeSources dùng chung thấy đủ')

  // ---- Phase 4A: mô-đun Tình trạng (nutrition_profiles + reminder đo) ----
  setActiveUser(null)
  assert((await mockApi.getNutritionProfile()) === null, 'chưa khai báo → getNutritionProfile trả null')

  const np = await mockApi.updateNutritionProfile({
    conditions: ['gestational_diabetes', 'hypertension'],
    doctor_instructions: 'Đo đường huyết lúc đói mỗi sáng; huyết áp buổi tối.',
  })
  assert(
    np.conditions.includes('gestational_diabetes') && np.conditions.includes('hypertension'),
    'updateNutritionProfile lưu typed conditions',
  )
  assert((np.doctor_instructions ?? '').includes('Đo đường huyết'), 'updateNutritionProfile lưu doctor_instructions')
  const npRead = await mockApi.getNutritionProfile()
  assert(npRead?.conditions.length === 2, 'getNutritionProfile đọc lại được conditions')

  // Tạo lịch đo → reminder; payload JSON liên kết tình trạng/chỉ số.
  const remCountBefore = (await mockApi.getReminders()).length
  const rem = await mockApi.addReminder({
    title: 'Đo đường huyết lúc đói',
    scheduled_at: '2026-08-04T07:00:00+07:00',
    frequency: 'daily',
    payload: JSON.stringify({ v: 1, conditionType: 'gestational_diabetes', measurementType: 'blood_glucose' }),
  })
  assert((await mockApi.getReminders()).length === remCountBefore + 1, 'addReminder thêm vào getReminders')
  assert(rem.active === true && (rem.payload ?? '').includes('gestational_diabetes'), 'addReminder payload + active')

  await mockApi.updateReminder(rem.id, { active: false })
  assert((await mockApi.getReminders()).find((r) => r.id === rem.id)?.active === false, 'updateReminder tắt active')

  // Bỏ tình trạng → conditions rút gọn.
  const np2 = await mockApi.updateNutritionProfile({ conditions: ['gestational_diabetes'] })
  assert(np2.conditions.length === 1 && !np2.conditions.includes('hypertension'), 'bỏ tình trạng hypertension')

  setActiveUser(null)

  console.log('✅ mock.demo OK — 42 tuần, EDD, dashboard, meals, tasks, bé, quiz, chat + 15 hàm + Phase 4B (lọc private_owner_id, gia đình)')
}

const isMain = (): boolean =>
  (globalThis as { process?: { argv?: string[] } }).process?.argv?.[1]?.endsWith('mock.ts') === true
if (isMain()) void demo()
