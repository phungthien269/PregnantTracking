// ===========================================================================
// Gateway OpenRouter — chạy server-side (route handler / server component).
// - Không bật input/output logging; không gửi định danh (tên/email/SĐT) vào prompt.
// - Thiếu OPENROUTER_API_KEY → apiKey() trả null, nơi gọi tự fallback nguồn.
// - Hỗ trợ cả text (chatCompletion) và ảnh (visionCompletion) theo chuẩn OpenAI
//   multimodal: content: [{type:"text", text}, {type:"image_url", image_url:{url}}].
//   Vision dùng model FREE có đọc ảnh (Gemma 4 26B) — không tốn phí.
// - Model chính lỗi tạm thời (429/5xx/provider error) → tự thử lần lượt chuỗi
//   AI_FALLBACK_MODELS (env, mặc định google/gemini-2.0-flash); AiReply.model là
//   model ĐÃ dùng thành công; tất cả fail → ném lỗi của lần thử cuối.
// ===========================================================================

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

/** Thời gian chờ tối đa cho 1 lần gọi OpenRouter (ms). Tránh request treo vô hạn khi
 * provider không phản hồi — server route handler không tự hết hạn ở mọi môi trường. */
const AI_TIMEOUT_MS = 60_000

/** Model allowlist — ổn định cho tiếng Việt + JSON.
 * default + vision = google/gemma-4-26b-a4b-it:free (free, đọc ảnh + text, không
 * suy luận → trả nội dung ổn định; đã test chạy với key). Tránh model dạng
 * reasoning (VD nemotron-nano-9b, ling-flash): thi thoảng dùng hết max_tokens
 * cho phần suy luận → content rỗng. */
export const AI_MODELS = {
  // 2026-09-03: test toàn bộ 20 model free — gemma-4-26b/4-31b trả RỖNG,
  // qwen 429; nemotron-3-ultra + cohere/north-mini trả lời đúng trọng tâm tiếng Việt.
  default: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  fallback: 'cohere/north-mini-code:free',
  vision: 'google/gemma-4-26b-a4b-it:free',
} as const

/** Chuỗi model dự phòng từ env AI_FALLBACK_MODELS (comma-separated, giữ thứ tự).
 * Không set/env rỗng → [AI_MODELS.fallback]. Bỏ phần tử trống + loại lặp. */
export function aiFallbackModels(): string[] {
  const raw = process.env.AI_FALLBACK_MODELS?.trim()
  const list = raw ? raw.split(',') : [AI_MODELS.fallback]
  return [...new Set(list.map((s) => s.trim()).filter(Boolean))]
}

/** Chuỗi thử lần lượt: model chính trước, sau đó các model dự phòng khác nó. */
function modelChain(primary: string): string[] {
  return [primary, ...aiFallbackModels().filter((m) => m !== primary)]
}

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
  return (
    (Object.values(AI_MODELS) as string[]).includes(model) ||
    aiFallbackModels().includes(model) // model dự phòng từ env cũng hợp lệ
  )
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

/** Lỗi TẠM THỜI của model hiện tại → đáng thử model kế trong chuỗi dự phòng:
 * 429 rate-limit, 5xx upstream, chi tiết "Provider returned error", timeout/network.
 * Lỗi khác (400 sai tham số, EMPTY…) là lỗi cứng của request → ném ngay. */
/** Mã lỗi ngắn để log, vd "429", "TIMEOUT". */
function briefError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  const m = msg.match(/^OPENROUTER_[A-Z0-9_]+/)
  return m ? m[0].replace(/^OPENROUTER_/, '') : msg.slice(0, 60)
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
async function postOpenRouter(body: Record<string, unknown>, retryNoJson = false, stripFences = false): Promise<AiReply> {
  const key = apiKey()
  if (!key) throw new Error('NO_API_KEY — chưa cấu hình OPENROUTER_API_KEY')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)
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
      signal: controller.signal,
    })
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw new Error('OPENROUTER_TIMEOUT — hết thời gian chờ OpenRouter')
    throw new Error('OPENROUTER_NETWORK — không kết nối được OpenRouter')
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    if (retryNoJson && body.response_format && isJsonFormatRejected(res.status, detail)) {
      const { response_format: _omit, ...bodyNoJson } = body
      // Thử lại KHÔNG response_format; vẫn bóc code fence vì model (VD Gemma) hay bọc JSON trong ```json.
      return postOpenRouter(bodyNoJson, false, true)
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
  // để caller JSON.parse được trực tiếp. Áp dụng cả ở lần retry (không response_format)
  // vì model vẫn có thể bọc JSON trong code fence.
  const content = stripFences ? stripCodeFences(raw) : raw
  const used = payload.model ?? String(body.model)
  return { content, model: used, provider: providerOf(used) }
}

/** Bóc khung markdown code fence (```json …``` / ``` …```) quanh nội dung. */
function stripCodeFences(s: string): string {
  const m = s.match(/^```(?:json|text)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/)
  return m?.[1]?.trim() ?? s
}

/** Gọi postOpenRouter lần lượt theo chuỗi model: model chính trước; chỉ khi lỗi
 * TẠM THỜI (429/5xx/provider error/timeout) mới thử model kế. Mỗi lần thử giữ
 * nguyên timeout AI_TIMEOUT_MS. Trả về AiReply kèm model ĐÃ dùng thành công;
 * tất cả fail → ném lỗi của lần thử CUỐI (giữ hành vi caller hiện tại). */
async function postOpenRouterChain(
  base: Record<string, unknown>,
  chain: string[],
  retryNoJson = false,
  stripFences = false,
): Promise<AiReply> {
  let lastError: unknown
  // 429 của model free là theo cửa sổ phút → quét chuỗi lần 1, chờ 2.5s, quét lần 2.
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt === 1) {
      console.warn('[ai] quét chuỗi model lần 2 sau 2.5s chờ cửa sổ rate-limit')
      await new Promise((r) => setTimeout(r, 2500))
    }
    for (let i = 0; i < chain.length; i++) {
      try {
        const reply = await postOpenRouter({ ...base, model: chain[i] }, retryNoJson, stripFences)
        // Model reasoning/free thi thoảng trả content RỖNG (nuốt hết token vào suy luận)
        // → coi như lỗi và thử model kế trong chuỗi.
        if (!reply.content?.trim()) {
          lastError = new Error(`OPENROUTER_EMPTY — ${chain[i]} trả phản hồi rỗng`)
          console.warn(`[ai] model ${chain[i]} trả rỗng → thử model kế`)
          continue
        }
        return reply
      } catch (e) {
        lastError = e
        const next = chain[i + 1]
        console.warn(`[ai] model ${chain[i]} lỗi ${briefError(e)} → ${next ? `thử ${next}` : 'hết chuỗi'}`)
        if (!next) break
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('OPENROUTER_FAILED — mọi model trong chuỗi dự phòng đều lỗi')
}

export async function chatCompletion(req: AiRequest): Promise<AiReply> {
  const body: Record<string, unknown> = {
    messages: req.messages,
    temperature: req.temperature ?? 0.6,
  }
  if (req.json) body.response_format = { type: 'json_object' }
  if (req.maxTokens) body.max_tokens = req.maxTokens
  return postOpenRouterChain(body, modelChain(resolveModel(req.model)), Boolean(req.json), Boolean(req.json))
}

/** Gửi ảnh (data URL) kèm text cho model vision — AI nhìn PIXEL ảnh, không chỉ tên file.
 * Cùng hưởng chuỗi dự phòng: model vision 429 → thử model kế (đều đọc được ảnh). */
export async function visionCompletion(req: AiVisionRequest): Promise<AiReply> {
  const body: Record<string, unknown> = {
    messages: req.messages.map((m) => ({ role: m.role, content: buildMultimodalContent(m) })),
    temperature: req.temperature ?? 0.3,
  }
  if (req.json) body.response_format = { type: 'json_object' }
  if (req.maxTokens) body.max_tokens = req.maxTokens
  return postOpenRouterChain(body, modelChain(resolveVisionModel(req.model)), Boolean(req.json), Boolean(req.json))
}
