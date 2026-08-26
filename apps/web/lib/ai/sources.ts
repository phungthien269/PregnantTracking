// ===========================================================================
// Source fallback — khi chưa có key AI hoặc AI lỗi → đọc nội dung đã có
// (bài viết + cẩm nang tuần) và trả nguồn khớp truy vấn. Luôn kèm nguồn.
// ===========================================================================

import type { KnowledgeStage } from '@mevabe/domain'
import { data } from '@/lib/data'

export interface SourceRef {
  id: string
  title: string
  source: string
  type: 'article' | 'weekly_guide'
  snippet?: string
}

const STOP = new Set(['và', 'hoặc', 'là', 'của', 'cho', 'mẹ', 'bé', 'tuần', 'có', 'không', 'khi', 'nên', 'thai'])

function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-zà-ỹ0-9]+/i)
    .filter((w) => w.length > 2 && !STOP.has(w))
}

function score(text: string, q: string): number {
  const words = tokens(q)
  const lower = text.toLowerCase()
  return words.reduce((n, t) => n + (lower.includes(t) ? 1 : 0), 0)
}

/** Tìm bài viết/cẩm nang khớp truy vấn — trả tối đa `limit` nguồn. */
export async function searchSources(
  query: string,
  limit = 3,
  stage?: KnowledgeStage | null,
): Promise<SourceRef[]> {
  const [articles, guides] = await Promise.all([data.getArticles(), data.getWeeklyGuides()])
  const refs: SourceRef[] = []

  for (const a of articles) {
    if (stage && !a.stages.includes(stage)) continue
    const s = score(`${a.title} ${a.summary ?? ''} ${a.body}`, query)
    if (s > 0) {
      refs.push({
        id: a.id,
        title: a.title,
        source: a.author ?? 'Bài viết Mẹ & Bé',
        type: 'article',
        snippet: `${a.summary ?? a.body.slice(0, 120)}…`,
      })
    }
  }
  for (const g of guides) {
    const s = score(`${g.title} ${g.content}`, query)
    if (s > 0) {
      refs.push({
        id: g.id,
        title: g.title,
        source: `Cẩm nang tuần ${g.week}`,
        type: 'weekly_guide',
        snippet: `${g.content.slice(0, 120)}…`,
      })
    }
  }

  return refs.sort((a, b) => (b.snippet?.length ?? 0) - (a.snippet?.length ?? 0)).slice(0, limit)
}

/** Trả lời fallback thuần nguồn khi không có AI. */
export async function sourceReply(
  query: string,
  stage?: KnowledgeStage | null,
): Promise<{ reply: string; sources: SourceRef[] }> {
  const sources = await searchSources(query, 3, stage)
  if (sources.length === 0) {
    return {
      reply:
        'Mẹ ơi, mình chưa tìm thấy nội dung phù hợp trong thư viện. Mẹ có thể tra trong trang Thư viện hoặc hỏi lại với từ khóa khác.',
      sources: [],
    }
  }
  const first = sources[0]!
  return {
    reply: `Trả lời từ nội dung trong thư viện của mẹ:\n\n${first.snippet}\n\n— Nguồn: ${first.title} (${first.source}). Đây là thông tin tham khảo, không thay thế bác sĩ.`,
    sources,
  }
}

/** Gợi ý fallback cho triệu chứng không khẩn khi chưa có AI — luôn kèm nguồn. */
export function symptomFallback(symptom: string): {
  possibleCauses: string[]
  actions: string[]
  sources: string[]
} {
  return {
    possibleCauses: [
      `Triệu chứng "${symptom}" có thể liên quan đến thay đổi sinh lý thai kỳ (hormone, thai lớn chèn ép).`,
      'Cần theo dõi thêm 24–48 giờ: mức độ, tần suất, có kèm dấu hiệu khác không.',
    ],
    actions: [
      'Ghi lại vào nhật ký triệu chứng (trang Triệu chứng) để theo dõi diễn tiến.',
      'Nghỉ ngơi, uống đủ nước; nếu đau tăng hoặc xuất hiện dấu hiệu nguy hiểm → đi khám ngay.',
      'Trao đổi với bác sĩ trong lần khám gần nhất.',
    ],
    sources: ['Cẩm nang thai kỳ — Bệnh viện Từ Dũ, 2026', 'WHO — chăm sóc tiền sản'],
  }
}
