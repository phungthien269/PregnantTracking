// ===========================================================================
// phase6-6j.check.ts — self-check Theo dõi dinh dưỡng hằng ngày (Agent 6J).
// Chạy: scripts/test-web.sh (hoặc node --experimental-strip-types --import
// scripts/test-web-loader.mjs lib/data/phase6-6j.check.ts)
//
// Kiểm tra:
//  1. intake-calcs: tính vi chất item thật (meal/food/supplement) + custom→estimated.
//  2. intake-estimator: không có OPENROUTER_API_KEY → trả null (KHÔNG crash).
//  3. DataApi local: addDailyIntake → getDailyIntake trả log + items đúng.
//  4. Per-user: log của Mẹ KHÔNG trả cho Bố (private_owner_id).
//  5. getNutrientSummary: tổng theo ngày + so nhu cầu tuần thai.
// ===========================================================================
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'
import { setActiveUser } from '../auth/active-user'

process.env.MEVABE_DB_PATH = join(tmpdir(), `mevabe-6j-check-${process.pid}.db`)
rmSync(process.env.MEVABE_DB_PATH, { force: true })

const MOM = '10000000-0000-0000-0000-000000000002'
const DAD = '10000000-0000-0000-0000-000000000003'
const FAMILY = '10000000-0000-0000-0000-000000000001'

async function main(): Promise<void> {
  const { localApi } = await import('./local')
  const { computeItemNutrition, aggregateNutrients, buildNutrientSummary, analyzeDeficiencies, NUTRIENT_IDS } =
    await import('../nutrition/intake-calcs')
  const { estimateItemNutrients } = await import('../ai/intake-estimator')

  // ---- 1. intake-calcs: số liệu thật ----
  const itemMeal = { kind: 'meal' as const, name: 'Phở bò', ref_id: 'pho-bo', qty: 1 }
  const itemPill = { kind: 'supplement' as const, name: 'Viên sắt', dose_mg: 27, pills: 1 }
  const pho = computeItemNutrition(itemMeal)
  assert.equal(pho.estimated, false, 'phở bò (meal) phải dùng số liệu thật')
  assert.ok((pho.nutrients.iron ?? 0) > 2, 'phở bò có sắt (thịt bò + rau)')
  assert.ok((pho.nutrients.protein ?? 0) > 15, 'phở bò có đạm')

  const rauNgot = computeItemNutrition({ kind: 'food', name: 'Rau ngót', ref_id: 'rau-ngot', amount_g: 100 })
  assert.equal(rauNgot.estimated, false, 'rau ngót (food) dùng per100g')
  assert.ok(Math.abs((rauNgot.nutrients.iron ?? 0) - 2.7) < 0.2, `rau ngót 100g sắt ~2.7 (được ${rauNgot.nutrients.iron})`)

  const ironPill = computeItemNutrition(itemPill)
  assert.equal(ironPill.estimated, false, 'TPCN sắt nhận diện được')
  assert.equal(ironPill.nutrients.iron, 27, 'TPCN sắt 27 mg × 1 viên')

  const custom = computeItemNutrition({ kind: 'custom', name: 'Bún ốc', amount_g: 300 })
  assert.equal(custom.estimated, true, 'món không rõ → estimated=true')
  assert.equal(Object.keys(custom.nutrients).length, 0, 'món không rõ → nutrients rỗng (chờ AI)')

  // ---- 2. intake-estimator: không key → null, không crash ----
  const aiNull = await estimateItemNutrients({ kind: 'custom', name: 'Bún ốc', amount_g: 300 })
  assert.equal(aiNull, null, 'AI không có key → null (không throw)')

  // ---- aggregate + summary thuần ----
  const agg = aggregateNutrients([ironPill, pho])
  assert.ok((agg.iron ?? 0) > 27, 'aggregate cộng dồn sắt')
  const sum = buildNutrientSummary(
    '2026-08-05',
    '2026-08-05',
    [{ date: '2026-08-05', nutrients: agg, itemCount: 2 }],
    20,
  )
  assert.equal(sum.week, 20, 'summary giữ week')
  const ironTotal = sum.totals.find((t) => t.id === 'iron')!
  assert.ok(ironTotal.need === 27, 'nhu cầu sắt tuần 20 = 27 mg')
  assert.ok(ironTotal.pct === Math.round((ironTotal.amount / 27) * 100), '% đủ sắt đúng công thức')
  assert.equal(NUTRIENT_IDS.length, 15, 'đủ 15 vi chất chuẩn')

  // ---- 3. DataApi local: add → get ----
  // Route POST /daily-intake tính vi chất TRƯỚC khi gọi addDailyIntake → check
  // làm y hệt (precompute bằng computeItemNutrition, như route).
  const prepped = [
    { ...itemMeal, ...computeItemNutrition(itemMeal) },
    { ...itemPill, ...computeItemNutrition(itemPill) },
  ]
  setActiveUser({ user_id: MOM, family_id: FAMILY, family_code: 'MEVABE', members: [] })
  const log = await localApi.addDailyIntake({
    date: '2026-08-05',
    note: 'Ngày test',
    items: prepped,
  })
  assert.equal(log.items.length, 2, 'log lưu đủ 2 items')
  assert.equal(log.private_owner_id, MOM, 'log gắn private_owner_id = người tạo (Mẹ)')

  const got = await localApi.getDailyIntake(log.id)
  assert.ok(got, 'getDailyIntake trả log')
  assert.equal(got!.items.length, 2, 'getDailyIntake kèm items')
  assert.ok((got!.items[0]!.nutrients.iron ?? 0) > 0, 'item meal có vi chất thật')
  assert.equal(got!.items[1]!.nutrients.iron, 27, 'item TPCN sắt = 27')

  // ---- 4. Per-user: Bố không thấy log riêng của Mẹ ----
  setActiveUser({ user_id: DAD, family_id: FAMILY, family_code: 'MEVABE', members: [] })
  const asDad = await localApi.getDailyIntake(log.id)
  assert.equal(asDad, null, 'Bố KHÔNG thấy log riêng của Mẹ')
  const dadHistory = await localApi.listIntakeHistory(50)
  assert.ok(!dadHistory.some((l) => l.id === log.id), 'Bố không thấy log Mẹ trong lịch sử')

  setActiveUser({ user_id: MOM, family_id: FAMILY, family_code: 'MEVABE', members: [] })
  const momHistory = await localApi.listIntakeHistory(50)
  assert.ok(momHistory.some((l) => l.id === log.id), 'Mẹ thấy log của mình')

  // ---- 5. getNutrientSummary theo kỳ ----
  const summary = await localApi.getNutrientSummary({ from: '2026-08-05', to: '2026-08-05' })
  assert.equal(summary.days.length, 1, 'summary 1 ngày')
  assert.equal(summary.days[0]!.itemCount, 2, 'summary count đúng items')
  const sIron = summary.totals.find((t) => t.id === 'iron')!
  assert.ok(sIron.amount > 27, `summary sắt gộp (${sIron.amount}) gồm meal + TPCN`)
  assert.ok(sIron.need === 27 && sIron.pct! > 100, 'summary so nhu cầu: sắt >100% (meal + TPCN)')

  // Kỳ khác → rỗng
  const empty = await localApi.getNutrientSummary({ from: '2026-01-01', to: '2026-01-02' })
  assert.equal(empty.days.length, 0, 'summary kỳ không có log → days rỗng')

  // ---- 6. Mock layer (mockApi) — cùng hành vi, per-user ----
  const { mockApi } = await import('./mock')
  const mLog = await mockApi.addDailyIntake({
    date: '2026-08-04',
    items: [{ kind: 'supplement', name: 'Viên canxi', dose_mg: 500, pills: 1, nutrients: { calcium: 500 }, estimated: false }],
  })
  assert.equal(mLog.items.length, 1, 'mock: log có 1 item')
  assert.equal(mLog.private_owner_id, MOM, 'mock: private_owner_id = người tạo')
  setActiveUser({ user_id: DAD, family_id: FAMILY, family_code: 'MEVABE', members: [] })
  assert.equal(await mockApi.getDailyIntake(mLog.id), null, 'mock: Bố không thấy log của Mẹ')
  setActiveUser({ user_id: MOM, family_id: FAMILY, family_code: 'MEVABE', members: [] })
  assert.ok((await mockApi.listIntakeHistory(10)).some((l) => l.id === mLog.id), 'mock: Mẹ thấy log')
  const mSum = await mockApi.getNutrientSummary({ from: '2026-08-04', to: '2026-08-04' })
  assert.equal(mSum.days[0]!.itemCount, 1, 'mock: summary đúng itemCount')
  assert.ok((mSum.totals.find((t) => t.id === 'calcium')?.amount ?? 0) === 500, 'mock: summary canxi = 500')

  // ---- 7. analyzeDeficiencies — chất thiếu dai dẳng (mục tiêu #5) ----
  const thin = buildNutrientSummary(
    '2026-08-05',
    '2026-08-05',
    [{ date: '2026-08-05', nutrients: { iron: 5 }, itemCount: 1 }],
    20,
  )
  const defs = analyzeDeficiencies(thin, 80)
  assert.ok(defs.length > 0, 'analyzeDeficiencies: có chất thiếu')
  const ironDef = defs.find((d) => d.id === 'iron')
  assert.ok(ironDef, 'analyzeDeficiencies: sắt nằm trong danh sách thiếu')
  assert.ok(ironDef!.lowDays === 1 && ironDef!.totalDays === 1, 'analyzeDeficiencies: đếm đúng ngày thiếu')
  assert.ok(ironDef!.foodSuggestions.length > 0, 'analyzeDeficiencies: có món gợi ý (foodSources)')
  const noDef = analyzeDeficiencies(buildNutrientSummary('2026-08-05', '2026-08-05', [{ date: '2026-08-05', nutrients: { iron: 100, folate: 600, protein: 80 }, itemCount: 1 }], 20), 80)
  assert.equal(noDef.length, 0, 'analyzeDeficiencies: đủ chất → không có thiếu')

  console.log('✅ phase6-6j.check PASS — daily nutrition tracking (calc + AI fallback + local + mock + per-user + summary + deficiencies)')
}

main().catch((e) => {
  console.error('❌ phase6-6j.check FAIL:', (e as Error).message)
  process.exit(1)
})
