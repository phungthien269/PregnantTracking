// ===========================================================================
// Gateway OpenRouter — chạy server-side (route handler / server component).
// - Không bật input/output logging; không gửi định danh (tên/email/SĐT) vào prompt.
// - Thiếu OPENROUTER_API_KEY → apiKey() trả null, nơi gọi tự fallback nguồn.
// - Hỗ trợ cả text (chatCompletion) và ảnh (visionCompletion) theo chuẩn OpenAI
//   multimodal: content: [{type:"text", text}, {type:"image_url", image_url:{url}}].
//   Vision dùng model FREE có đọc ảnh (Gemma 4 26B) — không tốn phí.
// ===========================================================================

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

/** Model allowlist — ổn định cho tiếng Việt + JSON.
 * default + vision = google/gemma-4-26b-a4b-it:free (free, đọc ảnh + text, không
 * suy luận → trả nội dung ổn định; đã test chạy với key). Tránh model dạng
 * reasoning (VD nemotron-nano-9b, ling-flash): thi thoảng dùng hết max_tokens
 * cho phần suy luận → content rỗng. */
export const AI_MODELS = {
  default: 'google/gemma-4-26b-a4b-it:free',
  fallback: 'google/gemini-2.0-flash',
  vision: 'google/gemma-4-26b-a4b-it:free',
} as const

export type AiRole = 'system' | 'user' | 'assistant'
export interface AiMessage {
  role: AiRole
  content: string
}

export interface AiRequest {
  messages: AiMessage[]
  /** Model người dùng chọn (phải trong allowlist); mặc định AI_MODELS.default. */
  model?: string
  temperature?: number
  /** Yêu cầu JSON thuần. Gửi response_format:{type:'json_object'} — nếu provider từ
   * chối (model không hỗ trợ structured outputs), client tự thử lại 1 lần KHÔNG có
   * response_format (prompt vẫn yêu cầu JSON + caller parse bằng Zod). */
  json?: boolean
  maxTokens?: number
}

/** Tin nhắn cho visionCompletion — text + ảnh dạng data URL. */
export interface AiVisionMessage {
  role: AiRole
  text: string
  /** Data URL ảnh (data:image/...;base64,...) — nếu có, gửi multimodal để AI nhìn pixel. */
  imageDataUrl?: string
}

export interface AiVisionRequest {
  messages: AiVisionMessage[]
  model?: string
  temperature?: number
  json?: boolean
  maxTokens?: number
}

export interface AiReply {
  content: string
  model: string
  provider: string
}

/** Một phần nội dung multimodal theo chuẩn OpenAI (text hoặc image_url). */
export type MultimodalContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export function isAllowedModel(model: string): boolean {
  return (Object.values(AI_MODELS) as string[]).includes(model)
}

/** API key từ env (server-side). Trả null khi chưa cấu hình → nơi gọi dùng fallback. */
export function apiKey(): string | null {
  return process.env.OPENROUTER_API_KEY?.trim() || null
}

/** provider = phần trước '/' của model id (vd openai/gpt-4o-mini → openai). */
export function providerOf(model: string): string {
  return model.split('/')[0] || model
}

export function aiConfigured(): boolean {
  return Boolean(apiKey())
}

/** Biên soạn content theo chuẩn OpenAI multimodal: text trước, ảnh sau (nếu có). */
export function buildMultimodalContent(m: AiVisionMessage): MultimodalContentPart[] {
  const parts: MultimodalContentPart[] = [{ type: 'text', text: m.text }]
  if (m.imageDataUrl) parts.push({ type: 'image_url', image_url: { url: m.imageDataUrl } })
  return parts
}

/** Chọn model: req.model nếu trong allowlist, ngược lại default. */
function resolveModel(model?: string): string {
  return model && isAllowedModel(model) ? model : AI_MODELS.default
}

/** Chọn model cho VISION: ưu tiên model người dùng chỉ định, mặc định AI_MODELS.vision
 * (ling-flash không chắc hỗ trợ ảnh → luôn dùng model vision riêng). */
function resolveVisionModel(model?: string): string {
  return model && isAllowedModel(model) ? model : AI_MODELS.vision
}

/** Kiểm tra provider từ chối response_format (JSON mode): model không hỗ trợ
 * structured outputs → HTTP 400 kèm message kiểu "does not support feature:
 * structured-outputs" (Novita/ling) hoặc "response_format not supported". */
function isJsonFormatRejected(status: number, detail: string): boolean {
  return (
    status === 400 &&
    /structured[_-]?\s*outputs?|response[_\s-]?format|json[_\s-]?(object|mode)|does not support/i.test(detail)
  )
}

/** POST chung tới OpenRouter — chatCompletion và visionCompletion dùng chung.
 * retryNoJson=true: nếu provider từ chối response_format (json:true) thì thử lại
 * 1 lần KHÔNG có response_format — fix cho mọi caller json (quiz, OCR, meal-photo…). */
async function postOpenRouter(body: Record<string, unknown>, retryNoJson = false): Promise<AiReply> {
  const key = apiKey()
  if (!key) throw new Error('NO_API_KEY — chưa cấu hình OPENROUTER_API_KEY')

  let res: Response
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'https://mevabe.vercel.app',
        'X-Title': 'MeVaBe', // ASCII — header value non-ASCII khiến fetch() ném TypeError
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('OPENROUTER_NETWORK — không kết nối được OpenRouter')
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    if (retryNoJson && body.response_format && isJsonFormatRejected(res.status, detail)) {
      const { response_format: _omit, ...bodyNoJson } = body
      return postOpenRouter(bodyNoJson, false)
    }
    throw new Error(`OPENROUTER_${res.status} — ${detail.slice(0, 160)}`)
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
    model?: string
  }
  const raw = payload.choices?.[0]?.message?.content?.trim()
  if (!raw) throw new Error('OPENROUTER_EMPTY — phản hồi rỗng')
  // Khi yêu cầu JSON: nhiều model (VD Gemma) trả kèm khung ```json …``` — bóc ra
  // để caller JSON.parse được trực tiếp.
  const content = retryNoJson ? stripCodeFences(raw) : raw
  const used = payload.model ?? String(body.model)
  return { content, model: used, provider: providerOf(used) }
}

/** Bóc khung markdown code fence (```json …``` / ``` …```) quanh nội dung. */
function stripCodeFences(s: string): string {
  const m = s.match(/^```(?:json|text)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/)
  return m?.[1]?.trim() ?? s
}

export async function chatCompletion(req: AiRequest): Promise<AiReply> {
  const body: Record<string, unknown> = {
    model: resolveModel(req.model),
    messages: req.messages,
    temperature: req.temperature ?? 0.6,
  }
  if (req.json) body.response_format = { type: 'json_object' }
  if (req.maxTokens) body.max_tokens = req.maxTokens
  return postOpenRouter(body, Boolean(req.json))
}

/** Gửi ảnh (data URL) kèm text cho model vision — AI nhìn PIXEL ảnh, không chỉ tên file. */
export async function visionCompletion(req: AiVisionRequest): Promise<AiReply> {
  const body: Record<string, unknown> = {
    model: resolveVisionModel(req.model),
    messages: req.messages.map((m) => ({ role: m.role, content: buildMultimodalContent(m) })),
    temperature: req.temperature ?? 0.3,
  }
  if (req.json) body.response_format = { type: 'json_object' }
  if (req.maxTokens) body.max_tokens = req.maxTokens
  return postOpenRouter(body, Boolean(req.json))
}
