// ===========================================================================
// question-reports.check.ts — tự kiểm tra luồng báo lỗi câu hỏi:
// tạo report → list → đếm theo câu → đánh dấu resolved.
// Chạy: `cd apps/web && node --experimental-strip-types --import ./lib/library/node-loader.mjs lib/question-reports.check.ts`
// ===========================================================================

import { questionReportStore } from './question-reports'
import { isSupabaseConfigured } from './supabase'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
  console.log(`  ✔ ${msg}`)
}

const Q1 = '40000000-0000-0000-0000-0000000000aa'
const Q2 = '40000000-0000-0000-0000-0000000000ab'

async function main(): Promise<void> {
  if (isSupabaseConfigured()) {
    console.log('⚠ Supabase đã cấu hình — bỏ qua (check dành cho mock in-memory)')
    return
  }

  console.log('1. create — gửi báo lỗi câu hỏi')
  const r1 = await questionReportStore.create({ quiz_question_id: Q1, reason: 'Sai đáp án', details: 'Đáp án đúng phải là 1000 mg' })
  await questionReportStore.create({ quiz_question_id: Q1, reason: 'Nội dung không chính xác' })
  await questionReportStore.create({ quiz_question_id: Q2, reason: 'Lỗi chính tả' })
  assert(r1.status === 'open', 'report mới có status open')
  assert(r1.reason.includes('Sai đáp án') && r1.reason.includes('1000 mg'), 'reason gộp cả chi tiết')
  assert(r1.quiz_question_id === Q1, 'gắn đúng quiz_question_id')

  console.log('2. list — đọc lại danh sách')
  const reports = await questionReportStore.list()
  assert(reports.length === 3, `list trả ${reports.length} report`)

  console.log('3. summary — đếm theo câu hỏi')
  const summary = await questionReportStore.summary()
  const g1 = summary.find((g) => g.quiz_question_id === Q1)
  const g2 = summary.find((g) => g.quiz_question_id === Q2)
  assert(g1?.count === 2, 'câu Q1 đếm đủ 2 report')
  assert(g2?.count === 1, 'câu Q2 đếm đủ 1 report')
  assert(g1?.open_count === 2, 'Q1 còn 2 report chưa xử lý')

  console.log('4. updateStatus — đánh dấu đã xử lý')
  const done = await questionReportStore.updateStatus(r1.id, 'resolved')
  assert(done.status === 'resolved', 'status chuyển resolved')
  const summary2 = await questionReportStore.summary()
  const g1b = summary2.find((g) => g.quiz_question_id === Q1)
  assert(g1b?.open_count === 1, 'sau khi resolve, open_count Q1 giảm còn 1')
  assert(g1b?.statuses.resolved === 1, 'statuses.resolved = 1')

  console.log('\n✅ question-reports.check OK — create/list/summary/resolve')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
