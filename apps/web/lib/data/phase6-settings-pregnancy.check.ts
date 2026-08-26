// Self-check Agent SETTINGS-PREG — CHỈNH SỬA THÔNG TIN THAI KỲ (đổi LMP/EDD).
// Kiểm chứng (trên SQLite local):
//   updatePregnancy({ lmp mới }) → getPregnancy trả lmp/edd mới;
//   edd tự tính đúng 40 tuần (Naegele) khi không truyền edd;
//   weekFromLmp với lmp mới thay đổi đúng;
//   edd truyền tường minh được giữ; edd <= lmp bị từ chối.
// Chạy tự động qua scripts/test-web.sh (mọi *.check.ts dưới apps/web).
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'

process.env.MEVABE_DB_PATH = join(tmpdir(), `mevabe-settings-preg-${process.pid}.db`)
rmSync(process.env.MEVABE_DB_PATH, { force: true })

async function main(): Promise<void> {
  const { localApi } = await import('./local')
  const { eddFromLmp, lmpFromEdd, weekFromLmp } = await import('./mock')

  // 1. Seed có thai kỳ ongoing (LMP 2026-03-16 → tuần 20 tại REAL_TODAY).
  const before = await localApi.getPregnancy()
  assert.ok(before?.lmp, 'có thai kỳ ongoing (seed)')
  const weekBefore = weekFromLmp(before!.lmp!)

  // 2. Đổi LMP, không truyền edd → edd tự tính 40 tuần; getPregnancy trả lmp/edd mới.
  const upd = await localApi.updatePregnancy({ lmp: '2026-04-01' })
  assert.equal(upd.edd, eddFromLmp('2026-04-01'), 'edd tự tính = LMP + 280 ngày (Naegele)')
  assert.equal(upd.edd, '2027-01-06', 'Naegele 40 tuần từ 2026-04-01')

  const after = await localApi.getPregnancy()
  assert.equal(after!.lmp, '2026-04-01', 'getPregnancy trả LMP mới')
  assert.equal(after!.edd, '2027-01-06', 'getPregnancy trả EDD mới')
  assert.ok(upd.edd! > upd.lmp!, 'edd mới sau lmp')

  // 3. Tuần thai từ LMP mới thay đổi đúng so với trước.
  const weekAfter = weekFromLmp(after!.lmp!)
  assert.ok(weekAfter !== weekBefore, 'tuần thai đổi khi đổi LMP')
  assert.equal(weekAfter, weekFromLmp('2026-04-01'), 'weekFromLmp khớp LMP mới')

  // 4. EDD truyền tường minh → giữ đúng, không tự tính.
  const upd2 = await localApi.updatePregnancy({ lmp: '2026-05-01', edd: '2027-02-12' })
  assert.equal(upd2.edd, '2027-02-12', 'EDD tường minh được giữ')
  assert.equal(upd2.lmp, '2026-05-01', 'LMP tường minh được giữ')

  // 5. Chỉ truyền EDD → LMP tái tính ngược (Naegele).
  const upd3 = await localApi.updatePregnancy({ edd: '2027-02-12' })
  assert.equal(upd3.lmp, lmpFromEdd('2027-02-12'), 'chỉ EDD → LMP tái tính ngược')

  // 6. Validation: EDD phải sau LMP.
  await assert.rejects(
    () => localApi.updatePregnancy({ lmp: '2026-10-01', edd: '2026-09-01' }),
    /EDD/,
    'từ chối khi edd <= lmp',
  )

  console.log('✅ phase6-settings-pregnancy.check PASS — sửa thông tin thai kỳ (LMP/EDD)')
}

main().catch((e) => {
  console.error('❌ phase6-settings-pregnancy.check FAIL:', e)
  process.exit(1)
})
