// Self-check AI-CTX — lịch sử khám (medical visits) + tình trạng đặc biệt trong buildChatContext.
// Kiểm tra:
//  1. Có 1 visit kèm ocrText → context chứa "Lịch sử khám" + nội dung ảnh.
//  2. Giới hạn: ocr_text >200 ký tự bị cắt ≤200; mỗi visit ≤2 tài liệu; ≤5 visit.
//  3. Không có visit → không có mục "Lịch sử khám".
//  4. Không chứa định danh (mọi field ngoài 5 field cho phép bị bỏ qua).
//  5. Có conditions + doctorInstructions → context chứa "Tình trạng đặc biệt" + "Lưu ý bác sĩ".
//  6. Không có conditions/instructions (hoặc rỗng) → bỏ mục tương ứng.
// Chạy: scripts/test-web.sh
import assert from 'node:assert/strict'
import { buildChatContext, type ChatContextInput, type MedicalVisitContext } from './prompts'

const base: ChatContextInput = {
  week: 21,
  trimester: 'second',
  dueDate: '2026-12-01',
  daysLeft: 118,
  mealCountToday: 0,
  waterLoggedMl: 0,
  waterGoalMl: 2000,
  taskCount: 0,
  tasksDone: 0,
  recentSymptoms: [],
  latestMeasurements: [],
  upcomingAppointments: [],
}

async function main(): Promise<void> {
  // 1. 1 visit kèm ocrText → thấy "Lịch sử khám" + nội dung ảnh.
  const ctx1 = buildChatContext(base, {
    medicalVisits: [
      {
        visit_date: '2026-08-10',
        clinic: 'Bệnh viện Phụ sản Hà Nội',
        reason: 'Khám thai định kỳ tuần 21',
        notes: 'Hẹn siêu âm hình thái',
        ocrTexts: ['NT 1.1 mm, tim thai 158 lần/phút, thai khỏe mạnh'],
      },
    ],
  })
  assert.ok(ctx1.includes('Lịch sử khám (mới nhất trước):'), 'có mục Lịch sử khám')
  assert.ok(ctx1.includes('ngày 2026-08-10'), 'có ngày khám')
  assert.ok(ctx1.includes('Bệnh viện Phụ sản Hà Nội'), 'có nơi khám')
  assert.ok(ctx1.includes('lý do: Khám thai định kỳ tuần 21'), 'có lý do')
  assert.ok(ctx1.includes('ghi chú: Hẹn siêu âm hình thái'), 'có ghi chú')
  assert.ok(ctx1.includes('nội dung ảnh đọc được: NT 1.1 mm, tim thai 158'), 'có ocr_text')

  // 2a. ocr_text dài >200 ký tự → bị cắt ≤200 (đảm bảo không tràn context).
  const longText = 'x'.repeat(500)
  const ctx2 = buildChatContext(base, {
    medicalVisits: [{ visit_date: '2026-08-01', ocrTexts: [longText] }],
  })
  const matched = ctx2.match(/nội dung ảnh đọc được: (x+)/)
  assert.ok(matched, 'có phần nội dung ảnh trong context')
  assert.equal(matched![1]!.length, 200, 'ocr_text cắt tối đa 200 ký tự')

  // 2b. Mỗi visit chỉ lấy ≤2 tài liệu (tài liệu 3 bị bỏ).
  const ctx3 = buildChatContext(base, {
    medicalVisits: [
      { visit_date: '2026-08-01', ocrTexts: ['a', 'b', 'c'] },
    ],
  })
  assert.ok(ctx3.includes('a | b'), 'lấy 2 tài liệu đầu')
  assert.ok(!ctx3.includes('| c'), 'tài liệu thứ 3 bị bỏ')

  // 2c. Chỉ lấy ≤5 visit (visit thứ 6 bị bỏ).
  const six = Array.from({ length: 6 }, (_, i) => ({
    visit_date: `2026-07-${String(30 - i).padStart(2, '0')}`,
  })) as MedicalVisitContext[]
  const ctx4 = buildChatContext(base, { medicalVisits: six })
  const dateCount = (ctx4.match(/ngày 2026-/g) ?? []).length
  assert.equal(dateCount, 5, 'chỉ lấy 5 lần khám gần nhất')

  // 3. Không có visit → không có mục Lịch sử khám.
  const ctx5 = buildChatContext(base, {})
  assert.ok(!ctx5.includes('Lịch sử khám'), 'không có visit → bỏ mục')

  // 4. Field lạ (VD tên bác sĩ / SĐT) không được đưa vào context.
  const ctx6 = buildChatContext(base, {
    medicalVisits: [
      // Truyền field ngoài khế ước qua `as` để mô phỏng rò rỉ định danh (buildChatContext phải bỏ qua).
      { visit_date: '2026-08-10', doctor: 'BS Nguyễn Văn A', phone: '0901234567' } as MedicalVisitContext,
    ],
  })
  assert.ok(!ctx6.includes('Nguyễn Văn A'), 'không đưa định danh bác sĩ')
  assert.ok(!ctx6.includes('0901234567'), 'không đưa SĐT')

  // 5. Có conditions + doctorInstructions → context chứa mục "Tình trạng đặc biệt" + "Lưu ý bác sĩ".
  const ctx7 = buildChatContext(base, {
    conditions: ['Tiểu đường thai kỳ', 'Tăng huyết áp'],
    doctorInstructions: 'Theo dõi đường huyết 4 lần/ngày, tái khám mỗi 2 tuần',
  })
  assert.ok(
    ctx7.includes('Tình trạng đặc biệt đã khai báo: Tiểu đường thai kỳ, Tăng huyết áp.'),
    'có mục tình trạng đặc biệt với tên tiếng Việt',
  )
  assert.ok(ctx7.includes('Lưu ý bác sĩ: Theo dõi đường huyết 4 lần/ngày, tái khám mỗi 2 tuần.'), 'có lưu ý bác sĩ')
  // Không nhắc lại định danh dạng mã (VD mã tình trạng) — chỉ tên tiếng Việt.
  assert.ok(!ctx7.includes('gestational_diabetes'), 'không đưa mã tình trạng')

  // 6. Không có conditions / doctorInstructions → không có mục tương ứng.
  const ctx8 = buildChatContext(base, {})
  assert.ok(!ctx8.includes('Tình trạng đặc biệt'), 'không có tình trạng → bỏ mục')
  assert.ok(!ctx8.includes('Lưu ý bác sĩ'), 'không có lưu ý bác sĩ → bỏ mục')
  // Mảng rỗng / lưu ý chỉ khoảng trắng → vẫn bỏ mục.
  const ctx9 = buildChatContext(base, { conditions: ['', '  '], doctorInstructions: '   ' })
  assert.ok(!ctx9.includes('Tình trạng đặc biệt'), 'tên rỗng → bỏ mục')
  assert.ok(!ctx9.includes('Lưu ý bác sĩ'), 'lưu ý rỗng → bỏ mục')

  console.log('✅ ai-medical-context.check PASS — buildChatContext gắn lịch sử khám + tình trạng đặc biệt (giới hạn, không định danh)')
}

main().catch((e) => {
  console.error('❌ ai-medical-context.check FAIL:', (e as Error).message)
  process.exit(1)
})
