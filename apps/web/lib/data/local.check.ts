// Self-check data layer SQLite (Phase 5): getters seed, mutation persist,
// privacy SQL, getMealsByDate, deleteFamilyData, auth DB helpers.
// Chạy: scripts/test-web.sh (hoặc node --experimental-strip-types --import
// ./lib/library/node-loader.mjs lib/data/local.check.ts)
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'
import { setActiveUser } from '../auth/active-user'

process.env.MEVABE_DB_PATH = join(tmpdir(), `mevabe-local-check-${process.pid}.db`)
rmSync(process.env.MEVABE_DB_PATH, { force: true })

async function main(): Promise<void> {
  const { localApi } = await import('./local')
  const { ensureAuthSeed, dbUserByEmail, dbCreateSession, dbFindSession, dbFamilyByCode } = await import('../db/local')

  // Getters seed
  assert.ok((await localApi.getPregnancy())?.status === 'ongoing', 'getPregnancy ongoing')
  assert.ok((await localApi.getMeasurements()).length >= 10, 'seed measurements')
  assert.ok((await localApi.getSymptoms()).length >= 1, 'seed symptoms')
  assert.ok((await localApi.getMeals()).length >= 5, 'seed meals')
  assert.equal((await localApi.getWaterCaffeine()).waterLoggedMl, 1400, 'seed water 1400')

  // getMealsByDate — lọc SQL theo logged_at
  const date = (await localApi.getMeals())[0]!.logged_at.slice(0, 10)
  assert.ok((await localApi.getMealsByDate(date)).length >= 1, 'getMealsByDate prefix')

  // Mutation persist trong cùng process
  const added = await localApi.addMeasurement({
    type: 'weight',
    value: 61.5,
    unit: 'kg',
    taken_at: '2026-08-05T07:00:00+07:00',
    note: 'local.check',
  })
  assert.ok((await localApi.getMeasurements()).some((m) => m.id === added.id), 'addMeasurement thấy ngay')

  // Privacy SQL: seed symptoms private_owner_id = MOM → DAD không thấy, active=MOM thấy
  setActiveUser({
    user_id: '10000000-0000-0000-0000-000000000003',
    family_id: '10000000-0000-0000-0000-000000000001',
    family_code: 'MEVABE',
    members: [],
  })
  const dadSymptoms = await localApi.getSymptoms()
  assert.equal(dadSymptoms.length, 0, 'DAD không thấy symptom private của MOM')
  setActiveUser({
    user_id: '10000000-0000-0000-0000-000000000002',
    family_id: '10000000-0000-0000-0000-000000000001',
    family_code: 'MEVABE',
    members: [],
  })
  assert.ok((await localApi.getSymptoms()).length >= 1, 'MOM thấy symptom của mình')

  // getFamilyMembers/getFamilyCode đọc SQLite
  await ensureAuthSeed()
  const members = await localApi.getFamilyMembers()
  assert.ok(members.length === 2, 'getFamilyMembers 2 thành viên từ SQLite')
  assert.equal(await localApi.getFamilyCode(), 'MEVABE', 'getFamilyCode từ SQLite')

  // deleteFamilyData — xoá dữ liệu thật, không reset seed.
  // Guard Phase 7 polish: cần active user (route /api/v1/export trả 401 khi chưa login).
  setActiveUser({
    user_id: '10000000-0000-0000-0000-000000000002',
    family_id: '10000000-0000-0000-0000-000000000001',
    family_code: 'MEVABE',
    members: [],
  })
  await localApi.deleteFamilyData()
  assert.equal((await localApi.getMeasurements()).length, 0, 'sau delete: measurements rỗng')
  assert.ok((await localApi.getPregnancy())?.status === 'ongoing', 'sau delete: pregnancy còn (seed giữ)')
  assert.equal((await localApi.getWaterCaffeine()).waterLoggedMl, 0, 'sau delete: water = 0')

  // Auth DB helpers
  assert.ok(dbUserByEmail('me@demo.vn'), 'auth seed user demo')
  assert.equal(dbFamilyByCode('MEVABE')?.code, 'MEVABE', 'family MEVABE trong DB')
  const session = dbCreateSession('10000000-0000-0000-0000-000000000002')
  assert.ok(dbFindSession(session.token), 'session tạo được trong DB')

  setActiveUser(null)
  console.log('✅ local.check PASS — SQLite data layer + auth DB helpers')
}

main().catch((e) => {
  console.error('❌ local.check FAIL:', e)
  process.exit(1)
})
