// Self-check Agent 6B — luồng lịch khám TRƯỚC/SAU.
//  1. Chuyển đổi ngày giờ form (datetime-local ↔ ISO) — logic rủi ro của UI.
//  2. add → update (outcome/prescription/tasks_after/followup_at) → dữ liệu trả về đúng.
// Chạy: scripts/test-web.sh (tự tìm *.check.ts) hoặc
//   node --experimental-strip-types --import ./apps/web/lib/library/node-loader.mjs apps/web/lib/appointment-flow.check.ts
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'

process.env.MEVABE_DB_PATH = join(tmpdir(), `mevabe-appt-flow-check-${process.pid}.db`)
rmSync(process.env.MEVABE_DB_PATH, { force: true })

async function main(): Promise<void> {
  const { fromLocalInput, toLocalInput } = await import('./appointment-datetime')
  const { localApi } = await import('./data/local')

  // 1. datetime-local → ISO có offset; ISO → datetime-local (roundtrip theo giờ local).
  const iso = fromLocalInput('2026-09-01T08:00')
  assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(iso), `fromLocalInput ra ISO có offset (${iso})`)
  const back = toLocalInput(iso)
  assert.equal(back, '2026-09-01T08:00', 'roundtrip datetime-local khớp giờ local')
  // ISO có offset (+07:00) → datetime-local → ISO: epoch phải giữ nguyên (bất kể TZ máy).
  const isoOffset = '2026-12-05T23:45:00+07:00'
  assert.equal(
    new Date(fromLocalInput(toLocalInput(isoOffset))).getTime(),
    new Date(isoOffset).getTime(),
    'roundtrip ISO có offset giữ nguyên epoch',
  )

  // 2. TRƯỚC khám: add với summary_before → trả về entity có đủ field.
  const apt = await localApi.addAppointment({
    type: 'prenatal',
    scheduled_at: iso,
    location: 'Bệnh viện Từ Dũ',
    doctor: 'BS. Nguyễn Thị Hoa',
    summary_before: 'Đau lưng 2 tuần, cần hỏi về bổ sung sắt',
  })
  assert.equal(apt.type, 'prenatal', 'addAppointment type')
  assert.equal(apt.summary_before, 'Đau lưng 2 tuần, cần hỏi về bổ sung sắt', 'addAppointment summary_before')
  assert.equal(apt.prescription, null, 'addAppointment chưa có đơn thuốc')
  assert.equal(apt.tasks_after, null, 'addAppointment chưa có việc sau khám')

  // 3. SAU khám: update outcome/prescription/tasks_after/followup_at.
  const updated = await localApi.updateAppointment(apt.id, {
    outcome: 'Bé phát triển tốt, mẹ cần nghỉ ngơi nhiều hơn',
    prescription: 'Sắt 60mg/ngày, Canxi 500mg/ngày',
    tasks_after: ['Hẹn khám lại sau 4 tuần', 'Xét nghiệm nước tiểu'],
    followup_at: '2026-09-29T08:00:00+07:00',
  })
  assert.equal(updated.outcome, 'Bé phát triển tốt, mẹ cần nghỉ ngơi nhiều hơn', 'updateAppointment outcome')
  assert.equal(updated.prescription, 'Sắt 60mg/ngày, Canxi 500mg/ngày', 'updateAppointment prescription')
  assert.deepEqual(updated.tasks_after, ['Hẹn khám lại sau 4 tuần', 'Xét nghiệm nước tiểu'], 'updateAppointment tasks_after')
  assert.equal(updated.followup_at, '2026-09-29T08:00:00+07:00', 'updateAppointment followup_at')
  // Trường KHÔNG gửi phải giữ nguyên (PATCH null-skip).
  assert.equal(updated.summary_before, 'Đau lưng 2 tuần, cần hỏi về bổ sung sắt', 'updateAppointment giữ summary_before')
  assert.equal(updated.doctor, 'BS. Nguyễn Thị Hoa', 'updateAppointment giữ doctor')

  // 4. Xoá rõ ràng: gửi null → field rỗng lại.
  const cleared = await localApi.updateAppointment(apt.id, { prescription: null, tasks_after: null, followup_at: null })
  assert.equal(cleared.prescription, null, 'updateAppointment gửi null xoá prescription')
  assert.equal(cleared.tasks_after, null, 'updateAppointment gửi null xoá tasks_after')
  assert.equal(cleared.followup_at, null, 'updateAppointment gửi null xoá followup_at')

  console.log('✅ appointment-flow.check PASS — lịch khám TRƯỚC/SAU')
}

main().catch((e) => {
  console.error('❌ appointment-flow.check FAIL:', e)
  process.exit(1)
})
