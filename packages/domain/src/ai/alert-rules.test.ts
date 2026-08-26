// ===========================================================================
// Test: rule engine (alert-rules.ts) — huyết áp, đường huyết, triệu chứng,
// và ngưỡng nước/caffeine. Logic nằm ở apps/web/lib/ai/alert-rules.ts (tự
// chứa). Import động (chuỗi không phải literal) để TS KHÔNG kéo file apps/web
// vào typecheck của domain (apps/web dùng `process`, domain không có
// @types/node). Cảnh báo KHẨN chỉ đến từ đây, không từ AI.
// ===========================================================================

// ---- assert cục bộ (pattern demo() của domain) ----
const results: { name: string; ok: boolean; err?: string }[] = []
const test = (name: string, fn: () => void): void => {
  try {
    fn()
    results.push({ name, ok: true })
  } catch (e) {
    results.push({ name, ok: false, err: (e as Error).message })
  }
}
const assert = {
  equal: (a: unknown, b: unknown, msg?: string): void => {
    if (a !== b) throw new Error(`${msg ?? 'equal'} — expected ${String(b)}, got ${String(a)}`)
  },
  ok: (cond: unknown, msg?: string): void => {
    if (!cond) throw new Error(msg ?? 'ok')
  },
  deepEqual: (a: unknown, b: unknown, msg?: string): void => {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      throw new Error(`${msg ?? 'deepEqual'} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
    }
  },
}

// ---- import động (specifier là biến để TS không resolve tĩnh) ----
const ALERTS_SPEC: string = '../../../../apps/web/lib/ai/alert-rules'
const alerts = await import(ALERTS_SPEC)
const { runAlertRules } = alerts as {
  runAlertRules: (input: Record<string, unknown>) => { ruleId: string; severity: string; message: string }[]
}

const base = {
  id: 'id',
  family_id: 'fam',
  private_owner_id: null,
  created_at: '2026-08-01T08:00:00+07:00',
  updated_at: '2026-08-01T08:00:00+07:00',
  pregnancy_id: 'p',
  unit: 'mmHg',
  taken_at: '2026-08-01T08:00:00+07:00',
  note: null,
}
const bp = (value: number, diastolic: number): Record<string, unknown> => ({ ...base, type: 'blood_pressure', value, diastolic })
const sym = (symptom: string, severity: string, note: string | null = null): Record<string, unknown> => ({
  ...base,
  type: 'blood_pressure',
  symptom,
  severity,
  started_at: base.taken_at,
  source: 'manual',
  note,
})

// ---- Huyết áp ----
test('BP 165/110 → critical (nguy cơ tiền sản giật)', () => {
  const r = runAlertRules({ measurements: [bp(165, 110)] })
  assert.ok(r.some((a) => a.ruleId === 'bp-crisis' && a.severity === 'critical'))
})
test('BP 145/92 → warning; 139/89 → không cảnh báo', () => {
  assert.ok(runAlertRules({ measurements: [bp(145, 92)] }).some((a) => a.ruleId === 'bp-high'))
  assert.equal(runAlertRules({ measurements: [bp(139, 89)] }).length, 0)
})

// ---- Đường huyết ----
test('đường huyết ≥ 11.1 → warning', () => {
  const m = { ...base, type: 'blood_glucose', value: 12.4, unit: 'mmol/L' }
  assert.ok(runAlertRules({ measurements: [m] }).some((a) => a.ruleId === 'glucose-high'))
})

// ---- Triệu chứng ----
test('triệu chứng chứa dấu hiệu nguy hiểm → critical', () => {
  const r = runAlertRules({ symptoms: [sym('ra máu nhẹ', 'severe')] })
  assert.ok(r.some((a) => a.ruleId === 'symptom-danger' && a.severity === 'critical'))
})
test('triệu chứng severe nhưng không nguy hiểm → warning; mild → không', () => {
  assert.ok(runAlertRules({ symptoms: [sym('mệt mỏi', 'severe')] }).some((a) => a.ruleId === 'symptom-severe'))
  assert.equal(runAlertRules({ symptoms: [sym('mệt mỏi', 'mild')] }).length, 0)
})

// ---- Nước/caffeine: sum theo ngày + ngưỡng ----
test('caffeine vượt ngưỡng 200mg/ngày → warning', () => {
  const r = runAlertRules({
    water: { waterLoggedMl: 1200, waterGoalMl: 2000, caffeineLoggedMg: 250, caffeineLimitMg: 200 },
  })
  assert.ok(r.some((a) => a.ruleId === 'caffeine-over' && a.severity === 'warning'))
})
test('caffeine đúng ngưỡng (200/200) → không cảnh báo', () => {
  const r = runAlertRules({
    water: { waterLoggedMl: 1200, waterGoalMl: 2000, caffeineLoggedMg: 200, caffeineLimitMg: 200 },
  })
  assert.ok(!r.some((a) => a.ruleId === 'caffeine-over'))
})
test('uống nước dưới 50% mục tiêu → info nhắc nhở', () => {
  const r = runAlertRules({
    water: { waterLoggedMl: 800, waterGoalMl: 2000, caffeineLoggedMg: 0, caffeineLimitMg: 200 },
  })
  assert.ok(r.some((a) => a.ruleId === 'water-low' && a.severity === 'info'))
})
test('uống đúng 50% mục tiêu → KHÔNG nhắc (ngưỡng < 50% là chặt)', () => {
  const r = runAlertRules({
    water: { waterLoggedMl: 1000, waterGoalMl: 2000, caffeineLoggedMg: 0, caffeineLimitMg: 200 },
  })
  assert.ok(!r.some((a) => a.ruleId === 'water-low'))
})
test('sum log theo ngày → đưa vào ngưỡng: 2 ly cà phê = 250mg → over', () => {
  // Giả lập log caffeine trong ngày (cùng ngày), sum lại như supabase getWaterCaffeine
  const caffeineLogs = [
    { amount_mg: 150, logged_at: '2026-08-03T08:00:00+07:00' },
    { amount_mg: 100, logged_at: '2026-08-03T15:00:00+07:00' },
  ]
  const caffeineTodayMg = caffeineLogs.reduce((acc, l) => acc + (l.amount_mg ?? 0), 0)
  const r = runAlertRules({
    water: { waterLoggedMl: 1000, waterGoalMl: 2000, caffeineLoggedMg: caffeineTodayMg, caffeineLimitMg: 200 },
  })
  assert.equal(caffeineTodayMg, 250)
  assert.ok(r.some((a) => a.ruleId === 'caffeine-over'))
})

// ---- Rỗng ----
test('không có dữ liệu → không cảnh báo', () => {
  assert.deepEqual(runAlertRules({}), [])
})

const failed = results.filter((r) => !r.ok)
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.err ? ' — ' + r.err : ''}`)
}
if (failed.length > 0) {
  throw new Error(`alert-rules.test.ts: ${failed.length}/${results.length} test thất bại`)
}
console.log(`✅ alert-rules.test.ts OK — ${results.length} test`)

export {}
