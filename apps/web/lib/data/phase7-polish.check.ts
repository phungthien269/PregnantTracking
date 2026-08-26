// Self-check Phase 7 polish — data layer (SQLite). Kiểm tra các mutation mới:
//   updateBirthRecord · deleteShoppingItem · updateShoppingItem · getWaterCaffeine thật
//   + export guard (không active user → throw ở method / 401 ở route).
// Chạy: scripts/test-web.sh (hoặc node --experimental-strip-types --import
// ./lib/library/node-loader.mjs lib/data/phase7-polish.check.ts)
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'

process.env.MEVABE_DB_PATH = join(tmpdir(), `mevabe-phase7-polish-${process.pid}.db`)
rmSync(process.env.MEVABE_DB_PATH, { force: true })

async function main(): Promise<void> {
  const { localApi } = await import('./local')
  const { setActiveUser } = await import('../auth/active-user')

  const DEMO_FAMILY = '10000000-0000-0000-0000-000000000001'
  const demoUser = {
    user_id: '10000000-0000-0000-0000-000000000002',
    family_id: DEMO_FAMILY,
    family_code: 'MEVABE',
    members: [],
  }
  setActiveUser(demoUser)

  // 1. updateBirthRecord: đổi ngày + loại sinh → getBirthRecord phản ánh; giữ field không gửi.
  const br = await localApi.addBirthRecord({
    birth_date: '2026-12-20',
    birth_type: 'vaginal',
    hospital: 'BV Từ Dũ',
    complications: [],
    notes: 'Ban đầu',
  })
  const updated = await localApi.updateBirthRecord(br.id, { birth_date: '2026-12-21', birth_type: 'c_section' })
  assert.equal(updated.id, br.id, 'updateBirthRecord trả đúng bản ghi')
  assert.equal(updated.birth_date, '2026-12-21', 'updateBirthRecord đổi birth_date')
  assert.equal(updated.birth_type, 'c_section', 'updateBirthRecord đổi birth_type')
  const seen = await localApi.getBirthRecord()
  assert.equal(seen?.id, br.id, 'updateBirthRecord → getBirthRecord thấy')
  assert.equal(seen?.birth_date, '2026-12-21', 'getBirthRecord phản ánh birth_date mới')
  assert.equal(seen?.birth_type, 'c_section', 'getBirthRecord phản ánh birth_type mới')
  assert.equal(seen?.hospital, 'BV Từ Dũ', 'updateBirthRecord giữ field không gửi')
  // KHÔNG để trống trường bắt buộc hiện có.
  await assert.rejects(() => localApi.updateBirthRecord(br.id, { birth_date: '' }), /birth_date/, 'birth_date trống bị chặn')

  // 2. updateShoppingItem / deleteShoppingItem → getShopping phản ánh.
  const item = await localApi.addShoppingItem({ name: 'Gối bầu', category: 'Mẹ', estimated_price: 400000 })
  const upd = await localApi.updateShoppingItem(item.id, { name: 'Gối chữ U', estimated_price: 450000, done: true })
  assert.equal(upd.name, 'Gối chữ U', 'updateShoppingItem đổi name')
  assert.equal(upd.estimated_price, 450000, 'updateShoppingItem đổi giá')
  assert.equal(upd.status, 'bought', 'updateShoppingItem done=true → bought')
  const found = (await localApi.getShopping()).find((s) => s.id === item.id)
  assert.equal(found?.name, 'Gối chữ U', 'getShopping thấy item đã sửa')
  assert.equal(found?.status, 'bought', 'getShopping thấy status đã sửa')
  await localApi.deleteShoppingItem(item.id)
  assert.equal((await localApi.getShopping()).some((s) => s.id === item.id), false, 'deleteShoppingItem → getShopping không thấy')

  // 3. getWaterCaffeine trả số liệu thật (cộng dồn sau addWater), không phải hằng số rỗng.
  assert.equal((await localApi.getWaterCaffeine()).waterLoggedMl, 1400, 'getWaterCaffeine seed 1400ml')
  await localApi.addWater({ logged_at: '2026-08-05T16:00:00+07:00', amount_ml: 250 })
  assert.equal((await localApi.getWaterCaffeine()).waterLoggedMl, 1650, 'getWaterCaffeine cộng dồn sau addWater')

  // 4. Export guard (mức method): deleteFamilyData KHÔNG active user → throw
  //    (route /api/v1/export trả 401 — smoke.sh test qua HTTP).
  setActiveUser(null)
  await assert.rejects(() => localApi.deleteFamilyData(), /đăng nhập/, 'deleteFamilyData không user → throw')

  setActiveUser(null)
  console.log('✅ phase7-polish.check PASS — data layer polish (update/delete/shopping/water/export-guard)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
