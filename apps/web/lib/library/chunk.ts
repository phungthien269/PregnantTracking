// ===========================================================================
// chunk.ts — chia text thành chunk theo chương/đoạn, kèm citation + position.
// Citation: `Nguồn — <heading>` khi có heading, ngược lại `Nguồn`.
// `ponytail:` heading nhận bằng heuristic (độ dài + không có dấu câu kết câu);
// PDF chưa giữ số trang — nâng cấp khi có extractor đầy đủ.
// ===========================================================================

import { splitSentences } from './text'

export interface Chunk {
  content: string
  citation: string
  position: number
}

export interface ChunkInput {
  title: string
  text: string
}

const MAX_CHUNK = 1400

/** Từ hay mở đầu câu thường (tránh nhầm câu bị ngắt dòng thành heading). */
const SENTENCE_START = new Set([
  'Mẹ', 'Bé', 'Em', 'Trẻ', 'Khi', 'Nếu', 'Thai', 'Nên', 'Các', 'Những', 'Một',
  'Người', 'Từ', 'Trong', 'Để', 'Và', 'Nhưng', 'Bạn', 'Con', 'Hôm', 'Tuy', 'Đây',
])

/** Dòng trông như heading: ngắn, không kết thúc bằng dấu câu, không phải số trần. */
function isHeading(line: string): boolean {
  if (line.length < 3 || line.length > 60) return false
  if (/^#+\s/.test(line)) return true
  if (/[.!?…:;,]$/.test(line)) return false
  if (/^\d+([.,]\d+)?\s*%?$/.test(line)) return false
  if (/^\d+(\.\d+)?[.\s]/.test(line) || /^(Chương|Phần|Mục|Bài|CHAPTER|PART|SECTION)\b/i.test(line)) return true
  const first = line.split(/\s+/)[0] ?? ''
  if (SENTENCE_START.has(first)) return false
  // Title Case, ≤ 8 từ, có ít nhất 1 chữ thường → heading dạng "Dinh dưỡng cho mẹ"
  if (/^[A-ZÀ-Ỹ][^.!?]*$/.test(line) && /[a-zà-ỹ]/.test(line) && line.split(/\s+/).length <= 8) return true
  return false
}

/** Gộp các đoạn của một section thành chunk (không cắt giữa câu). */
function buildChunks(title: string, heading: string | null, paras: string[]): Chunk[] {
  const chunks: Chunk[] = []
  let buf = ''
  const baseCitation = heading ? `${title} — ${heading}` : title
  const flush = (content: string) => {
    const trimmed = content.trim()
    if (trimmed) chunks.push({ content: trimmed, citation: baseCitation, position: chunks.length })
  }
  for (const para of paras) {
    if (para.length > MAX_CHUNK) {
      if (buf) flush(buf)
      buf = ''
      for (const piece of splitBySize(para, MAX_CHUNK)) flush(piece)
      continue
    }
    if (buf && buf.length + para.length + 1 > MAX_CHUNK) {
      flush(buf)
      buf = para
    } else {
      buf = buf ? `${buf}\n\n${para}` : para
    }
  }
  if (buf) flush(buf)
  return chunks
}

function splitBySize(text: string, max: number): string[] {
  const parts: string[] = []
  const sentences = splitSentences(text)
  let cur = ''
  for (const s of sentences) {
    if (cur && cur.length + s.length + 1 > max) {
      parts.push(cur.trim())
      cur = s
    } else {
      cur = cur ? `${cur} ${s}` : s
    }
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts.length ? parts : [text.slice(0, max)]
}

/** Chia toàn bộ tài liệu thành chunk theo chương/đoạn, citation + position. */
export function chunkText(doc: ChunkInput): Chunk[] {
  const lines = doc.text.split('\n').map((l) => l.trim())
  const sections: { heading: string | null; paras: string[] }[] = []
  let heading: string | null = null
  let paras: string[] = []

  const flushSection = () => {
    if (paras.length) sections.push({ heading, paras: [...paras] })
    paras = []
  }

  for (const line of lines) {
    if (!line) {
      // dòng trống: chỉ tách đoạn trong cùng section
      if (paras.length && paras[paras.length - 1] !== '') paras.push('')
      continue
    }
    if (isHeading(line)) {
      flushSection()
      heading = line
      continue
    }
    paras.push(line)
  }
  flushSection()

  const chunks: Chunk[] = []
  for (const section of sections) {
    const parasCleaned = section.paras.filter((p) => p !== '')
    if (!parasCleaned.length) continue
    for (const c of buildChunks(doc.title, section.heading, parasCleaned)) chunks.push(c)
  }
  // Giữ thứ tự position liền mạch (buildChunks reset position từng section)
  return chunks.map((c, i) => ({ ...c, position: i }))
}
