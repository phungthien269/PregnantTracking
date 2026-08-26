// ===========================================================================
// Rule engine — chạy trên dữ liệu THẬT (đo lường, triệu chứng, thai máy,
// tình trạng đã khai, nước/caffeine, tuần thai) → cảnh báo.
// Thuần + demo(). Cảnh báo KHẨN chỉ đến từ đây, không từ AI.
// Tự chứa (chỉ import type từ @mevabe/domain) để chạy được bằng node.
// Ngưỡng tham khảo: lib/health/condition-thresholds.ts (ACOG/NICE/IADPSG).
// ===========================================================================

import type {
  MaternalMeasurement,
  SymptomReport,
  FetalMovementLog,
  ConditionType,
} from '@mevabe/domain'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface RuleAlert {
  ruleId: string
  severity: AlertSeverity
  message: string
  source: string
}

/** Nước/caffeine — view model của DataApi (api.ts), tự khai báo để module thuần. */
export interface WaterLike {
  waterLoggedMl: number
  waterGoalMl: number
  caffeineLoggedMg: number
  caffeineLimitMg: number
}

export interface AlertInput {
  week?: number
  measurements?: MaternalMeasurement[]
  symptoms?: SymptomReport[]
  water?: WaterLike | null
  /** Nhật ký thai máy — cho rule giảm thai máy (cảm nhận + số lần trong khoảng). */
  fetalMovementLogs?: FetalMovementLog[]
  /** Tình trạng đặc biệt đã khai (nutrition_profiles.conditions). */
  conditions?: ConditionType[]
  /** Mốc "hiện tại" — tiêm để demo/self-check xác định. Mặc định Date.now(). */
  now?: number
}

const NGUY_HIEM = 'Cẩm nang thai kỳ — Bệnh viện Từ Dũ, 2026'
const GDM_SOURCE = 'IADPSG/ACOG — tiểu đường thai kỳ (tham khảo)'
const FETAL_SOURCE = 'ACOG — đếm cử động thai (tham khảo)'

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS
/** Cửa sổ đếm thai máy: 12 giờ gần nhất. */
const FETAL_WINDOW_MS = 12 * HOUR_MS
/** Cửa sổ "đã từng ghi nhận" để so sánh giảm đột ngột: 7 ngày. */
const FETAL_HISTORY_MS = 7 * DAY_MS
/** Cửa sổ xem có đo huyết áp gần đây khi có tình trạng đặc biệt: 7 ngày. */
const BP_DUE_MS = 7 * DAY_MS

const ts = (s: string): number => Date.parse(s)

export function runAlertRules(input: AlertInput): RuleAlert[] {
  const alerts: RuleAlert[] = []
  const measurements = input.measurements ?? []
  const symptoms = input.symptoms ?? []
  const logs = input.fetalMovementLogs ?? []
  const conditions = input.conditions ?? []
  const now = input.now ?? Date.now()

  const gdm = conditions.includes('gestational_diabetes')
  const bpRisk = conditions.includes('hypertension') || conditions.includes('preeclampsia_risk')

  // Huyết áp: ≥160/110 cấp cứu; ≥140/90 lưu ý (nguy cơ tiền sản giật).
  for (const m of measurements) {
    if (m.type === 'blood_pressure') {
      const sys = m.value
      const dia = m.diastolic ?? 0
      if (sys >= 160 || dia >= 110) {
        alerts.push({
          ruleId: 'bp-crisis',
          severity: 'critical',
          message: `Huyết áp rất cao (${sys}/${dia}) — có nguy cơ tiền sản giật. Cần đi khám ngay.`,
          source: NGUY_HIEM,
        })
      } else if (sys >= 140 || dia >= 90) {
        alerts.push({
          ruleId: 'bp-high',
          severity: 'warning',
          message: `Huyết áp cao (${sys}/${dia}) — theo dõi và trao đổi bác sĩ.`,
          source: NGUY_HIEM,
        })
      }
    }
  }

  // Đường huyết: ≥11.1 mmol/L = ngưỡng tiểu đường mắc phải (cảnh báo bất kể khai gì);
  // ≥5.1 mmol/L (IADPSG — đói) chỉ cảnh báo khi đã khai tiểu đường thai kỳ.
  for (const m of measurements) {
    if (m.type !== 'blood_glucose') continue
    if (m.value >= 11.1) {
      alerts.push({
        ruleId: 'glucose-high',
        severity: 'warning',
        message: `Đường huyết rất cao (${m.value} ${m.unit}) — ngưỡng tiểu đường mắc phải. Cần xét nghiệm lại và đi khám sớm.`,
        source: GDM_SOURCE,
      })
    } else if (gdm && m.value >= 5.1) {
      alerts.push({
        ruleId: 'glucose-gdm-high',
        severity: 'warning',
        message: `Đường huyết ${m.value} ${m.unit} — cao so với mục tiêu thai kỳ (≥5.1 mmol/L lúc đói, IADPSG). Mẹ có tiểu đường thai kỳ, cần theo dõi và trao đổi bác sĩ.`,
        source: GDM_SOURCE,
      })
    }
  }

  // Triệu chứng: mô tả chứa dấu hiệu nguy hiểm (ra máu, đau bụng dữ dội…) → khẩn;
  // mức severe → lưu ý.
  for (const s of symptoms) {
    const text = (s.symptom + ' ' + (s.note ?? '')).toLowerCase()
    const danger = ['ra máu', 'đau bụng dữ dội', 'vỡ ối', 'co giật', 'sốt cao', 'thai máy giảm', 'nhìn mờ'].some((k) =>
      text.includes(k),
    )
    if (danger) {
      alerts.push({
        ruleId: 'symptom-danger',
        severity: 'critical',
        message: `Triệu chứng "${s.symptom}" có dấu hiệu nguy hiểm — cần xử lý ngay.`,
        source: NGUY_HIEM,
      })
    } else if (s.severity === 'severe') {
      alerts.push({
        ruleId: 'symptom-severe',
        severity: 'warning',
        message: `Triệu chứng "${s.symptom}" ở mức nặng — nên trao đổi bác sĩ.`,
        source: NGUY_HIEM,
      })
    }
  }

  // Thai máy: cảm nhận absent → khẩn; reduced → lưu ý; số lần trong 12h = 0
  // mà trước đó có ghi nhận trong 7 ngày → giảm đột ngột.
  const recentLogs = logs.filter((l) => ts(l.felt_at) >= now - FETAL_HISTORY_MS)
  if (recentLogs.some((l) => l.feeling === 'absent')) {
    alerts.push({
      ruleId: 'fetal-movement-absent',
      severity: 'critical',
      message: 'Không cảm nhận được cử động thai (absent) — cần đi khám ngay.',
      source: FETAL_SOURCE,
    })
  } else if (recentLogs.some((l) => l.feeling === 'reduced')) {
    alerts.push({
      ruleId: 'fetal-movement-reduced',
      severity: 'warning',
      message: 'Cảm nhận thai máy yếu/giảm (reduced) — theo dõi chặt hôm nay; nếu tiếp tục giảm hãy liên hệ bác sĩ.',
      source: FETAL_SOURCE,
    })
  }
  if (logs.length) {
    const in12h = logs.filter((l) => ts(l.felt_at) >= now - FETAL_WINDOW_MS).length
    const hasActiveHistory = recentLogs.some((l) => ts(l.felt_at) < now - FETAL_WINDOW_MS)
    if (in12h === 0 && hasActiveHistory) {
      alerts.push({
        ruleId: 'fetal-movement-low',
        severity: 'warning',
        message: 'Chưa ghi nhận cử động thai trong 12 giờ qua — nếu mẹ thấy bé đạp ít hơn hẳn, hãy liên hệ bác sĩ.',
        source: FETAL_SOURCE,
      })
    }
  }

  // Thiếu dữ liệu: có tình trạng tăng huyết áp/nguy cơ tiền sản giật mà
  // chưa có chỉ số huyết áp trong 7 ngày qua.
  if (bpRisk && !measurements.some((m) => m.type === 'blood_pressure' && ts(m.taken_at) >= now - BP_DUE_MS)) {
    alerts.push({
      ruleId: 'bp-data-missing',
      severity: 'warning',
      message:
        'Mẹ có tình trạng tăng huyết áp/nguy cơ tiền sản giật nhưng chưa có chỉ số huyết áp trong 7 ngày qua — hãy đo và ghi lại thường xuyên.',
      source: NGUY_HIEM,
    })
  }

  // Nước/caffeine — chỉ theo dõi, không khuyến cáo cứng.
  if (input.water && input.water.waterGoalMl > 0) {
    if (input.water.waterLoggedMl < input.water.waterGoalMl * 0.5) {
      alerts.push({
        ruleId: 'water-low',
        severity: 'info',
        message: `Mẹ mới uống ${input.water.waterLoggedMl}/${input.water.waterGoalMl} ml nước hôm nay — cố gắng uống thêm nhé.`,
        source: NGUY_HIEM,
      })
    }
    if (input.water.caffeineLoggedMg > input.water.caffeineLimitMg) {
      alerts.push({
        ruleId: 'caffeine-over',
        severity: 'warning',
        message: `Caffeine hôm nay vượt mức khuyến nghị (${input.water.caffeineLoggedMg}/${input.water.caffeineLimitMg} mg).`,
        source: 'WHO — caffeine trong thai kỳ (≤ 200 mg/ngày)',
      })
    }
  }

  // Dedup theo ruleId — tránh loạt cảnh báo khi ghi nhiều lần đo cùng loại.
  const seen = new Set<string>()
  return alerts.filter((a) => (seen.has(a.ruleId) ? false : (seen.add(a.ruleId), true)))
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

/** demo() chạy bằng `node --experimental-strip-types alert-rules.ts`. */
export function demo(): void {
  const now = Date.now()
  const h = (n: number) => now - n * HOUR_MS

  const base = {
    id: 'x', family_id: 'y', private_owner_id: null,
    created_at: '2026-08-01T08:00:00+07:00', updated_at: '2026-08-01T08:00:00+07:00',
    pregnancy_id: 'p', unit: 'mmHg', taken_at: '2026-08-01T08:00:00+07:00', note: null,
  } as const
  const bp = (value: number, diastolic: number, taken_at?: string): MaternalMeasurement =>
    ({ ...base, type: 'blood_pressure', value, diastolic, taken_at: taken_at ?? base.taken_at }) as unknown as MaternalMeasurement
  const glu = (value: number, unit = 'mmol/L'): MaternalMeasurement =>
    ({ ...base, type: 'blood_glucose', value, unit }) as unknown as MaternalMeasurement

  // Huyết áp
  assert(runAlertRules({ measurements: [bp(165, 110)] }).some((r) => r.ruleId === 'bp-crisis'), 'bp crisis')
  assert(runAlertRules({ measurements: [bp(145, 92)] }).some((r) => r.ruleId === 'bp-high'), 'bp high')

  // Đường huyết — cần khai tiểu đường thai kỳ mới cảnh báo ≥5.1; ngưỡng cực cao vẫn chạy
  assert(!runAlertRules({ measurements: [glu(6.0)] }).some((r) => r.ruleId.startsWith('glucose')), 'glucose không khai GDM → không cảnh báo 6.0')
  assert(runAlertRules({ measurements: [glu(6.0)], conditions: ['gestational_diabetes'] }).some((r) => r.ruleId === 'glucose-gdm-high'), 'glucose GDM ≥5.1')
  assert(runAlertRules({ measurements: [glu(11.1)] }).some((r) => r.ruleId === 'glucose-high'), 'glucose ≥11.1 bất kể khai gì')

  // Thai máy
  const fm = (feeling: 'normal' | 'reduced' | 'absent' | 'strong', felt_at: string): FetalMovementLog =>
    ({ ...base, type: undefined, feeling, felt_at, duration_min: null }) as unknown as FetalMovementLog
  const rec = { measurements: [], symptoms: [] }
  assert(
    runAlertRules({ ...rec, fetalMovementLogs: [fm('absent', new Date(h(1)).toISOString())], now }).some((r) => r.ruleId === 'fetal-movement-absent'),
    'fetal absent',
  )
  assert(
    runAlertRules({ ...rec, fetalMovementLogs: [fm('reduced', new Date(h(1)).toISOString())], now }).some((r) => r.ruleId === 'fetal-movement-reduced'),
    'fetal reduced',
  )
  // Đếm trong 12h: có log hôm qua, không log trong 12h gần nhất → giảm
  const low = runAlertRules({ ...rec, fetalMovementLogs: [fm('normal', new Date(h(30)).toISOString())], now })
  assert(low.some((r) => r.ruleId === 'fetal-movement-low'), 'fetal movement low (0 trong 12h)')
  // Có log trong 12h → không cảnh báo giảm
  const ok = runAlertRules({ ...rec, fetalMovementLogs: [fm('normal', new Date(h(1)).toISOString())], now })
  assert(!ok.some((r) => r.ruleId === 'fetal-movement-low'), 'fetal movement trong 12h → không low')

  // Thiếu dữ liệu huyết áp khi có tình trạng đặc biệt
  assert(
    runAlertRules({ ...rec, conditions: ['hypertension'] }).some((r) => r.ruleId === 'bp-data-missing'),
    'bp data missing (hypertension)',
  )
  const bpNow = runAlertRules({ measurements: [bp(120, 80, new Date().toISOString())], conditions: ['preeclampsia_risk'] })
  assert(!bpNow.some((r) => r.ruleId === 'bp-data-missing'), 'bp đo gần đây → không missing')

  // Triệu chứng
  const sym = (symptom: string, severity: 'mild' | 'moderate' | 'severe', note: string | null = null): SymptomReport =>
    ({ ...base, type: undefined, symptom, severity, started_at: '2026-08-01T08:00:00+07:00', note, source: 'manual' }) as unknown as SymptomReport
  assert(runAlertRules({ symptoms: [sym('ra máu nhẹ', 'severe')] }).some((r) => r.ruleId === 'symptom-danger'), 'symptom danger')
  assert(runAlertRules({ symptoms: [sym('mệt mỏi', 'severe')] }).some((r) => r.ruleId === 'symptom-severe'), 'symptom severe')

  // Nước/caffeine
  const a4 = runAlertRules({ water: { waterLoggedMl: 200, waterGoalMl: 2000, caffeineLoggedMg: 250, caffeineLimitMg: 200 } })
  assert(a4.some((r) => r.ruleId === 'water-low') && a4.some((r) => r.ruleId === 'caffeine-over'), 'water + caffeine')
  assert(runAlertRules({}).length === 0, 'no data → no alert')

  console.log('✅ alert-rules.demo OK')
}

if (process.argv[1]?.endsWith('alert-rules.ts')) demo()
