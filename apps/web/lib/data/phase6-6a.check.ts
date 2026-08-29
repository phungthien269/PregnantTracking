// Self-check Agent 6A — ĐA THAI (multi-fetus).
// Kiểm chứng: startPregnancy({ fetalCount }) tạo đúng số fetus (name A/B/C),
// addFetus thêm thai vào thai kỳ hiện tại, và helper dùng cho giao diện chọn thai.
// Chạy tự động qua scripts/test-web.sh (mọi *.check.ts dưới apps/web).
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'

process.env.MEVABE_DB_PATH = join(tmpdir(), `mevabe-6a-check-${process.pid}.db`)
rmSync(process.env.MEVABE_DB_PATH, { force: true })

async function main(): Promise<void> {
  const { localApi } = await import('./local')
  const { fetusDisplayName, fetusKey, genderLabel, fetusSummary, tagFetusNote, parseFetusNote } = await import(
    '../multi-fetus'
  )

  // 1. startPregnancy fetalCount=3 → 3 fetus, name A/B/C, birth_order 1..3
  const preg = await localApi.startPregnancy({ lmp: '2026-04-01', fetalCount: 3 })
  const fs = (await localApi.getFetuses()).filter((f) => f.pregnancy_id === preg.id)
  assert.equal(fs.length, 3, 'startPregnancy fetalCount=3 tạo 3 fetus')
  assert.deepEqual(fs.map((f) => f.name), ['A', 'B', 'C'], 'name A/B/C theo birth_order')
  assert.deepEqual(fs.map((f) => f.birth_order), [1, 2, 3], 'birth_order 1..3')

  // 2. addFetus bổ sung thai vào thai kỳ hiện tại (lộ trình thai kỳ đã có).
  // Lưu ý: DB demo seed sẵn 1 thai kỳ ongoing (PREG_ID) — currentPregnancyId()
  // trả thai kỳ ongoing đầu tiên, nên addFetus có thể gắn vào PREG_ID. Không assert
  // pregnancy_id cụ thể — chỉ assert count tăng 1 và fetus mới hợp lệ.
  const before = (await localApi.getFetuses()).length
  const added = await localApi.addFetus({})
  const after = (await localApi.getFetuses()).length
  assert.equal(after, before + 1, 'addFetus tăng tổng số fetus lên 1')
  assert.ok(Number.isInteger(added.birth_order) && added.birth_order >= 2, 'addFetus sinh birth_order hợp lệ')

  // 3. Helper hiển thị + giới tính
  const fetusA = fs.find((f) => f.birth_order === 1)!
  assert.equal(fetusDisplayName(fetusA), 'Thai A', 'fetusDisplayName dùng name')
  assert.equal(fetusKey(fetusA), 'A', 'fetusKey ra ký tự A')
  assert.equal(genderLabel('male'), 'Bé trai', 'genderLabel male')
  assert.equal(genderLabel('female'), 'Bé gái', 'genderLabel female')
  assert.equal(genderLabel('unknown'), null, 'genderLabel unknown → null')
  assert.equal(fetusSummary({ ...fetusA, sex: 'female', notes: 'Thai máy nhiều' }), 'Bé gái · Thai máy nhiều', 'fetusSummary')

  // 4. Nhật ký thai máy: gắn/đọc marker thai trong note (workaround fetus_id)
  assert.equal(tagFetusNote('A', 'đạp lúc tối'), '[A] đạp lúc tối', 'tagFetusNote thêm marker')
  assert.equal(tagFetusNote('B', '   '), '[B]', 'tagFetusNote note trống → chỉ marker')
  assert.equal(tagFetusNote(null, 'ghi chú'), 'ghi chú', 'tagFetusNote không chọn thai → giữ nguyên')
  assert.deepEqual(parseFetusNote('[A] đạp lúc tối'), { fetusKey: 'A', note: 'đạp lúc tối' }, 'parseFetusNote tách marker')
  assert.deepEqual(parseFetusNote('không có marker'), { fetusKey: null, note: 'không có marker' }, 'parseFetusNote không marker')
  assert.deepEqual(parseFetusNote(null), { fetusKey: null, note: '' }, 'parseFetusNote null')

  console.log('✅ phase6-6a.check PASS — đa thai (multi-fetus)')
}

main().catch((e) => {
  console.error('❌ phase6-6a.check FAIL:', e)
  process.exit(1)
})
