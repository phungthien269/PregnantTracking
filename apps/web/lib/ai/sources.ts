// ===========================================================================
// Source fallback — khi chưa có key AI hoặc AI lỗi → đọc nội dung đã có
// (bài viết + cẩm nang tuần) và trả nguồn khớp truy vấn.
//
// Nguyên tắc chất lượng (sau vụ trả sai "Ăn dặm cho bé 6–12 tháng" cho câu
// hỏi thai kỳ "các khoáng chất nên ưu tiên thời điểm hiện tại"):
// 1. LỌC CỨNG theo stage: stage=pregnancy → chỉ nguồn thai kỳ (cẩm nang tuần +
//    bài viết khai báo 'pregnancy'); câu hỏi bé (newborn/age_*) → không lẫn
//    nguồn thai kỳ, và ngược lại.
// 2. Chấm điểm khớp theo từ khóa (title > summary > body) + ngưỡng tối thiểu:
//    câu hỏi chung chung khớp lỏng lẻo (VD 1 từ "chất" rơi vào bài sai chủ đề)
//    → KHÔNG trích nguồn để tránh khớp sai.
// 3. Không nguồn nào đạt ngưỡng → trả lời TRUNG THỰC: nêu tuần thai hiện tại
//    của mẹ, gợi ý dưỡng chất ưu tiên theo tuần lấy từ dữ liệu app thật
//    (getNutritionFocus), khuyên trao đổi bác sĩ — không bịa nguồn.
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

// ---------------------------------------------------------------------------
// Tách từ khóa truy vấn (tiếng Việt có dấu → lowercase)
// ---------------------------------------------------------------------------

// Stopword tiếng Việt: hư từ + từ quá rộng xuất hiện trong hầu hết bài
// ("mẹ", "bé", "tuần", "thai"…) — không giúp phân biệt chủ đề.
const STOP = new Set([
  'và', 'hoặc', 'là', 'của', 'cho', 'mẹ', 'bé', 'tuần', 'có', 'không', 'khi', 'nên', 'thai',
  'các', 'những', 'này', 'đó', 'gì', 'nào', 'sao', 'vậy', 'để', 'với', 'trong', 'về',
  'được', 'bị', 'cần', 'phải', 'hơn', 'ít', 'nhiều', 'một', 'ưu', 'tiên',
  'thời', 'điểm', 'hiện', 'tại', 'làm', 'như', 'theo', 'cũng', 'vẫn', 'đã', 'đang', 'sẽ', 'thì', 'ra',
])

/** Từ khóa câu hỏi: lowercase, tách theo ranh giới chữ/số, bỏ stopword, đếm mỗi từ 1 lần. */
function queryTokens(query: string): string[] {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-zà-ỹ0-9]+/)
        .filter((w) => w.length >= 2 && !STOP.has(w)),
    ),
  )
}

// ---------------------------------------------------------------------------
// Chấm điểm khớp
// ---------------------------------------------------------------------------

// Mỗi từ khóa chỉ tính 1 lần với trọng số cao nhất nơi nó xuất hiện:
// title 3 > summary 2 > body 1. Điểm chuẩn hóa 0..1 (chia số từ khóa × 3).
const WEIGHT_TITLE = 3
const WEIGHT_SUMMARY = 2
const WEIGHT_BODY = 1
/** Ngưỡng điểm chuẩn hóa tối thiểu để nguồn được trích. */
const MIN_SCORE = 0.2
/** Nguồn không có khái niệm "tuần" (bài viết) hoặc chưa biết tuần hiện tại. */
const NO_WEEK = Number.MAX_SAFE_INTEGER

interface ScoredRef {
  ref: SourceRef
  score: number
  /** Số từ khóa KHÁC NHAU của câu hỏi khớp với nguồn. */
  matched: number
  /** |tuần nguồn − tuần thai hiện tại| — chỉ có ý nghĩa với cẩm nang tuần. */
  weekGap: number
}

function scoreText(
  toks: string[],
  title: string,
  summary: string,
  body: string,
): { score: number; matched: number } {
  let raw = 0
  let matched = 0
  for (const t of toks) {
    if (title.includes(t)) {
      raw += WEIGHT_TITLE
      matched++
    } else if (summary.includes(t)) {
      raw += WEIGHT_SUMMARY
      matched++
    } else if (body.includes(t)) {
      raw += WEIGHT_BODY
      matched++
    }
  }
  const max = toks.length * WEIGHT_TITLE
  return { score: max > 0 ? raw / max : 0, matched }
}

/** Nguồn đạt ngưỡng: điểm ≥ MIN_SCORE và khớp ≥2 từ khóa riêng biệt
 * (nới 1 khi câu hỏi chỉ có 1 từ khóa) — chặn các khớp "voi" từ 1 từ phổ biến. */
function qualifies(toks: string[], r: { score: number; matched: number }): boolean {
  const minMatched = toks.length <= 1 ? 1 : 2
  return r.score >= MIN_SCORE && r.matched >= minMatched
}

// ---------------------------------------------------------------------------
// Lọc cứng theo giai đoạn (stage)
// ---------------------------------------------------------------------------

// Cẩm nang tuần là nội dung thai kỳ; bài viết phải khai báo đúng stage.
// Không có stage (caller không gửi) → không lọc: chấm điểm + ngưỡng lo phần còn lại.
function guideAllowed(stage: KnowledgeStage | null | undefined): boolean {
  return !stage || stage === 'pregnancy'
}

function articleAllowed(
  stage: KnowledgeStage | null | undefined,
  stages: readonly KnowledgeStage[],
): boolean {
  return !stage || stages.includes(stage)
}

/** Tuần thai hiện tại từ dashboard — lỗi/không có → null. */
async function currentWeek(): Promise<number | null> {
  const dash = await data.getDashboard().catch(() => null)
  return dash ? dash.week : null
}

// ---------------------------------------------------------------------------
// API công khai — chữ ký giữ nguyên cho caller (route chat)
// ---------------------------------------------------------------------------

/** Tìm bài viết/cẩm nang khớp truy vấn — trả tối đa `limit` nguồn ĐẠT NGƯỠNG. */
export async function searchSources(
  query: string,
  limit = 3,
  stage?: KnowledgeStage | null,
): Promise<SourceRef[]> {
  const toks = queryTokens(query)
  if (toks.length === 0) return []

  const [articles, guides, week] = await Promise.all([
    data.getArticles(),
    data.getWeeklyGuides(),
    currentWeek(),
  ])

  const scored: ScoredRef[] = []

  for (const a of articles) {
    if (!articleAllowed(stage, a.stages)) continue
    const s = scoreText(
      toks,
      a.title.toLowerCase(),
      (a.summary ?? '').toLowerCase(),
      a.body.toLowerCase(),
    )
    if (!qualifies(toks, s)) continue
    scored.push({
      ref: {
        id: a.id,
        title: a.title,
        source: a.source ?? a.author ?? 'Bài viết Mẹ & Bé',
        type: 'article',
        snippet: `${a.summary ?? a.body.slice(0, 120)}…`,
      },
      score: s.score,
      matched: s.matched,
      weekGap: NO_WEEK,
    })
  }

  for (const g of guides) {
    if (!guideAllowed(stage)) continue
    const s = scoreText(toks, g.title.toLowerCase(), '', g.content.toLowerCase())
    if (!qualifies(toks, s)) continue
    scored.push({
      ref: {
        id: g.id,
        title: g.title,
        source: `Cẩm nang tuần ${g.week}`,
        type: 'weekly_guide',
        snippet: `${g.content.slice(0, 120)}…`,
      },
      score: s.score,
      matched: s.matched,
      // Cùng điểm → ưu tiên cẩm nang SÁT tuần thai hiện tại ("thời điểm hiện tại").
      weekGap: week != null ? Math.abs(g.week - week) : NO_WEEK,
    })
  }

  return scored
    .sort((x, y) => y.score - x.score || x.weekGap - y.weekGap)
    .slice(0, limit)
    .map((s) => s.ref)
}

/** Trả lời trung thực khi KHÔNG có nguồn đạt ngưỡng: không bịa nguồn.
 * Ngữ cảnh thai kỳ → nêu tuần thai + dưỡng chất ưu tiên theo tuần (dữ liệu app);
 * còn lại → hướng dẫn hỏi lại bằng từ khóa cụ thể + khuyên gặp bác sĩ. */
async function honestReply(stage: KnowledgeStage | null | undefined): Promise<string> {
  const week = !stage || stage === 'pregnancy' ? await currentWeek() : null

  if (week != null) {
    const focus = await data.getNutritionFocus(week).catch(() => null)
    const nutrients = (focus?.nutrients ?? []).slice(0, 3).map((n) => n.name)
    const hint =
      nutrients.length > 0
        ? `Giai đoạn này mẹ nên ưu tiên các dưỡng chất: ${nutrients.join(', ')} — mẹ xem chi tiết ở mục Dinh dưỡng (theo tuần), hoặc hỏi lại mình với từ khóa cụ thể hơn (ví dụ: "canxi tuần ${week}", "sắt khi mang thai").`
        : `Mẹ xem gợi ý dinh dưỡng theo tuần ở mục Dinh dưỡng, hoặc hỏi lại mình với từ khóa cụ thể hơn (ví dụ: "dinh dưỡng tuần ${week}").`
    return [
      'Mẹ ơi, mình chưa tìm thấy bài viết/cẩm nang nào khớp chắc chắn với câu hỏi này trong thư viện, nên mình không trích nguồn để tránh mẹ đọc nhầm thông tin.',
      `Hiện tại mẹ đang ở tuần thai thứ ${week}. ${hint}`,
      'Nếu câu hỏi liên quan đến sức khỏe của mẹ và bé, mẹ nhớ trao đổi thêm với bác sĩ để được tư vấn chính xác nhất nhé.',
    ].join('\n\n')
  }

  return [
    'Mẹ ơi, mình chưa tìm thấy nội dung nào khớp chắc chắn với câu hỏi này trong thư viện, nên mình không trích nguồn để tránh mẹ đọc nhầm thông tin.',
    'Mẹ thử hỏi lại bằng từ khóa cụ thể hơn (ví dụ: "ăn dặm kiểu Nhật", "táo bón ở bé 6 tháng"), hoặc trao đổi với bác sĩ để được tư vấn đúng tình trạng nhé.',
  ].join('\n\n')
}

/** Trả lời fallback thuần nguồn khi không có AI — nguồn chỉ trả khi khớp ĐỦ ngưỡng. */
export async function sourceReply(
  query: string,
  stage?: KnowledgeStage | null,
): Promise<{ reply: string; sources: SourceRef[] }> {
  const sources = await searchSources(query, 3, stage)
  if (sources.length > 0) {
    const first = sources[0]!
    return {
      reply: `Trả lời từ nội dung trong thư viện của mẹ:\n\n${first.snippet}\n\n— Nguồn: ${first.title} (${first.source}). Đây là thông tin tham khảo, không thay thế bác sĩ.`,
      sources,
    }
  }
  return { reply: await honestReply(stage), sources: [] }
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
