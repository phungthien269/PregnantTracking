// ===========================================================================
// text.ts — tiện ích text dùng chung cho pipeline thư viện
// (HTML→text, chuẩn hóa, tách câu). Không dependency.
// ===========================================================================

/** Decode các entity HTML phổ biến (đủ cho URL/EPUB; không cần thư viện). */
const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  laquo: '«',
  raquo: '»',
  dagger: '†',
}

export function decodeEntitiesLoose(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name: string) => HTML_ENTITIES[name] ?? m)
}

/** HTML/XML → text thô: bỏ script/style/comment, block tag → xuống dòng, strip tag. */
export function stripHtml(html: string): string {
  const noBlocks = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(
      /<\/(p|div|h[1-6]|li|tr|section|article|blockquote|br|hr|ul|ol|table)>/gi,
      '\n',
    )
    .replace(/<(p|div|h[1-6]|li|tr|section|article|blockquote|br|hr|ul|ol|table)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
  return normalizeText(decodeEntitiesLoose(noBlocks))
}

/** Chuẩn hóa: gom khoảng trắng, cắt dòng, bỏ dòng rỗng dư. */
export function normalizeText(s: string): string {
  return s
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Tách thành câu dựa trên dấu kết thúc câu (giữ kỹ thuật số/viết tắt đơn giản). */
export function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?…])\s+/)
  return parts.map((p) => p.trim()).filter((p) => p.length > 0)
}

/** Chuẩn hoá tên file → title (bỏ phần mở rộng, gạch dưới → khoảng trắng). */
export function titleFromFilename(filename: string | undefined): string {
  if (!filename) return 'Tài liệu đã import'
  const base = filename.replace(/\.(pdf|epub|txt|html?)$/i, '').replace(/[_-]+/g, ' ').trim()
  return base || 'Tài liệu đã import'
}
