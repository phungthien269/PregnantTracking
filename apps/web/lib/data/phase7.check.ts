// Self-check Phase 7 — data layer SAU SINH (SQLite). Kiểm tra các mutation mới:
//   addBirthRecord · addChild · addGrowthPoint · addVaccination
//   + getters thấy dữ liệu vừa tạo · per-family đúng · deleteFamilyData xoá
//     birth_records + children.
// Chạy: scripts/test-web.sh (hoặc node --experimental-strip-types --import
// ./lib/library/node-loader.mjs lib/data/phase7.check.ts)
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'

process.env.MEVABE_DB_PATH = join(tmpdir(), `mevabe-phase7-check-${process.pid}.db`)
rmSync(process.env.MEVABE_DB_PATH, { force: true })

async function main(): Promise<void> {
  const { localApi } = await import('./local')
  const { setActiveUser } = await import('../auth/active-user')

  // Family demo = seed (Bé Minh); OTHER_FAMILY để kiểm tra cô lập per-family.
  const DEMO_FAMILY = '10000000-0000-0000-0000-000000000001'
  const OTHER_FAMILY = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  const demoUser = {
    user_id: '10000000-0000-0000-0000-000000000002',
    family_id: DEMO_FAMILY,
    family_code: 'MEVABE',
    members: [],
  }

  setActiveUser(demoUser)

  // 1. addBirthRecord → getBirthRecord thấy (mới nhất)
  const br = await localApi.addBirthRecord({
    birth_date: '2026-12-20',
    birth_type: 'c_section',
    hospital: 'Bệnh viện Từ Dũ',
    complications: [],
    notes: 'Sinh mổ chủ động',
  })
  assert.equal(br.family_id, DEMO_FAMILY, 'addBirthRecord gắn đúng family_id')
  assert.equal((await localApi.getBirthRecord())?.id, br.id, 'addBirthRecord → getBirthRecord thấy')

  // 2. addChild → getChildren thấy
  const child = await localApi.addChild({
    name: 'Bé An',
    sex: 'female',
    birth_date: '2026-12-20',
    birth_weight_kg: 3.1,
    birth_length_cm: 49,
    head_circumference_cm: 33.5,
    blood_type: 'A+',
    allergies: [],
  })
  assert.equal(child.family_id, DEMO_FAMILY, 'addChild gắn đúng family_id')
  assert.ok((await localApi.getChildren()).some((c) => c.id === child.id), 'addChild → getChildren thấy')

  // 3. addGrowthPoint(childId) → getGrowth thấy
  const gp = await localApi.addGrowthPoint(child.id, { date: '2027-01-20', weightKg: 4.2, heightCm: 54 })
  assert.deepEqual(gp, { date: '2027-01-20', weightKg: 4.2, heightCm: 54, headCm: null }, 'addGrowthPoint trả GrowthPoint')
  assert.ok(
    (await localApi.getGrowth(child.id)).some((g) => g.date === '2027-01-20' && g.weightKg === 4.2),
    'addGrowthPoint → getGrowth thấy',
  )

  // 4. addVaccination → getVaccinations thấy; scheduled_date mặc định = hôm nay khi bỏ trống
  const vac = await localApi.addVaccination(child.id, {
    vaccine_name: 'Viêm gan B',
    dose_number: 2,
    scheduled_date: '2027-01-20',
    administered_date: '2027-01-20',
    location: 'Trạm y tế phường',
  })
  assert.equal(vac.child_id, child.id, 'addVaccination gắn child_id')
  assert.ok((await localApi.getVaccinations(child.id)).some((v) => v.id === vac.id), 'addVaccination → getVaccinations thấy')
  const vac2 = await localApi.addVaccination(child.id, { vaccine_name: 'Sởi' })
  assert.ok(vac2.scheduled_date, 'addVaccination scheduled_date mặc định khi bỏ trống')

  // 5. Per-family: family khác KHÔNG thấy dữ liệu vừa tạo
  setActiveUser({ ...demoUser, user_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', family_id: OTHER_FAMILY })
  assert.equal(await localApi.getBirthRecord(), null, 'family khác: getBirthRecord null')
  assert.equal((await localApi.getChildren()).some((c) => c.id === child.id), false, 'family khác: không thấy child')
  assert.equal((await localApi.getGrowth(child.id)).some((g) => g.date === '2027-01-20'), false, 'family khác: không thấy growth')
  assert.equal((await localApi.getVaccinations(child.id)).some((v) => v.id === vac.id), false, 'family khác: không thấy vaccination')

  // 6. deleteFamilyData (demo family) → xoá birth_records + children (dữ liệu người dùng)
  setActiveUser(demoUser)
  await localApi.deleteFamilyData()
  assert.equal(await localApi.getBirthRecord(), null, 'sau delete: birth record trống')
  assert.equal((await localApi.getChildren()).length, 0, 'sau delete: children trống')

  setActiveUser(null)
  console.log('✅ phase7.check PASS — data layer sau sinh (birth/child/growth/vaccination)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
