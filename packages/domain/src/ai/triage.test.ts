// ===========================================================================
// Test: phân loại triệu chứng — dấu hiệu nguy hiểm CỨNG (chạy trước AI).
// Logic nằm ở apps/web/lib/ai/symptom-triage.ts (tự chứa, chỉ import zod).
// Import động (chuỗi không phải literal) để TS KHÔNG kéo file apps/web vào
// chương trình typecheck của domain (apps/web dùng `process`, domain không có
// @types/node). Chạy runtime qua node-loader (thêm đuôi .ts).
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
  throws: (fn: () => void, msg?: string): void => {
    try {
      fn()
    } catch {
      return
    }
    throw new Error(`${msg ?? 'throws'} — không throw như mong đợi`)
  },
}

// ---- import động (specifier là biến để TS không resolve tĩnh) ----
const TRIAGE_SPEC: string = '../../../../apps/web/lib/ai/symptom-triage'
const triage = await import(TRIAGE_SPEC)
const { triageSymptom, dangerActions, extractJson, parseSymptomJson } = triage as {
  triageSymptom: (s: string, checked?: string[]) => { urgent: boolean; urgency: string; matched: string[]; reason: string }
  dangerActions: () => { actions: string[]; sources: string[] }
  extractJson: (t: string) => string
  parseSymptomJson: (t: string) => { possible_causes: string[]; actions: string[]; sources: string[] }
}

// ---- Dấu hiệu nguy hiểm (free-text) ----
test('mô tả tự do "đau bụng dữ dội + ra máu" → danger', () => {
  const r = triageSymptom('Đau bụng dữ dội từ chiều, kèm ra máu')
  assert.equal(r.urgent, true)
  assert.equal(r.urgency, 'danger')
  assert.ok(r.matched.length >= 2)
})
test('dấu hiệu sốt cao → danger', () => {
  const r = triageSymptom('sốt cao 39 độ từ đêm')
  assert.equal(r.urgency, 'danger')
  assert.ok(r.matched.includes('Sốt cao'))
})
test('không cảm nhận thai máy → danger', () => {
  const r = triageSymptom('hôm nay không cảm nhận thai máy')
  assert.equal(r.urgency, 'danger')
})

// ---- Dấu hiệu nguy hiểm (tích từ form checked) ----
test('checkedSigns truyền nhãn → danger dù mô tả rỗng', () => {
  const r = triageSymptom('', ['Ra máu âm đạo'])
  assert.equal(r.urgent, true)
  assert.equal(r.urgency, 'danger')
  assert.equal(r.matched.length, 1)
})
test('checkedSigns "Sốt cao" → danger', () => {
  const r = triageSymptom('', ['Sốt cao'])
  assert.equal(r.matched.length, 1)
  assert.equal(r.urgency, 'danger')
})

// ---- Warning / info ----
test('từ khóa lưu ý "đau bụng âm ỉ" → warning (không khẩn)', () => {
  const r = triageSymptom('đau bụng âm ỉ, hơi mệt')
  assert.equal(r.urgent, false)
  assert.equal(r.urgency, 'warning')
  assert.deepEqual(r.matched, [])
})
test('không có từ khóa → info', () => {
  const r = triageSymptom('mệt mỏi nhẹ cuối ngày')
  assert.equal(r.urgency, 'info')
  assert.equal(r.urgent, false)
})

// ---- Hành động khi khẩn ----
test('dangerActions: có gọi cấp cứu 115 + nguồn', () => {
  const d = dangerActions()
  assert.ok(d.actions.length >= 3)
  assert.ok(d.actions.some((a) => a.includes('115')))
  assert.ok(d.sources.length >= 2)
  assert.ok(d.sources.some((s) => s.includes('WHO')))
})

// ---- Parse JSON của AI (không khẩn) ----
test('extractJson bóc JSON khỏi markdown', () => {
  const raw = '```json\n{"possible_causes":["a"]}\n```'
  assert.equal(extractJson(raw), '{"possible_causes":["a"]}')
})
test('parseSymptomJson hợp lệ → dữ liệu', () => {
  const ai = parseSymptomJson('{"possible_causes":["x"],"actions":["y"],"sources":["z"]}')
  assert.equal(ai.actions[0], 'y')
})
test('parseSymptomJson thiếu mảng → throw', () => {
  assert.throws(() => parseSymptomJson('{"possible_causes":[]}'))
  assert.throws(() => parseSymptomJson('không có json'))
})

const failed = results.filter((r) => !r.ok)
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.err ? ' — ' + r.err : ''}`)
}
if (failed.length > 0) {
  throw new Error(`triage.test.ts: ${failed.length}/${results.length} test thất bại`)
}
console.log(`✅ triage.test.ts OK — ${results.length} test`)

export {}
