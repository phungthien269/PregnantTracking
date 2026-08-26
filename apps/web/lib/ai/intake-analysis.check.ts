// ===========================================================================
// intake-analysis.check.ts — self-check Phân tích & chẩn đoán dinh dưỡng theo
// kỳ (Agent 6K). Chạy: scripts/test-web.sh (hoặc node --experimental-strip-types
// --import scripts/test-web-loader.mjs lib/ai/intake-analysis.check.ts)
//
// Kiểm tra:
//  1. analyzeIntake với summary có chất thiếu → danh sách đúng (pct, ngày thiếu,
//     món gợi ý, tuần thai).
//  2. Kỳ không có dữ liệu → deficiencies rỗng, không crash.
//  3. AI fallback: không có OPENROUTER_API_KEY → `ai: null` (KHÔNG crash).
//  4. Prompt AI chỉ chứa dữ liệu tổng hợp — không chứa từ khoá định danh/PII.
//  5. buildPeriodLabel đúng theo độ dài kỳ.
// ===========================================================================
import assert from 'node:assert/strict'
import { buildNutrientSummary } from '../nutrition/intake-calcs'
import { buildAiPrompt, buildPeriodLabel, generateAiNarrative, analyzeIntake } from './intake-analysis'

async function main(): Promise<void> {
  // ---- 1. Summary có chất thiếu → danh sách đúng ----
  const thin = buildNutrientSummary(
    '2026-08-05',
    '2026-08-05',
    [{ date: '2026-08-05', nutrients: { iron: 5 }, itemCount: 1 }],
    20,
  )
  const diag = await analyzeIntake(thin, { periodLabel: '7 ngày gần đây' })
  assert.ok(diag.deficiencies.length > 0, 'analyzeIntake: có chất thiếu')
  const ironDef = diag.deficiencies.find((d) => d.id === 'iron')
  assert.ok(ironDef, 'analyzeIntake: sắt nằm trong danh sách')
  assert.equal(ironDef!.pct, Math.round((5 / 27) * 100), 'analyzeIntake: % sắt đúng (5/27)')
  assert.equal(ironDef!.lowDays, 1, 'analyzeIntake: đếm đúng ngày thiếu')
  assert.ok(ironDef!.foodSuggestions.length > 0, 'analyzeIntake: có món gợi ý (foodSources)')
  assert.equal(diag.week, 20, 'analyzeIntake: giữ tuần thai')
  assert.equal(diag.dayCount, 1, 'analyzeIntake: đếm đúng ngày có nhật ký')

  // ---- 2. Kỳ không có dữ liệu → rỗng, không crash ----
  const empty = buildNutrientSummary('2026-01-01', '2026-01-02', [], null)
  const diagEmpty = await analyzeIntake(empty)
  assert.equal(diagEmpty.deficiencies.length, 0, 'kỳ rỗng → không có chất thiếu')
  assert.equal(diagEmpty.week, null, 'kỳ rỗng → giữ week null')
  assert.equal(diagEmpty.from, '2026-01-01', 'kỳ rỗng → giữ from')
  assert.equal(diagEmpty.dayCount, 0, 'kỳ rỗng → dayCount = 0 (UI nhắc ghi nhật ký)')

  // ---- 3. AI fallback: môi trường test không có key → `ai: null`, không crash ----
  assert.equal(diag.ai, null, 'không có OPENROUTER_API_KEY → ai null (không throw)')
  assert.equal(diagEmpty.ai, null, 'kỳ rỗng + không key → ai null')

  // ---- 4. Prompt chỉ tổng hợp — không có định danh/PII ----
  const prompt = buildAiPrompt(thin, diag.deficiencies, '7 ngày gần đây')
  assert.ok(/sắt/i.test(prompt), 'prompt chứa tên chất cần phân tích')
  assert.ok(/kỳ phân tích/i.test(prompt), 'prompt nhắc kỳ phân tích')
  assert.ok(!/(mẹ tên|tên mẹ|email|số điện thoại|sđt|họ và tên|user_id)/i.test(prompt), 'prompt không chứa từ khoá định danh/PII')

  // ---- 5. buildPeriodLabel ----
  assert.equal(buildPeriodLabel({ from: '2026-08-01', to: '2026-08-07' }), '7 ngày gần đây')
  assert.equal(buildPeriodLabel({ from: '2026-07-07', to: '2026-08-05' }), '30 ngày gần đây')
  assert.equal(buildPeriodLabel({ from: '2026-05-01', to: '2026-08-05' }), '3 tháng gần đây')

  // ---- 6. generateAiNarrative trả null khi không key / không dữ liệu (không crash) ----
  const narrative = await generateAiNarrative(thin, diag.deficiencies, '7 ngày gần đây')
  assert.equal(narrative, null, 'generateAiNarrative: không key → null')
  const narrEmpty = await generateAiNarrative(empty, [], '30 ngày gần đây')
  assert.equal(narrEmpty, null, 'generateAiNarrative: kỳ không dữ liệu → null (không gọi AI)')

  console.log('✅ intake-analysis.check PASS — deficiencies + prompt PII-safe + AI fallback (không key)')
}

main().catch((e) => {
  console.error('❌ intake-analysis.check FAIL:', (e as Error).message)
  process.exit(1)
})
