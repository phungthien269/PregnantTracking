// Self-check Phase 7 — HỒ SƠ KHÁM (medical visits + ảnh tài liệu) — SQLite.
// Kiểm tra:
//  1. addMedicalVisit → getMedicalVisits thấy (sắp visit_date desc).
//  2. addVisitDocument → getVisitDocuments thấy (kèm ocr_text).
//  3. Per-user: Mẹ thêm → Bố KHÔNG thấy (private_owner_id).
//  4. Mock layer cùng hành vi.
//  5. deleteFamilyData xoá medical_visits + visit_documents.
// Chạy: scripts/test-web.sh
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'
import { setActiveUser } from '../auth/active-user'

process.env.MEVABE_DB_PATH = join(tmpdir(), `mevabe-phase7-medical-${process.pid}.db`)
rmSync(process.env.MEVABE_DB_PATH, { force: true })

const MOM = '10000000-0000-0000-0000-000000000002'
const DAD = '10000000-0000-0000-0000-000000000003'
const FAMILY = '10000000-0000-0000-0000-000000000001'

async function main(): Promise<void> {
  const { localApi } = await import('./local')
  const { mockApi } = await import('./mock')

  setActiveUser({ user_id: MOM, family_id: FAMILY, family_code: 'MEVABE', members: [] })

  // 1. addMedicalVisit → getMedicalVisits thấy; mới nhất (2026-08-10) đứng đầu (visit_date desc).
  const visit = await localApi.addMedicalVisit({
    visit_date: '2026-08-10',
    clinic: 'Bệnh viện Phụ sản Hà Nội',
    reason: 'Khám thai định kỳ tuần 21',
    notes: 'Hẹn siêu âm hình thái',
  })
  assert.equal(visit.private_owner_id, MOM, 'addMedicalVisit gắn private_owner_id = người tạo (Mẹ)')
  const visits = await localApi.getMedicalVisits()
  assert.ok(visits.some((v) => v.id === visit.id), 'addMedicalVisit → getMedicalVisits thấy')
  assert.equal(visits[0]!.id, visit.id, 'getMedicalVisits sắp visit_date desc (mới nhất trước)')

  // 2. addVisitDocument → getVisitDocuments thấy (kèm ocr_text).
  const doc = await localApi.addVisitDocument(visit.id, {
    filename: 'sieu-am-21-tuan.jpg',
    mime: 'image/jpeg',
    imageDataUrl: 'data:image/jpeg;base64,AAAA',
    ocrText: 'NT 1.1 mm, tim thai 158 lần/phút, thai khỏe mạnh',
  })
  assert.equal(doc.visit_id, visit.id, 'addVisitDocument gắn visit_id')
  assert.equal(doc.private_owner_id, MOM, 'addVisitDocument gắn private_owner_id = người tạo')
  const docs = await localApi.getVisitDocuments(visit.id)
  assert.ok(docs.some((d) => d.id === doc.id), 'addVisitDocument → getVisitDocuments thấy')
  assert.ok(docs.some((d) => d.ocr_text?.includes('tim thai 158')), 'getVisitDocuments kèm ocr_text')

  // 3. Per-user: Mẹ thêm → Bố KHÔNG thấy.
  setActiveUser({ user_id: DAD, family_id: FAMILY, family_code: 'MEVABE', members: [] })
  assert.ok(!(await localApi.getMedicalVisits()).some((v) => v.id === visit.id), 'Bố KHÔNG thấy hồ sơ khám của Mẹ')
  assert.equal((await localApi.getVisitDocuments(visit.id)).some((d) => d.id === doc.id), false, 'Bố KHÔNG thấy ảnh tài liệu của Mẹ')

  // 4. Mock layer cùng hành vi.
  setActiveUser({ user_id: MOM, family_id: FAMILY, family_code: 'MEVABE', members: [] })
  const mVisit = await mockApi.addMedicalVisit({ visit_date: '2026-08-11', reason: 'Mock visit' })
  assert.ok((await mockApi.getMedicalVisits()).some((v) => v.id === mVisit.id), 'mock: add → get thấy')
  const mDoc = await mockApi.addVisitDocument(mVisit.id, {
    filename: 'a.jpg',
    mime: 'image/jpeg',
    imageDataUrl: 'data:image/jpeg;base64,BBBB',
    ocrText: 'Bình thường',
  })
  assert.ok((await mockApi.getVisitDocuments(mVisit.id)).some((d) => d.id === mDoc.id), 'mock: document thấy')
  setActiveUser({ user_id: DAD, family_id: FAMILY, family_code: 'MEVABE', members: [] })
  assert.ok(!(await mockApi.getMedicalVisits()).some((v) => v.id === mVisit.id), 'mock: Bố không thấy của Mẹ')

  // 5. deleteFamilyData (demo family) → xoá hồ sơ khám.
  setActiveUser({ user_id: MOM, family_id: FAMILY, family_code: 'MEVABE', members: [] })
  await localApi.deleteFamilyData()
  assert.equal((await localApi.getMedicalVisits()).length, 0, 'sau delete: medical visits rỗng')
  assert.equal((await localApi.getVisitDocuments(visit.id)).length, 0, 'sau delete: visit documents rỗng')

  setActiveUser(null)
  console.log('✅ phase7-medical.check PASS — hồ sơ khám (medical visits + documents, per-user, delete)')
}

main().catch((e) => {
  console.error('❌ phase7-medical.check FAIL:', (e as Error).message)
  process.exit(1)
})
