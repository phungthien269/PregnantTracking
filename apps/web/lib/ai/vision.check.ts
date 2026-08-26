// ===========================================================================
// vision.check.ts — tự kiểm tra vision AI: gateway multimodal (client.ts) +
// meal-photo wire (recognize.ts). Mock fetch để kiểm tra BODY gửi đi mà KHÔNG
// cần network/key thật. Chạy:
//   cd apps/web && node --experimental-strip-types --import ./lib/library/node-loader.mjs lib/ai/vision.check.ts
// ===========================================================================

import { buildMultimodalContent, visionCompletion, chatCompletion } from './client'
import { aiRecognize, photoInputSchema, recognizeMealFromPhoto } from '../meals-photo/recognize'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`❌ ${msg}`)
  console.log(`  ✔ ${msg}`)
}

const KEY = 'test-key-123'
const DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
const MEAL_JSON = '{"meal_type":"lunch","name":"Cơm tấm sườn","calories":600,"note":"Giàu tinh bột."}'

interface CapturedCall {
  url: string
  body: { model?: string; messages?: unknown[] }
  headers: Record<string, string>
}

/** Thay fetch bằng mock: chạy handler với body đã parse, trả JSON soạn sẵn. */
function mockFetch(handler: (call: CapturedCall) => unknown): () => void {
  const realFetch = globalThis.fetch
  globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as CapturedCall['body']) : {}
    const call: CapturedCall = {
      url: String(url),
      body,
      headers: (init?.headers as Record<string, string>) ?? {},
    }
    const data = handler(call)
    return { ok: true, status: 200, json: async () => data } as unknown as Response
  }) as typeof fetch
  return () => {
    globalThis.fetch = realFetch
  }
}

async function main(): Promise<void> {
  process.env.OPENROUTER_API_KEY = KEY

  console.log('1. buildMultimodalContent — chuẩn OpenAI multimodal')
  const parts = buildMultimodalContent({ role: 'user', text: 'Mô tả', imageDataUrl: DATA_URL })
  assert(parts.length === 2, 'có text + image_url')
  assert(parts[0]?.type === 'text' && parts[0].text === 'Mô tả', 'phần đầu là text')
  assert(parts[1]?.type === 'image_url' && parts[1].image_url.url === DATA_URL, 'phần sau là image_url chứa data URL')
  const textOnly = buildMultimodalContent({ role: 'user', text: 'Chỉ text' })
  assert(textOnly.length === 1 && textOnly[0]?.type === 'text', 'không ảnh → chỉ text')

  console.log('2. visionCompletion — body gửi đúng multimodal')
  let restore = mockFetch((call) => {
    const userMsg = call.body.messages?.[1] as { content?: unknown } | undefined
    const content = userMsg?.content as { type: string; image_url?: { url: string } }[]
    assert(Array.isArray(content) && content.length === 2, 'user content là mảng 2 phần')
    assert(content[1]?.type === 'image_url' && content[1].image_url?.url === DATA_URL, 'chứa image_url với data URL')
    assert(call.headers.Authorization === `Bearer ${KEY}`, 'Authorization Bearer key')
    assert(call.body.model === 'google/gemma-4-26b-a4b-it:free', 'model mặc định Gemma free (hỗ trợ vision)')
    return { choices: [{ message: { content: '{"ok":true}' } }], model: 'google/gemma-4-26b-a4b-it:free' }
  })
  const vReply = await visionCompletion({
    messages: [
      { role: 'system', text: 'sys' },
      { role: 'user', text: 'Nhìn ảnh', imageDataUrl: DATA_URL },
    ],
  })
  assert(vReply.content === '{"ok":true}', 'trả content JSON như cũ')
  restore()

  console.log('3. chatCompletion — vẫn text thuần (không đổi hành vi)')
  restore = mockFetch((call) => {
    const content = (call.body.messages?.[0] as { content?: unknown } | undefined)?.content
    assert(typeof content === 'string', 'chatCompletion content vẫn là string')
    return { choices: [{ message: { content: 'chào' } }], model: 'openai/gpt-4o-mini' }
  })
  const cReply = await chatCompletion({ messages: [{ role: 'user', content: 'chào' }] })
  assert(cReply.content === 'chào', 'chatCompletion trả lời text bình thường')
  restore()

  console.log('4. aiRecognize — có ảnh → vision; chỉ tên file → text')
  restore = mockFetch((call) => {
    const content = (call.body.messages?.[1] as { content?: unknown } | undefined)?.content
    if (Array.isArray(content)) {
      assert(content.some((p) => (p as { type: string }).type === 'image_url'), 'có ảnh → gửi image_url')
    } else {
      assert(typeof content === 'string', 'chỉ tên file → gửi text string')
    }
    return { choices: [{ message: { content: MEAL_JSON } }], model: 'openai/gpt-4o-mini' }
  })
  const vision = await aiRecognize({
    filename: 'com-tam.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    imageDataUrl: DATA_URL,
  })
  assert(vision.name === 'Cơm tấm sườn' && vision.source === 'ai' && vision.model !== null, 'vision → nhận diện món thật')
  const text = await aiRecognize({ filename: 'com-tam.jpg', mimeType: 'image/jpeg', sizeBytes: 1024 })
  assert(text.name === 'Cơm tấm sườn', 'text-only vẫn nhận diện')
  restore()

  console.log('5. recognizeMealFromPhoto — fallback heuristic khi AI lỗi / không key')
  restore = mockFetch(() => {
    throw new Error('network down')
  })
  const fallback = await recognizeMealFromPhoto({
    filename: 'pho-bo.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    imageDataUrl: DATA_URL,
  })
  assert(fallback.source === 'heuristic' && fallback.name === 'Phở bò', 'AI lỗi → heuristic tên file')
  restore()
  process.env.OPENROUTER_API_KEY = ''
  const noKey = await recognizeMealFromPhoto({ filename: 'pho-bo.jpg', mimeType: 'image/jpeg', sizeBytes: 1024 })
  assert(noKey.source === 'heuristic' && noKey.name === 'Phở bò', 'không key → heuristic (không bế tắc)')

  console.log('6. photoInputSchema — nhận imageDataUrl hợp lệ, từ chối sai')
  assert(
    photoInputSchema.safeParse({ filename: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 1, imageDataUrl: DATA_URL })
      .success,
    'chấp nhận data URL ảnh',
  )
  assert(
    !photoInputSchema.safeParse({ filename: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 1, imageDataUrl: 'https://x.com/a.jpg' })
      .success,
    'từ chối URL http',
  )
  assert(
    !photoInputSchema
      .safeParse({ filename: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 1, imageDataUrl: 'data:text/plain;base64,abc' })
      .success,
    'từ chối data URL không phải ảnh',
  )

  console.log('\n✅ vision.check OK — gateway multimodal + meal-photo wire + fallback')
}

await main()
