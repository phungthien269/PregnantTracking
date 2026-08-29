import { z } from 'zod'
import { KNOWLEDGE_STAGES } from '@mevabe/domain'
import { apiOk, parseBody } from '@/lib/api-utils'
import { chatCompletion, aiConfigured, AI_MODELS, providerOf } from '@/lib/ai/client'
import { chatSystemPrompt, buildChatContext, type MedicalVisitContext } from '@/lib/ai/prompts'
import { sourceReply } from '@/lib/ai/sources'
import { chatStore } from '@/lib/ai/chat-store'
import { data } from '@/lib/data'
import { CONDITION_LABELS } from '@/lib/labels'

const stageSchema = z.enum(KNOWLEDGE_STAGES)
const bodySchema = z.object({
  message: z.string().min(1).max(4000),
  /** Giai đoạn kiến thức (mang thai / sau sinh / bé) — tuỳ chọn. */
  stage: stageSchema.nullable().optional(),
  /** Phiên chat đang mở — chưa có (cuộc mới) → route tự tạo và trả sessionId. */
  sessionId: z.string().uuid().nullable().optional(),
})

// GET /api/v1/ai/chat — cấu hình AI cho UI (model/provider/trạng thái).
export async function GET(): Promise<Response> {
  return apiOk({
    configured: aiConfigured(),
    model: AI_MODELS.default,
    provider: providerOf(AI_MODELS.default),
  })
}

// POST /api/v1/ai/chat — trả lời chat + PERSIST hội thoại (chat_sessions/chat_messages).
// - Nhớ nhiều lượt: gửi kèm lịch sử tin nhắn của session (tối đa 10 tin gần nhất).
// - Không gửi định danh. Không có key hoặc AI lỗi → fallback nội dung nguồn (bài viết/cẩm nang).
// - Chưa đăng nhập → vẫn trả lời (như cũ) nhưng không persist (chatStore trả null).
export async function POST(req: Request): Promise<Response> {
  const parsed = parseBody(bodySchema, await req.json().catch(() => null))
  if (!parsed.ok) return parsed.error
  const { message, stage, sessionId } = parsed.data

  // Tiêu đề session = câu hỏi đầu (cắt 50 ký tự). ensureSession chỉ đặt title khi tạo mới.
  const session = await chatStore
    .ensureSession({ sessionId, title: message.slice(0, 50), stage })
    .catch((err) => {
      console.error('[ai/chat] ensureSession lỗi (chat vẫn chạy, không persist):', (err as Error).message)
      return null
    })

  let reply = ''
  let sources: { id: string; title: string; source: string; type: 'article' | 'weekly_guide'; snippet?: string }[] = []
  let model: string | null = null
  let provider: string | null = null
  let ai = false
  let note: string | undefined

  if (!aiConfigured()) {
    // Không có key AI → fallback nguồn (vẫn lưu câu hỏi + trả lời vào lịch sử).
    const fb = await sourceReply(message, stage)
    reply = fb.reply
    sources = fb.sources
  } else {
    // Lấy ngữ cảnh cá nhân (tuần thai, triệu chứng theo tuần, đo lường, lịch sử khám...) → AI trả lời SÁT user.
    // Không gửi định danh. Lỗi data (mock/supabase) → chat vẫn chạy, chỉ thiếu context.
    const [dash, syms, preg, visits, profile] = await Promise.all([
      data.getDashboard().catch(() => null),
      data.getSymptoms().catch(() => null),
      data.getPregnancy().catch(() => null),
      data.getMedicalVisits().catch(() => null),
      data.getNutritionProfile().catch(() => null),
    ])

    // Hồ sơ khám: 5 lần gần nhất (getMedicalVisits đã sắp visit_date desc), mỗi lần ≤2 ảnh, mỗi ocr_text ≤200 ký tự.
    // Lỗi đọc tài liệu của 1 lần khám → bỏ ảnh của lần đó, không làm hỏng cả context.
    let medicalVisits: MedicalVisitContext[] | undefined
    if (visits && visits.length > 0) {
      medicalVisits = await Promise.all(
        visits.slice(0, 5).map(async (v) => {
          const docs = await data.getVisitDocuments(v.id).catch(() => [])
          return {
            visit_date: v.visit_date,
            clinic: v.clinic ?? undefined,
            reason: v.reason ?? undefined,
            notes: v.notes ?? undefined,
            ocrTexts: docs
              .slice(0, 2)
              .map((d) => (d.ocr_text ?? '').trim())
              .filter(Boolean),
          }
        }),
      )
    }

    const context = dash
      ? buildChatContext(dash, {
          symptoms: syms,
          lmp: preg?.lmp ?? null,
          medicalVisits,
          // Tình trạng đặc biệt: đổi mã → tên tiếng Việt (VD gestational_diabetes → "Tiểu đường thai kỳ").
          // Không gửi mã/định danh. getNutritionProfile null → bỏ qua.
          conditions: profile?.conditions?.map((c) => CONDITION_LABELS[c]),
          doctorInstructions: profile?.doctor_instructions ?? undefined,
        })
      : undefined

    // Nhớ hội thoại: lịch sử session (user/assistant, tối đa 10 tin) chèn giữa system và câu hỏi mới.
    const history = session ? await chatStore.getAiHistory(session.sessionId, 10).catch(() => []) : []

    try {
      const replyData = await chatCompletion({
        messages: [
          { role: 'system', content: chatSystemPrompt(stage, context) },
          ...history,
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        maxTokens: 500,
      })
      reply = replyData.content
      model = replyData.model
      provider = replyData.provider
      ai = true
    } catch (err) {
      const fb = await sourceReply(message, stage)
      reply = fb.reply
      sources = fb.sources
      note = 'AI tạm lỗi — trả nội dung nguồn: ' + (err as Error).message
    }
  }

  // Lưu hội thoại (2 dòng: user + assistant, kèm nguồn nếu có). Lỗi persist → chat vẫn trả lời.
  // Ghi TUẦN TỰ + set created_at tăng dần để giữ đúng thứ tự user → assistant khi đọc lại.
  if (session) {
    const sourceIds = sources.map((s) => s.id)
    const tUser = new Date().toISOString()
    await chatStore
      .appendMessage({ sessionId: session.sessionId, role: 'user', content: message, created_at: tUser })
      .catch((err) => {
        console.error('[ai/chat] Lưu tin user lỗi:', (err as Error).message)
      })
    await chatStore
      .appendMessage({
        sessionId: session.sessionId,
        role: 'assistant',
        content: reply,
        sources: sourceIds,
        created_at: new Date(Date.parse(tUser) + 1).toISOString(),
      })
      .catch((err) => {
        console.error('[ai/chat] Lưu tin assistant lỗi:', (err as Error).message)
      })
  }

  return apiOk({
    reply,
    sources,
    model,
    provider,
    ai,
    sessionId: session?.sessionId ?? null,
    note,
  })
}
