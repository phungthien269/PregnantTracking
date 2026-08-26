// ===========================================================================
// check.ts — tự kiểm tra pipeline thư viện (chunk/citation, stage, quiz, PDF,
// store mock). Chạy: `cd apps/web && node --experimental-strip-types lib/library/check.ts`
// ===========================================================================

import { deflateRawSync } from 'node:zlib'
import { chunkText } from './chunk'
import { extractDocument } from './extract'
import { guessStage } from './stage'
import { generateQuizFromChunks } from './quiz'
import { libraryStore } from './store'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
  console.log(`  ✔ ${msg}`)
}

async function main(): Promise<void> {
  // ---- 1. Chunking + citation ----
  console.log('1. chunkText — heading + citation + position')
  const doc = {
    title: 'Cẩm nang thai kỳ',
    text: [
      'Dinh dưỡng cho mẹ',
      '',
      'Mẹ bầu cần bổ sung khoảng 1000–1200 mg canxi mỗi ngày để bé phát triển xương chắc khỏe.',
      'Sắt nên uống cùng thực phẩm giàu vitamin C như cam, ổi để hấp thu tốt hơn.',
      '',
      'Vận động',
      '',
      'Đi bộ nhẹ nhàng 30 phút mỗi ngày giúp mẹ ngủ ngon và giảm phù chân.',
    ].join('\n'),
  }
  const chunks = chunkText(doc)
  assert(chunks.length >= 2, `chunkText tạo ≥2 chunk (được ${chunks.length})`)
  assert(chunks[0]!.citation === 'Cẩm nang thai kỳ — Dinh dưỡng cho mẹ', `citation có heading: "${chunks[0]!.citation}"`)
  assert(chunks.every((c, i) => c.position === i), 'position liên tục 0..n')
  assert(chunks.every((c) => c.content.length <= 1400), 'không chunk nào vượt MAX_CHUNK')
  assert(chunks[1]!.citation.includes('Vận động'), 'citation chunk thứ 2 theo section')

  // ---- 2. Stage guess ----
  console.log('2. guessStage — từ khóa')
  assert(
    guessStage('Mẹ bầu tuần 20 cần bổ sung sắt và canxi, bé thai máy đều.') === 'pregnancy',
    'văn bản mang thai → pregnancy',
  )
  assert(
    guessStage('Trẻ sơ sinh bú sữa mẹ, cần theo dõi vàng da và chăm sóc rốn mỗi ngày.') === 'newborn',
    'văn bản sơ sinh → newborn',
  )

  // ---- 3. Quiz fallback (chỉ từ nguồn import) ----
  console.log('3. generateQuizFromChunks — điền số có citation')
  const q = generateQuizFromChunks(
    [
      { content: 'Mẹ bầu cần bổ sung khoảng 1000–1200 mg canxi mỗi ngày trong thai kỳ.', citation: 'Nguồn A — Dinh dưỡng', position: 0 },
      { content: 'Giới hạn caffeine an toàn là dưới 200 mg mỗi ngày cho phụ nữ mang thai.', citation: 'Nguồn A — Caffeine', position: 1 },
      { content: 'Nên đếm thai máy ít nhất 10 lần trong 2 giờ.', citation: 'Nguồn A — Thai máy', position: 2 },
    ],
    'pregnancy',
  )
  assert(q.length >= 1, `sinh được câu hỏi (được ${q.length})`)
  const first = q[0]!
  assert(first.options.includes('1000–1200 mg'), 'đáp án đúng nằm trong options')
  assert(first.options[first.correct_index] === '1000–1200 mg', 'correct_index trỏ đúng đáp án')
  assert(first.citation.length > 0 && first.citation.length <= 500, 'citation hợp lệ')
  assert(new Set(first.options).size === first.options.length, 'options không trùng')
  assert(q.length <= 5, 'không quá 5 câu')

  // ---- 4. PDF extractor (synthetic) ----
  console.log('4. extractDocument — PDF text-layer (Flate)')
  const content = 'BT /F1 12 Tf 72 720 Td (Dinh duong cho me bau) Tj 0 -20 Td (Thai ky tuan 20: can 1000 mg canxi moi ngay) Tj ET'
  const stream = deflateRawSync(Buffer.from(content, 'latin1'))
  const pdf = Buffer.concat([
    Buffer.from(
      `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length ${stream.length} /Filter /FlateDecode >>\nstream\n`,
      'latin1',
    ),
    stream,
    Buffer.from('\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n', 'latin1'),
  ])
  const pdfDoc = await extractDocument({ kind: 'pdf', data: pdf, filename: 'cam-nang-thai-ky.pdf' })
  assert(pdfDoc.title.includes('cam nang'), `title từ filename: "${pdfDoc.title}"`)
  assert(pdfDoc.text.includes('Thai ky tuan 20'), `trích text PDF: "${pdfDoc.text.slice(0, 80)}..."`)
  assert(pdfDoc.text.includes('Dinh duong cho me bau'), 'trích cả 2 dòng text')

  // ---- 5. Text kind ----
  console.log('5. extractDocument — text')
  const txtDoc = await extractDocument({ kind: 'text', text: 'Mẹ bầu nên đi khám đúng lịch.', filename: 'ghi-chu.txt' })
  assert(txtDoc.text.includes('đi khám'), 'text trích nguyên văn')

  // ---- 6. Store mock (import → đọc lại) ----
  console.log('6. libraryStore (mock) — createSource/addChunks/quiz')
  const source = await libraryStore.createSource('Bài test', { stage: null })
  assert(source.status === 'processing', 'source bắt đầu ở processing')
  await libraryStore.addChunks(source.id, [
    { content: 'Nội dung test số 1 với 500 mg canxi.', citation: 'Bài test', position: 0 },
  ])
  await libraryStore.setSourceStatus(source.id, { status: 'ready', chunk_count: 1 })
  assert(libraryStore.listSources().some((s) => s.id === source.id && s.status === 'ready'), 'listSources phản ánh ready')
  const back = await libraryStore.getChunks(source.id)
  assert(back.length === 1 && back[0]!.citation === 'Bài test', 'getChunks trả về citation')
  const quiz = await libraryStore.createQuizSet({ title: 'Quiz test', stage: 'pregnancy', source_ids: [source.id] })
  await libraryStore.addQuizQuestions(quiz.id, q)
  assert(libraryStore.listQuizSets()[0]?.status === 'ready', 'quiz set chuyển ready sau khi thêm câu')
  assert(libraryStore.listQuizQuestions().filter((x) => x.quiz_set_id === quiz.id).length === q.length, 'số câu khớp')
  await libraryStore.deleteSource(source.id)
  assert(!libraryStore.listSources().some((s) => s.id === source.id), 'deleteSource xoá source')

  console.log('\n✅ library.check OK — chunk/citation, stage, quiz, PDF, text, store')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
