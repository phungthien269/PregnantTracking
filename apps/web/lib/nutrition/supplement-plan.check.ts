// ===========================================================================
// supplement-plan.check.ts — kiểm tra KẾ HOẠCH BỔ SUNG THEO TAM CÁ NGUYỆT.
// Chạy tự động qua scripts/test-web.sh (tự phát hiện *.check.ts) hoặc trực tiếp:
//   node --experimental-strip-types --import scripts/test-web-loader.mjs \
//     apps/web/lib/nutrition/supplement-plan.check.ts
// Kiểm tra:
//   1. Đủ 4 giai đoạn (Trước thai / T1 / T2 / T3), mỗi giai đoạn ≥3 mục và ≥3 mục
//      "KHÔNG NÊN THIẾU" (essential).
//   2. Mọi mục có id duy nhất, tên/liều/thời điểm, và ≥1 nguồn URL hợp lệ.
//   3. nutrientRefId/supplementId trỏ đúng vào nutrient-reference-data / supplement-data.
//   4. KHÔNG vượt UL: doseMax (có số) ≤ supplementRange.max của nutrient tương ứng.
// Exit ≠ 0 khi FAIL.
// ===========================================================================

import { SUPPLEMENT_PLAN, getStagePlan } from './supplement-plan'
import { getNutrientReference } from './nutrient-reference-data'
import { getSupplementRecommendation } from './supplement-data'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
}

const urlOk = (u: string): boolean => /^https?:\/\//.test(u)

const STAGE_IDS = ['preconception', 'T1', 'T2', 'T3'] as const

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

test('plan: đủ 4 giai đoạn đúng thứ tự và getStagePlan() trả đúng', () => {
  assert(SUPPLEMENT_PLAN.length === 4, `số giai đoạn = ${SUPPLEMENT_PLAN.length} (cần 4)`)
  assert(
    SUPPLEMENT_PLAN.map((s) => s.stageId).join(',') === STAGE_IDS.join(','),
    `thứ tự giai đoạn sai (${SUPPLEMENT_PLAN.map((s) => s.stageId).join(',')})`,
  )
  for (const id of STAGE_IDS) {
    assert(getStagePlan(id)?.stageId === id, `getStagePlan("${id}") không trả đúng giai đoạn`)
  }
})

test('plan: mỗi giai đoạn có ≥3 mục và ≥3 mục KHÔNG NÊN THIẾU (essential)', () => {
  const ids = new Set<string>()
  for (const stage of SUPPLEMENT_PLAN) {
    assert(stage.label.length > 0 && stage.weeks.length > 0, `${stage.stageId}: thiếu nhãn/tuần`)
    assert(stage.items.length >= 3, `${stage.stageId}: chỉ có ${stage.items.length} mục (cần ≥3)`)
    const essentialCount = stage.items.filter((i) => i.essential).length
    assert(essentialCount >= 3, `${stage.stageId}: chỉ có ${essentialCount} mục KHÔNG NÊN THIẾU (cần ≥3)`)
    for (const item of stage.items) {
      assert(item.id.length > 0 && !ids.has(item.id), `${stage.stageId}: id trùng/rỗng "${item.id}"`)
      ids.add(item.id)
      assert(item.name.length > 0 && item.dose.length > 0, `${item.id}: thiếu tên/liều`)
      assert(item.timing.length > 0 && item.startStop.length > 0, `${item.id}: thiếu thời điểm/bắt đầu-dừng`)
    }
  }
})

test('plan: mọi mục có ≥1 nguồn với URL hợp lệ', () => {
  for (const stage of SUPPLEMENT_PLAN) {
    for (const item of stage.items) {
      assert(item.sources.length > 0, `${item.id}: chưa có nguồn`)
      for (const c of item.sources) {
        assert(c.org.length > 0, `${item.id}: nguồn thiếu tổ chức`)
        assert(urlOk(c.url), `${item.id}: URL không hợp lệ (${c.url})`)
      }
    }
  }
})

test('plan: nutrientRefId / supplementId trỏ đúng (nếu có)', () => {
  for (const stage of SUPPLEMENT_PLAN) {
    for (const item of stage.items) {
      if (item.nutrientRefId) {
        assert(getNutrientReference(item.nutrientRefId) !== undefined, `${item.id}: nutrientRefId "${item.nutrientRefId}" không có trong nutrient-reference-data`)
      }
      if (item.supplementId) {
        assert(getSupplementRecommendation(item.supplementId) !== undefined, `${item.id}: supplementId "${item.supplementId}" không có trong supplement-data`)
      }
    }
  }
})

test('plan: KHÔNG mục nào vượt dải bổ sung an toàn (supplementRange.max) — so nutrient-reference-data', () => {
  for (const stage of SUPPLEMENT_PLAN) {
    for (const item of stage.items) {
      if (item.doseMax === null) continue // mục cảnh báo/không có số (VD vitamin A) → bỏ qua
      const ref = getNutrientReference(item.nutrientRefId ?? '')
      assert(ref !== undefined, `${item.id}: doseMax có số nhưng thiếu nutrientRefId hợp lệ`)
      const max = ref!.supplementRange.max
      if (max !== null) {
        assert(
          item.doseMax <= max,
          `${item.id}: liều tối đa ${item.doseMax} (đơn vị ${ref!.unit}) VƯỢT supplementRange.max ${max} — không an toàn`,
        )
      }
    }
  }
})

test('plan: mục "KHÔNG NÊN THIẾU" nào cũng có số liều để check UL', () => {
  for (const stage of SUPPLEMENT_PLAN) {
    for (const item of stage.items) {
      if (item.essential) {
        assert(item.doseMax !== null && item.nutrientRefId !== undefined, `${item.id}: mục KHÔNG NÊN THIẾU phải có doseMax + nutrientRefId`)
      }
    }
  }
})

console.log(`\n✅ supplement-plan check OK — ${n} test (4 giai đoạn, ${SUPPLEMENT_PLAN.reduce((t, s) => t + s.items.length, 0)} mục, không vượt UL)`)
