// ===========================================================================
// chunk.check.ts — test chia chunk thư viện (apps/web/lib/library/chunk.ts):
//   citation (Nguồn — heading / Nguồn), position liền mạch, heuristic heading,
//   không cắt giữa câu khi vượt MAX_CHUNK.
// Chạy: scripts/test-web.sh.
// ===========================================================================

import { chunkText } from './chunk'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
}

let n = 0
const test = (name: string, fn: () => void): void => {
  n++
  try {
    fn()
    console.log(`  ✔ ${n}. ${name}`)
  } catch (e) {
    console.error(`  ✘ ${n}. ${name} — ${(e as Error).message}`)
    throw e
  }
}

// ---- heading heuristic ----
test('chunkText: dòng "Dinh dưỡng cho mẹ" là heading → citation "Tiêu đề — Dinh dưỡng cho mẹ"', () => {
  const chunks = chunkText({
    title: 'Cẩm nang mang thai',
    text: 'Dinh dưỡng cho mẹ\n\nMẹ cần ăn đủ chất. Uống nhiều nước.',
  })
  assert(chunks.length === 1, `1 chunk (${chunks.length})`)
  assert(chunks[0]!.citation === 'Cẩm nang mang thai — Dinh dưỡng cho mẹ', `citation = ${chunks[0]!.citation}`)
  assert(chunks[0]!.content.includes('Mẹ cần ăn đủ chất'), 'content không chứa dòng heading')
})

test('chunkText: "Chương 2" là heading; dòng số "100%" không phải heading', () => {
  const chunks = chunkText({
    title: 'Sách',
    text: 'Chương 2\nKhi mang thai, mẹ nên nghỉ ngơi.\n100%\nSố liệu cần bổ sung sắt.',
  })
  assert(chunks.length === 1, '1 chunk')
  assert(chunks[0]!.citation === 'Sách — Chương 2', 'citation có heading Chương 2')
  assert(chunks[0]!.content.includes('100%'), 'dòng 100% nằm trong nội dung (không phải heading)')
})

test('chunkText: câu mở đầu bằng "Khi"/"Mẹ" không bị nhận nhầm là heading', () => {
  const chunks = chunkText({
    title: 'T',
    text: 'Khi mẹ mang thai cần chú ý.\n\nMẹ nên khám thai đều đặn.',
  })
  assert(chunks.length === 1, 'gộp 1 chunk')
  assert(chunks[0]!.citation === 'T', 'citation chỉ là title (không có heading)')
})

test('chunkText: heading markdown "## Giới thiệu" và "1. Phần một"', () => {
  const m = chunkText({ title: 'T', text: '## Giới thiệu\nNội dung giới thiệu.' })
  assert(m[0]!.citation === 'T — ## Giới thiệu', 'markdown heading giữ nguyên')
  const num = chunkText({ title: 'T', text: '1. Phần một\nNội dung phần một.' })
  assert(num[0]!.citation === 'T — 1. Phần một', 'heading số thứ tự')
})

// ---- position + citation ----
test('chunkText: position liền mạch 0..n-1 giữa các section', () => {
  const chunks = chunkText({
    title: 'Sách',
    text: 'Phần một\nĐoạn A.\n\nPhần hai\nĐoạn B.\n\nPhần ba\nĐoạn C.',
  })
  assert(chunks.length === 3, `3 chunk (${chunks.length})`)
  chunks.forEach((c, i) => assert(c.position === i, `position ${c.position} === ${i}`))
})

test('chunkText: không có heading → citation chỉ là title', () => {
  const chunks = chunkText({ title: 'Tài liệu', text: 'Đây là đoạn một.\n\nĐoạn hai không tiêu đề.' })
  assert(chunks.every((c) => c.citation === 'Tài liệu'), 'citation = title')
})

// ---- vượt MAX_CHUNK (1400) ----
test('chunkText: đoạn dài > MAX_CHUNK được cắt theo câu, không vượt 1400, position liền', () => {
  const sentences = Array.from({ length: 30 }, (_, i) => `Câu ${i + 1} trong đoạn dài này là nội dung thử nghiệm.`)
  const chunks = chunkText({ title: 'T', text: 'Dòng tiêu đề khá dài\n' + sentences.join(' ') })
  assert(chunks.length >= 2, `chia thành ${chunks.length} chunk`)
  for (const c of chunks) assert(c.content.length <= 1400, `chunk ≤ 1400 (${c.content.length})`)
  chunks.forEach((c, i) => assert(c.position === i, `position ${c.position} === ${i}`))
  assert(chunks[0]!.citation === 'T — Dòng tiêu đề khá dài', 'citation giữ heading')
  // Không cắt giữa câu: chunk đầu phải kết thúc bằng "." (hoặc hết chuỗi)
  const c0 = chunks[0]!.content
  assert(c0.trimEnd().endsWith('.') || c0.length >= 1390, 'chunk đầu kết thúc bằng dấu hết câu')
})

// ---- tài liệu rỗng ----
test('chunkText: tài liệu rỗng → mảng rỗng', () => {
  assert(chunkText({ title: 'T', text: '' }).length === 0, 'rỗng → []')
  assert(chunkText({ title: 'T', text: '\n\n  \n' }).length === 0, 'toàn khoảng trắng → []')
})

console.log(`\n✅ chunk.check OK — ${n} test`)
