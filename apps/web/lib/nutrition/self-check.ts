// ===========================================================================
// self-check.ts — kiểm tra dữ liệu dinh dưỡng Phase 6B (tự động, chạy bằng node).
// Chạy: scripts/test-web.sh (tự phát hiện) hoặc trực tiếp:
//   node --experimental-strip-types --import scripts/test-web-loader.mjs \
//     apps/web/lib/nutrition/self-check.ts
// Kiểm tra: đủ tuần/chất, số liệu hợp lệ (không NaN/âm), nguồn trích dẫn có URL,
// khuyến nghị không vượt UL. Exit ≠ 0 khi FAIL.
// ===========================================================================

import { NUTRIENT_REFERENCES } from './nutrient-reference-data'
import { getWeeklyFocus, WEEKLY_FOCUS } from './weekly-focus-data'
import { FOOD_SAFETY_ITEMS, foodSafetyForTrimester, highSeverityFoodSafetyItems } from './food-safety-data'
import { getSupplementRecommendation, SUPPLEMENT_RECOMMENDATIONS } from './supplement-data'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
}

const isFiniteNonNeg = (v: number | null): boolean =>
  v === null || (Number.isFinite(v) && v >= 0)

const urlOk = (u: string): boolean => /^https?:\/\//.test(u)

let n = 0
const test = (name: string, fn: () => void): void => {
  n++
  try {
    fn()
    console.log(`  ✔ ${n}. ${name}`)
  } catch (e) {
    console.error(`  ✘ ${n}. ${name} — ${(e as Error).message}`)
    throw e
  }
}

// ---- NUTRIENT REFERENCE ----
test('vit chất: đủ ≥29 chất và có id/name/unit', () => {
  assert(NUTRIENT_REFERENCES.length >= 29, `số chất = ${NUTRIENT_REFERENCES.length} (cần ≥29)`)
  const ids = new Set<string>()
  for (const ref of NUTRIENT_REFERENCES) {
    assert(ref.id.length > 0, `id rỗng`)
    assert(!ids.has(ref.id), `id trùng: ${ref.id}`)
    ids.add(ref.id)
    assert(ref.name.length > 0, `${ref.id}: name rỗng`)
    assert(ref.unit.length > 0, `${ref.id}: unit rỗng`)
  }
})

test('vit chất: nhu cầu T1/T2/T3 hợp lệ (không NaN/âm)', () => {
  for (const ref of NUTRIENT_REFERENCES) {
    for (const t of ['T1', 'T2', 'T3'] as const) {
      const amt = ref.needs[t]
      assert(isFiniteNonNeg(amt.value), `${ref.id} ${t}: value không hợp lệ (${amt.value})`)
      assert(amt.display.length > 0, `${ref.id} ${t}: display rỗng`)
    }
  }
})

test('vit chất: dải bổ sung hợp lệ và không vượt UL', () => {
  for (const ref of NUTRIENT_REFERENCES) {
    const { min, max } = ref.supplementRange
    assert(isFiniteNonNeg(min), `${ref.id}: supplementRange.min không hợp lệ (${min})`)
    assert(isFiniteNonNeg(max), `${ref.id}: supplementRange.max không hợp lệ (${max})`)
    if (min !== null && max !== null) {
      assert(min <= max, `${ref.id}: supplementRange min > max (${min} > ${max})`)
    }
    if (ref.ul !== null) {
      assert(Number.isFinite(ref.ul) && ref.ul > 0, `${ref.id}: UL không hợp lệ (${ref.ul})`)
      // Khuyến nghị (dải bổ sung) không được vượt UL.
      if (max !== null) assert(max <= ref.ul, `${ref.id}: bổ sung tối đa ${max} vượt UL ${ref.ul}`)
    }
    assert(ref.foodSources.length > 0, `${ref.id}: foodSources rỗng`)
    assert(ref.impactFetus.length > 0 && ref.impactMother.length > 0, `${ref.id}: tác động rỗng`)
  }
})

test('vit chất: magie (magnesium) có nhu cầu cụ thể, UL đúng dạng bổ sung và nguồn', () => {
  const mg = NUTRIENT_REFERENCES.find((r) => r.id === 'magnesium')
  assert(mg !== undefined, 'thiếu nutrient "magnesium"')
  const m = mg!
  assert(
    m.needs.T1.value !== null && m.needs.T2.value !== null && m.needs.T3.value !== null,
    'magnesium: nhu cầu T1/T2/T3 phải có số cụ thể',
  )
  assert(m.ul === 350, `magnesium: UL phải là 350 mg (dạng bổ sung), gặp ${m.ul}`)
  assert(m.citations.length > 0 && m.citations.every((c) => urlOk(c.url)), 'magnesium: thiếu nguồn URL hợp lệ')
})

test('vit chất: mọi nguồn trích dẫn có URL hợp lệ', () => {
  for (const ref of NUTRIENT_REFERENCES) {
    assert(ref.citations.length > 0, `${ref.id}: chưa có nguồn`)
    for (const c of ref.citations) {
      assert(c.org.length > 0, `${ref.id}: nguồn thiếu tổ chức`)
      assert(urlOk(c.url), `${ref.id}: URL không hợp lệ (${c.url})`)
    }
  }
})

// ---- WEEKLY FOCUS ----
test('tuần: phủ đủ 1–40, không gap/overlap, tuần hợp lệ', () => {
  const sorted = [...WEEKLY_FOCUS].sort((a, b) => a.weekStart - b.weekStart)
  assert(sorted.length > 0, 'weekly focus rỗng')
  // Dùng con trỏ để kiểm tra liền mạch — tránh truy cập theo index (noUncheckedIndexedAccess).
  let expectedStart = 1
  for (const g of sorted) {
    assert(g.weekStart === expectedStart, `gap/overlap: cần tuần ${expectedStart}, gặp ${g.weekStart}`)
    assert(g.weekEnd >= g.weekStart, `tuần ${g.weekStart}: weekEnd < weekStart`)
    assert(g.weekEnd <= 40, `tuần ${g.weekStart}: weekEnd > 40`)
    expectedStart = g.weekEnd + 1
  }
  assert(expectedStart === 41, `phải kết thúc tuần 40 (kết thúc tuần ${expectedStart - 1})`)
  // Từng tuần 1–40 đều nằm trong một nhóm.
  for (let w = 1; w <= 40; w++) {
    assert(WEEKLY_FOCUS.some((g) => g.weekStart <= w && w <= g.weekEnd), `tuần ${w} không được phủ`)
  }
})

test('tuần: mỗi nhóm có trọng tâm, món gợi ý, tam cá nguyệt, nguồn URL', () => {
  for (const g of WEEKLY_FOCUS) {
    assert(['T1', 'T2', 'T3'].includes(g.trimester), `tuần ${g.weekStart}: trimester không hợp lệ`)
    assert(g.phaseLabel.length > 0, `tuần ${g.weekStart}: phaseLabel rỗng`)
    assert(g.focus.length >= 2 && g.focus.length <= 4, `tuần ${g.weekStart}: trọng tâm phải 2–4 chất (có ${g.focus.length})`)
    for (const f of g.focus) {
      assert(NUTRIENT_REFERENCES.some((ref) => ref.id === f.nutrientId), `tuần ${g.weekStart}: nutrientId "${f.nutrientId}" không có trong nutrient-reference-data`)
      assert(f.reason.length > 0, `tuần ${g.weekStart}: lý do chất ${f.nutrientId} rỗng`)
    }
    assert(g.suggestedFoods.length > 0, `tuần ${g.weekStart}: suggestedFoods rỗng`)
    assert(g.citations.length > 0 && g.citations.every((c) => urlOk(c.url)), `tuần ${g.weekStart}: nguồn URL không hợp lệ`)
  }
})

test('tuần: getWeeklyFocus() trả đúng nhóm', () => {
  assert(getWeeklyFocus(1)?.weekStart === 1, 'tuần 1 → nhóm tuần 1–4')
  assert(getWeeklyFocus(40)?.weekEnd === 40, 'tuần 40 → nhóm 38–40')
  assert(getWeeklyFocus(20)?.weekStart === 17, 'tuần 20 → nhóm 17–20')
  assert(getWeeklyFocus(0) === null, 'tuần 0 → null')
  assert(getWeeklyFocus(41) === null, 'tuần 41 → null')
})

// ---- FOOD SAFETY ----
test('an toàn thực phẩm: cấu trúc hợp lệ, có cả nhóm tránh và hạn chế', () => {
  assert(FOOD_SAFETY_ITEMS.length > 0, 'danh sách rỗng')
  assert(FOOD_SAFETY_ITEMS.some((i) => i.category === 'avoid'), 'không có mục "tránh"')
  assert(FOOD_SAFETY_ITEMS.some((i) => i.category === 'limit'), 'không có mục "hạn chế"')
  for (const item of FOOD_SAFETY_ITEMS) {
    assert(['avoid', 'limit'].includes(item.category), `${item.id}: category không hợp lệ`)
    assert(['high', 'medium'].includes(item.severity), `${item.id}: severity không hợp lệ`)
    assert(item.item.length > 0 && item.reason.length > 0, `${item.id}: thiếu nội dung`)
    assert(item.appliesTo === 'all' || item.appliesTo.every((t) => ['T1', 'T2', 'T3'].includes(t)), `${item.id}: appliesTo không hợp lệ`)
    assert(item.citations.length > 0 && item.citations.every((c) => urlOk(c.url)), `${item.id}: nguồn URL không hợp lệ`)
    if (item.category === 'limit' && item.maxAmount) assert(item.maxAmount.length > 0, `${item.id}: maxAmount rỗng`)
  }
})

test('an toàn thực phẩm: có đủ mục cảnh báo quan trọng', () => {
  const ids = new Set(FOOD_SAFETY_ITEMS.map((i) => i.id))
  for (const must of ['alcohol', 'high_mercury_fish', 'raw_milk', 'raw_eggs', 'raw_meat', 'raw_seafood', 'liver', 'caffeine']) {
    assert(ids.has(must), `thiếu mục an toàn "${must}"`)
  }
})

test('an toàn thực phẩm: foodSafetyForTrimester() trả không rỗng cho mọi tam cá nguyệt', () => {
  for (const t of ['T1', 'T2', 'T3'] as const) {
    const list = foodSafetyForTrimester(t)
    assert(list.length > 0, `T${t}: danh sách rỗng`)
    assert(list.every((i) => i.appliesTo === 'all' || i.appliesTo.includes(t)), `T${t}: lọc sai`)
  }
  assert(highSeverityFoodSafetyItems().length >= 4, 'thiếu mục severity high')
})

// ---- SUPPLEMENTS ----
test('bổ sung: cấu trúc hợp lệ và có nguồn URL', () => {
  assert(SUPPLEMENT_RECOMMENDATIONS.length >= 8, `số bổ sung = ${SUPPLEMENT_RECOMMENDATIONS.length} (cần ≥8)`)
  const ids = new Set<string>()
  for (const s of SUPPLEMENT_RECOMMENDATIONS) {
    assert(s.id.length > 0 && !ids.has(s.id), `id bổ sung không hợp lệ/trùng: ${s.id}`)
    ids.add(s.id)
    assert(s.name.length > 0 && s.dose.length > 0, `${s.id}: thiếu tên/liều`)
    assert(s.timing.length > 0 && s.stage.length > 0, `${s.id}: thiếu thời điểm/giai đoạn`)
    assert(s.doctorNeeded.length > 0, `${s.id}: thiếu mục "cần bác sĩ"`)
    assert(s.citations.length > 0 && s.citations.every((c) => urlOk(c.url)), `${s.id}: nguồn URL không hợp lệ`)
  }
})

test('bổ sung: cảnh báo thừa cho các chất dễ thừa', () => {
  for (const id of ['folic_acid', 'iron_supplement', 'vitamin_d_supplement', 'calcium_supplement', 'iodine_supplement', 'vitamin_a_warning', 'zinc_supplement']) {
    const s = getSupplementRecommendation(id)
    assert(s !== undefined, `thiếu bổ sung "${id}"`)
    assert(s?.excessWarning, `${id}: thiếu cảnh báo thừa`)
  }
})

console.log(`\n✅ self-check nutrition data OK — ${n} test`)
