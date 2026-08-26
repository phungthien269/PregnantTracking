// ===========================================================================
// vaccination-schedule.ts — Lịch tiêm chủng đề xuất cho bé 0–24 tháng.
//
// Dữ liệu THUẦN (không UI). Chuẩn tham chiếu:
// - Việt Nam: Lịch Tiêm chủng mở rộng (TCMR) theo Thông tư 52/2025/TT-BYT
//   (hiệu lực 15/02/2026) — nguồn Bộ Y tế VN. Đây là chuẩn chính để hiển thị.
// - Quốc tế: CDC (Hoa Kỳ) & AAP/HealthyChildren — giữ cho các mũi dịch vụ /
//   tham chiếu bổ sung.
//
// ⚠️ Tài liệu giáo dục sức khỏe — KHÔNG thay thế tư vấn y khoa. Luôn theo
//    hướng dẫn của trạm y tế / bác sĩ nhi / Bộ Y tế Việt Nam.
//
// Mũi nào không xác minh được nguồn → để trống `sources` + ghi chú (theo quy
// tắc "không bịa nguồn").
// ===========================================================================

export interface VaccineSource {
  org: string
  url: string
}

export interface ScheduleDose {
  id: string
  /** Tên vắc-xin hiển thị (tiếng Việt). */
  vaccine: string
  /** Chuẩn hoá (bỏ dấu, chữ thường) — dùng để nối với vaccine_name đã lưu. */
  key: string
  dose_number: number
  /** Số tháng tuổi dự kiến tiêm (0 = sơ sinh / trong tháng đầu). */
  due_month: number
  /** Ghi chú chung (khuyến cáo thời điểm, đối tượng). */
  note?: string
  /** Khác biệt so với lịch chuẩn quốc tế / lịch Việt Nam (nếu có). */
  vietnamNote?: string
  /**
   * Nếu vắc-xin này được bao trong combo khác (VD viêm gan B trong "5/6 trong 1"),
   * ghi combo + độ lệch liều: comboDose = dose_number + comboDoseOffset.
   * (VD: viêm gan B mũi 2 = 5-trong-1 mũi 1 → offset −1.)
   */
  coveredBy?: { comboKey: string; comboDoseOffset: number }[]
  sources: VaccineSource[]
}

// Nguồn chính thức VN — Lịch TCMR theo Thông tư 52/2025/TT-BYT (Bộ Y tế).
const BOYTE_TT52 = {
  org: 'Bộ Y tế VN — Thông tư 52/2025/TT-BYT',
  url: 'https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-52-2025-TT-BYT-pham-vi-phai-su-dung-vac-xin-sinh-pham-y-te-bat-buoc-687438.aspx',
}
const BOYTE_TT52_PDF = {
  org: 'Bộ Y tế VN — Thông tư 52/2025/TT-BYT (toàn văn)',
  url: 'https://static3.luatvietnam.vn/uploaded/vietlawfile/2026/1/s_52_2025_tt_byt_010126114520.pdf',
}
const TYT_MEDINET = {
  org: 'Trạm Y tế — TCMR (medinet.gov.vn)',
  url: 'https://tytphuong7q11.medinet.gov.vn/cham-soc-ba-me-tre-em/lich-tiem-chung-cho-tre-theo-chuong-trinh-tiem-chung-mo-rong-c7443-242400.aspx',
}
// Nguồn quốc tế — tham chiếu cho các mũi dịch vụ / so sánh.
const CDC = { org: 'CDC (Hoa Kỳ)', url: 'https://www.cdc.gov/vaccines/imz-schedules/child-easyread.html' }
const AAP = {
  org: 'AAP / HealthyChildren',
  url: 'https://www.healthychildren.org/English/safety-prevention/immunizations/Pages/default.aspx',
}

/** Lịch đề xuất 0–24 tháng. `due_month` theo tuổi thường tiêm ở Việt Nam (TCMR). */
export const VACCINATION_SCHEDULE: ScheduleDose[] = [
  {
    id: 'hepb-1',
    vaccine: 'Viêm gan B',
    key: 'viem gan b',
    dose_number: 1,
    due_month: 0,
    note: 'Mũi sơ sinh — tiêm trong 24 giờ đầu sau sinh (trễ → tiêm sớm trong 28 ngày).',
    sources: [BOYTE_TT52, CDC],
  },
  {
    id: 'hepb-2',
    vaccine: 'Viêm gan B',
    key: 'viem gan b',
    dose_number: 2,
    due_month: 2,
    vietnamNote: 'TCMR VN tiêm viêm gan B trong mũi 5-trong-1 lúc 2 tháng (dịch vụ 6-trong-1 cũng có viêm gan B).',
    coveredBy: [
      { comboKey: '6 trong 1', comboDoseOffset: -1 },
      { comboKey: '5 trong 1', comboDoseOffset: -1 },
    ],
    sources: [BOYTE_TT52, CDC],
  },
  {
    id: 'hepb-3',
    vaccine: 'Viêm gan B',
    key: 'viem gan b',
    dose_number: 3,
    due_month: 3,
    vietnamNote:
      'TCMR VN: viêm gan B nằm trong 5-trong-1 tiêm 2–3–4 tháng → mũi 3 lúc 3 tháng (mũi 4 lúc 4 tháng). Chuẩn quốc tế cho mũi 3 lúc 6–18 tháng.',
    coveredBy: [
      { comboKey: '6 trong 1', comboDoseOffset: -1 },
      { comboKey: '5 trong 1', comboDoseOffset: -1 },
    ],
    sources: [BOYTE_TT52, CDC],
  },
  {
    id: 'bcg-1',
    vaccine: 'Lao (BCG)',
    key: 'bcg',
    dose_number: 1,
    due_month: 0,
    note: 'Tiêm 1 lần trong tháng đầu sau sinh (thường tại bệnh viện khi sinh); trễ → tiêm trước 12 tháng.',
    sources: [BOYTE_TT52, TYT_MEDINET],
  },
  {
    id: 'dtap-1',
    vaccine: '5-trong-1 / 6-trong-1 (bạch hầu, ho gà, uốn ván, Hib, viêm gan B)',
    key: '6 trong 1',
    dose_number: 1,
    due_month: 2,
    vietnamNote: 'TCMR dùng 5-trong-1 (KHÔNG chứa bại liệt — tiêm riêng bOPV/IPV); 6-trong-1 là dịch vụ (có bại liệt).',
    sources: [BOYTE_TT52, CDC],
  },
  {
    id: 'dtap-2',
    vaccine: '5-trong-1 / 6-trong-1 (bạch hầu, ho gà, uốn ván, Hib, viêm gan B)',
    key: '6 trong 1',
    dose_number: 2,
    due_month: 3,
    vietnamNote: 'TCMR VN tiêm 2–3–4 tháng; chuẩn CDC là 2–4–6 tháng.',
    sources: [BOYTE_TT52, CDC],
  },
  {
    id: 'dtap-3',
    vaccine: '5-trong-1 / 6-trong-1 (bạch hầu, ho gà, uốn ván, Hib, viêm gan B)',
    key: '6 trong 1',
    dose_number: 3,
    due_month: 4,
    sources: [BOYTE_TT52, CDC],
  },
  {
    id: 'dtap-4',
    vaccine: 'Bạch hầu – Ho gà – Uốn ván (DPT) — mũi nhắc',
    key: '6 trong 1',
    dose_number: 4,
    due_month: 18,
    vietnamNote: 'TCMR VN 18 tháng: DTP nhắc lại + Sởi–Rubella (MR). Chuẩn quốc tế nhắc lúc 15–18 tháng.',
    sources: [BOYTE_TT52, CDC],
  },
  {
    id: 'bopv-1',
    vaccine: 'Bại liệt uống (bOPV)',
    key: 'bopv',
    dose_number: 1,
    due_month: 2,
    vietnamNote: 'TCMR bắt buộc: bOPV (type 1 & 3) lúc 2–3–4 tháng. 5-trong-1 TCMR không chứa bại liệt.',
    sources: [BOYTE_TT52, TYT_MEDINET],
  },
  {
    id: 'bopv-2',
    vaccine: 'Bại liệt uống (bOPV)',
    key: 'bopv',
    dose_number: 2,
    due_month: 3,
    sources: [BOYTE_TT52, TYT_MEDINET],
  },
  {
    id: 'bopv-3',
    vaccine: 'Bại liệt uống (bOPV)',
    key: 'bopv',
    dose_number: 3,
    due_month: 4,
    sources: [BOYTE_TT52, TYT_MEDINET],
  },
  {
    id: 'ipv-1',
    vaccine: 'Bại liệt tiêm (IPV)',
    key: 'ipv',
    dose_number: 1,
    due_month: 5,
    vietnamNote: 'TCMR: IPV (type 2) lúc 5 và 9 tháng. Nếu dùng 6-trong-1 dịch vụ (đã có bại liệt) thì lịch bOPV/IPV có thể thay đổi.',
    sources: [BOYTE_TT52, TYT_MEDINET],
  },
  {
    id: 'ipv-2',
    vaccine: 'Bại liệt tiêm (IPV)',
    key: 'ipv',
    dose_number: 2,
    due_month: 9,
    sources: [BOYTE_TT52, TYT_MEDINET],
  },
  {
    id: 'pcv-1',
    vaccine: 'Phế cầu (PCV)',
    key: 'phe cau',
    dose_number: 1,
    due_month: 2,
    vietnamNote: 'TCMR mới (NQ 104/NQ-CP): 2 liều lúc 2 và 4 tháng. Dịch vụ PCV thường 3+1 liều (2–4–6–12 tháng).',
    sources: [BOYTE_TT52, CDC],
  },
  {
    id: 'pcv-2',
    vaccine: 'Phế cầu (PCV)',
    key: 'phe cau',
    dose_number: 2,
    due_month: 4,
    vietnamNote: 'TCMR miễn phí 2 liều (2–4 tháng) theo lộ trình; lịch 3+1 (có mũi 6 & 12 tháng) là dịch vụ.',
    sources: [BOYTE_TT52, CDC],
  },
  {
    id: 'rota-1',
    vaccine: 'Rota virus (uống)',
    key: 'rota',
    dose_number: 1,
    due_month: 2,
    vietnamNote: 'TCMR mới: Rota 2 liều (2 và 3 tháng; liều cuối trước 6 tháng tuổi). Dịch vụ Rotateq có thể 3 liều.',
    sources: [BOYTE_TT52, CDC],
  },
  {
    id: 'rota-2',
    vaccine: 'Rota virus (uống)',
    key: 'rota',
    dose_number: 2,
    due_month: 3,
    sources: [BOYTE_TT52, CDC],
  },
  {
    id: 'mmr-1',
    vaccine: 'Sởi (đơn giá)',
    key: 'soi',
    dose_number: 1,
    due_month: 9,
    vietnamNote: 'TCMR VN tiêm sởi đơn lúc 9 tháng; MMR (sởi–quai bị–rubella) là dịch vụ lúc 12–15 tháng.',
    sources: [BOYTE_TT52, CDC],
  },
  {
    id: 'mmr-2',
    vaccine: 'Sởi – Rubella (MR) — mũi nhắc',
    key: 'soi',
    dose_number: 2,
    due_month: 18,
    note: 'Theo TCMR VN: sởi phối hợp MR lúc 18 tháng.',
    sources: [BOYTE_TT52],
  },
  {
    id: 'je-1',
    vaccine: 'Viêm não Nhật Bản',
    key: 'nao nhat ban',
    dose_number: 1,
    due_month: 12,
    vietnamNote: 'TCMR: 3 mũi — mũi 1 lúc 12 tháng, mũi 2 cách 1–2 tuần, mũi 3 lúc 24 tháng.',
    sources: [BOYTE_TT52, TYT_MEDINET],
  },
  {
    id: 'je-2',
    vaccine: 'Viêm não Nhật Bản',
    key: 'nao nhat ban',
    dose_number: 2,
    due_month: 12,
    note: 'Mũi 2 cách mũi 1 khoảng 1–2 tuần (cùng tháng thứ 12).',
    sources: [BOYTE_TT52, TYT_MEDINET],
  },
  {
    id: 'je-3',
    vaccine: 'Viêm não Nhật Bản',
    key: 'nao nhat ban',
    dose_number: 3,
    due_month: 24,
    note: 'Mũi 3 cách mũi 1 khoảng 1 năm (lúc 24 tháng).',
    sources: [BOYTE_TT52, TYT_MEDINET],
  },
  {
    id: 'hepa-1',
    vaccine: 'Viêm gan A',
    key: 'viem gan a',
    dose_number: 1,
    due_month: 12,
    vietnamNote: 'Không thuộc TCMR — vắc xin dịch vụ (tự trả).',
    sources: [CDC, AAP],
  },
  {
    id: 'hepa-2',
    vaccine: 'Viêm gan A',
    key: 'viem gan a',
    dose_number: 2,
    due_month: 18,
    note: 'Mũi 2 cách mũi 1 ít nhất 6 tháng.',
    vietnamNote: 'Không thuộc TCMR — vắc xin dịch vụ (tự trả).',
    sources: [CDC, AAP],
  },
  {
    id: 'var-1',
    vaccine: 'Thủy đậu (Varicella)',
    key: 'thuy dau',
    dose_number: 1,
    due_month: 12,
    vietnamNote: 'Không thuộc TCMR — vắc xin dịch vụ (tự trả).',
    sources: [CDC, AAP],
  },
  {
    id: 'flu-1',
    vaccine: 'Cúm mùa',
    key: 'cum',
    dose_number: 1,
    due_month: 6,
    note: 'Từ 6 tháng tuổi, tiêm nhắc hằng năm. Trẻ tiêm lần đầu cần 2 liều cách ~4 tuần.',
    vietnamNote: 'Không thuộc TCMR (chỉ tiêm khi có dịch theo Điều 2 TT 52) — vắc xin dịch vụ.',
    sources: [CDC, AAP],
  },
]

// ---------------------------------------------------------------------------
// Helpers thuần — tuổi theo tháng, ngày hẹn, trạng thái so với hồ sơ tiêm.
// ---------------------------------------------------------------------------

/** Bỏ dấu tiếng Việt + chữ thường — để nối tên vắc-xin. */
export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Số tháng tuổi giữa hai ngày (YYYY-MM-DD), làm tròn xuống. */
export function monthsBetween(birthDate: string, atDate: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [ay, am, ad] = atDate.split('-').map(Number)
  let months = (ay! - by!) * 12 + (am! - bm!)
  if (ad! < bd!) months -= 1
  return Math.max(0, months)
}

/** Cộng tháng vào ngày (YYYY-MM-DD), giữ đúng ngày trong tháng khi có thể. */
export function addMonths(date: string, months: number): string {
  const d = new Date(date + 'T00:00:00')
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Ngày dự kiến tiêm mũi theo lịch: ngày sinh + số tháng. */
export function dueDateOf(birthDate: string, dueMonth: number): string {
  return addMonths(birthDate, dueMonth)
}

export type VaccineStatus = 'done' | 'overdue' | 'due' | 'upcoming'

export interface ScheduleStatusInput {
  birthDate: string
  /** Các mũi đã tiêm (administered) — chỉ cần name + dose_number. */
  administered: { name: string; dose_number: number | null }[]
  /** Ngày hôm nay (YYYY-MM-DD). */
  today: string
}

/**
 * Trạng thái 1 mũi đề xuất so với hồ sơ:
 * - done     → đã có mũi cùng tên + cùng liều (dose_number).
 * - overdue  → đến hạn đã qua mà chưa tiêm.
 * - due      → đến hạn trong tháng này.
 * - upcoming → còn trên 1 tháng nữa.
 */
export function scheduleDoseStatus(dose: ScheduleDose, opts: ScheduleStatusInput): VaccineStatus {
  const matched = opts.administered.some((r) => {
    if (r.dose_number == null) return false
    if (r.dose_number === dose.dose_number && norm(r.name).includes(norm(dose.key))) return true
    // Vắc-xin nằm trong combo (VD viêm gan B trong 5/6 trong 1) → combo cùng liều tương ứng là "đã tiêm".
    return (dose.coveredBy ?? []).some(
      (cb) => norm(r.name).includes(norm(cb.comboKey)) && r.dose_number === dose.dose_number + cb.comboDoseOffset,
    )
  })
  if (matched) return 'done'
  const due = dueDateOf(opts.birthDate, dose.due_month)
  if (due < opts.today) return 'overdue'
  if (due <= addMonths(opts.today, 1)) return 'due'
  return 'upcoming'
}

/** Self-check — chạy bởi scripts/test-web.sh (xem vaccine-schedule.check.ts). */
export function selfCheck(): void {
  const assert = (c: boolean, m: string) => {
    if (!c) throw new Error(`vaccination-schedule selfCheck: ${m}`)
  }
  const dose = (id: string) => {
    const d = VACCINATION_SCHEDULE.find((x) => x.id === id)
    if (!d) throw new Error(`vaccination-schedule selfCheck: thiếu mũi ${id}`)
    return d
  }
  // Bé sinh 2025-11-03 (giống seed CHILD).
  const birth = '2025-11-03'
  const today = '2026-08-05'
  // Tuổi theo tháng: 9 tháng.
  assert(monthsBetween(birth, today) === 9, 'bé sinh 03/11/2025 tới 05/08/2026 = 9 tháng')
  // due_date các mốc.
  assert(dueDateOf(birth, 0) === '2025-11-03', 'mũi sơ sinh = ngày sinh')
  assert(dueDateOf(birth, 9) === '2026-08-03', 'sởi lúc 9 tháng = 2026-08-03')
  assert(dueDateOf(birth, 18) === '2027-05-03', 'mũi nhắc 18 tháng')
  // Bé 2 tháng tuổi (sinh 05/06, đúng 2 tháng vào 05/08): các mũi 2 tháng TCMR → "due".
  const baby2mo = { birthDate: '2026-06-05', today: '2026-08-05' }
  assert(scheduleDoseStatus(dose('dtap-1'), { ...baby2mo, administered: [] }) === 'due', 'bé 2 tháng → 5/6-trong-1 mũi 1 đến hạn')
  assert(scheduleDoseStatus(dose('bopv-1'), { ...baby2mo, administered: [] }) === 'due', 'bé 2 tháng → bOPV liều 1 đến hạn')
  assert(scheduleDoseStatus(dose('rota-1'), { ...baby2mo, administered: [] }) === 'due', 'bé 2 tháng → Rota liều 1 đến hạn')
  assert(scheduleDoseStatus(dose('pcv-1'), { ...baby2mo, administered: [] }) === 'due', 'bé 2 tháng → Phế cầu mũi 1 đến hạn')
  assert(scheduleDoseStatus(dose('hepb-2'), { ...baby2mo, administered: [] }) === 'due', 'bé 2 tháng → viêm gan B mũi 2 đến hạn')
  assert(scheduleDoseStatus(dose('ipv-1'), { ...baby2mo, administered: [] }) === 'upcoming', 'bé 2 tháng → IPV (5 tháng) chưa tới')
  assert(scheduleDoseStatus(dose('je-1'), { ...baby2mo, administered: [] }) === 'upcoming', 'bé 2 tháng → viêm não NB chưa tới')
  // Bé 3 tháng tuổi (sinh 05/05, đúng 3 tháng vào 05/08): các mũi 3 tháng TCMR → "due".
  const baby3mo = { birthDate: '2026-05-05', today: '2026-08-05' }
  assert(scheduleDoseStatus(dose('bopv-2'), { ...baby3mo, administered: [] }) === 'due', 'bé 3 tháng → bOPV liều 2 đến hạn')
  assert(scheduleDoseStatus(dose('rota-2'), { ...baby3mo, administered: [] }) === 'due', 'bé 3 tháng → Rota liều 2 đến hạn')
  assert(scheduleDoseStatus(dose('hepb-3'), { ...baby3mo, administered: [] }) === 'due', 'bé 3 tháng → viêm gan B mũi 3 đến hạn')
  // Đã tiêm → done (khớp cả tên combo 6 trong 1 chứa "viêm gan b").
  assert(
    scheduleDoseStatus(dose('hepb-1'), {
      birthDate: birth,
      today,
      administered: [{ name: 'Viêm gan B', dose_number: 1 }],
    }) === 'done',
    'viêm gan B mũi 1 đã tiêm → done',
  )
  // Viêm gan B mũi 2 được bao trong 6 trong 1 mũi 1 (combo) → done.
  assert(
    scheduleDoseStatus(dose('hepb-2'), {
      birthDate: birth,
      today,
      administered: [{ name: '6 trong 1', dose_number: 1 }],
    }) === 'done',
    'viêm gan B mũi 2 → done khi đã tiêm 6 trong 1 mũi 1',
  )
  assert(
    scheduleDoseStatus(dose('dtap-1'), {
      birthDate: birth,
      today,
      administered: [{ name: '6 trong 1 (bạch hầu, ho gà, uốn ván, bại liệt, Hib, viêm gan B)', dose_number: 1 }],
    }) === 'done',
    '6 trong 1 mũi 1 đã tiêm → done',
  )
  assert(
    scheduleDoseStatus(dose('bopv-1'), {
      birthDate: birth,
      today,
      administered: [{ name: 'Bại liệt bOPV', dose_number: 1 }],
    }) === 'done',
    'bOPV liều 1 đã tiêm → done',
  )
  // bOPV liều 1 KHÔNG được tính cho IPV mũi 1 (key riêng biệt).
  assert(
    scheduleDoseStatus(dose('ipv-1'), {
      birthDate: birth,
      today,
      administered: [{ name: 'Bại liệt bOPV', dose_number: 1 }],
    }) === 'overdue',
    'bOPV liều 1 không tính cho IPV mũi 1',
  )
  // Bỏ dấu chuẩn hoá.
  assert(norm('Viêm gan B') === 'viem gan b', 'bỏ dấu tiếng Việt')
  assert(norm('6 trong 1') === '6 trong 1', 'bỏ dấu giữ số')
  console.log('✅ vaccination-schedule selfCheck OK — tuổi/tháng + đến hạn/quá hạn + nối tên')
}
