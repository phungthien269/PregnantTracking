// Self-check Phase 6 — foundation data layer (SQLite). Kiểm tra các method mới
// dùng chung cho các agent tính năng song song:
//   addAppointment/updateAppointment · addMealToShopping · addBudget/updateBudget
//   startPregnancy(fetalCount) · addFetus · condition plans/measurements
//   saveKnowledgeChunks/searchKnowledgeChunks · getContentVersions
// Chạy: scripts/test-web.sh (hoặc node --experimental-strip-types --import
// ./lib/library/node-loader.mjs lib/data/phase6.check.ts)
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'

process.env.MEVABE_DB_PATH = join(tmpdir(), `mevabe-phase6-check-${process.pid}.db`)
rmSync(process.env.MEVABE_DB_PATH, { force: true })

async function main(): Promise<void> {
  const { localApi } = await import('./local')

  // 1. Appointments — add + update (prescription/tasks_after)
  const apt = await localApi.addAppointment({
    type: 'prenatal',
    scheduled_at: '2026-09-01T08:00:00+07:00',
    location: 'Bệnh viện Phụ sản Hà Nội',
    doctor: 'TS.BS Nguyễn Thu Hà',
    summary_before: 'Chuẩn bị sổ khám',
  })
  assert.equal(apt.prescription, null, 'addAppointment prescription null mặc định')
  assert.equal(apt.tasks_after, null, 'addAppointment tasks_after null mặc định')
  const updated = await localApi.updateAppointment(apt.id, {
    outcome: 'Bé khỏe',
    prescription: 'Sắt 60mg mỗi ngày',
    tasks_after: ['Hẹn khám lại 4 tuần', 'Xét nghiệm nước tiểu'],
  })
  assert.equal(updated.outcome, 'Bé khỏe', 'updateAppointment outcome')
  assert.equal(updated.prescription, 'Sắt 60mg mỗi ngày', 'updateAppointment prescription')
  assert.deepEqual(updated.tasks_after, ['Hẹn khám lại 4 tuần', 'Xét nghiệm nước tiểu'], 'updateAppointment tasks_after')
  assert.equal(updated.doctor, 'TS.BS Nguyễn Thu Hà', 'updateAppointment giữ trường không gửi')

  // 2. Meal → shopping: 1 item / nguyên liệu
  const savedMeal = {
    id: 'meal-1',
    name: 'Cháo gà tía tô',
    meal_type: 'dinner',
    ingredients: ['Thịt gà', 'Tía tô', 'Gạo tẻ'],
  } as Parameters<typeof localApi.addMealToShopping>[0]
  const items = await localApi.addMealToShopping(savedMeal)
  assert.equal(items.length, 3, 'addMealToShopping tạo 3 item')
  assert.ok(items.every((i) => i.status === 'pending'), 'item mới đều pending')
  assert.ok(items.some((i) => i.name === 'Thịt gà'), 'item theo tên nguyên liệu')
  assert.ok(items.every((i) => i.note === 'Món: Cháo gà tía tô'), 'note ghi tên món')
  const shoppingAll = await localApi.getShopping()
  assert.ok(shoppingAll.length >= 3, 'shopping có item mới')

  // 3. Budget — add + update
  const b = await localApi.addBudget({ title: 'Mua sữa', amount: 300000, type: 'expense', category: 'Sữa', occurred_at: '2026-08-05' })
  const b2 = await localApi.updateBudget(b.id, { amount: 350000 })
  assert.equal(b2.amount, 350000, 'updateBudget amount')
  assert.equal(b2.title, 'Mua sữa', 'updateBudget giữ title')

  // 4. Đa thai: startPregnancy fetalCount=2 → 2 fetus; addFetus → 3
  const twin = await localApi.startPregnancy({ lmp: '2026-01-10', fetalCount: 2 })
  let fetuses = await localApi.getFetuses()
  const twinFetuses = fetuses.filter((f) => f.pregnancy_id === twin.id)
  assert.equal(twinFetuses.length, 2, 'startPregnancy fetalCount=2 tạo 2 fetus')
  assert.equal(twinFetuses[0]!.birth_order, 1, 'fetus 1 birth_order 1')
  assert.equal(twinFetuses[1]!.name, 'B', 'fetus 2 name B')
  const third = await localApi.addFetus({ name: 'C', birth_order: 3 })
  fetuses = await localApi.getFetuses()
  assert.ok(fetuses.some((f) => f.id === third.id && f.birth_order === 3), 'addFetus tạo fetus thứ 3')

  // 5. Condition plans + measurements
  const plan = await localApi.addConditionPlan({
    condition_type: 'gestational_diabetes',
    plan_text: 'Đo đường huyết đói mỗi sáng, ghi vào nhật ký.',
    doctor_notes: 'Mục tiêu < 5.1 mmol/L',
  })
  assert.equal((await localApi.getConditionPlans()).some((p) => p.id === plan.id), true, 'getConditionPlans thấy plan')
  const cm = await localApi.addConditionMeasurement({
    condition_plan_id: plan.id,
    type: 'fasting_glucose',
    value: 5.2,
    unit: 'mmol/L',
    measured_at: '2026-08-05T06:30:00+07:00',
  })
  const cms = await localApi.getConditionMeasurements()
  assert.ok(cms.some((m) => m.id === cm.id), 'getConditionMeasurements thấy measurement')

  // 6. Knowledge chunks — save + search
  await localApi.saveKnowledgeChunks('src-1', [
    { content: 'Acid folic phòng dị tật ống thần kinh', citation: 'Từ Dũ', position: 0 },
    { content: 'Sắt cần cho tạo máu của mẹ và bé', citation: 'Bộ Y tế', position: 1 },
  ])
  const found = await localApi.searchKnowledgeChunks('folic')
  assert.equal(found.length, 1, 'searchKnowledgeChunks tìm "folic" ra 1 chunk')
  assert.ok(found[0]!.content.includes('Acid folic'), 'chunk đúng nội dung')
  assert.equal((await localApi.searchKnowledgeChunks('không-có-từ-này')).length, 0, 'search không khớp → rỗng')
  assert.equal((await localApi.searchKnowledgeChunks('   ')).length, 0, 'query trống → rỗng')

  // 7. Content versions
  assert.equal((await localApi.getContentVersions('article', 'content-1')).length, 0, 'content_versions chưa có → rỗng')
  assert.equal((await localApi.getContentVersions('knowledge_source', 'src-1')).length, 0, 'content_versions theo source rỗng')

  console.log('✅ phase6.check PASS — Phase 6 foundation data layer')
}

main().catch((e) => {
  console.error('❌ phase6.check FAIL:', e)
  process.exit(1)
})
