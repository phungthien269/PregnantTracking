// ===========================================================================
// ocr.check.ts — tự kiểm tra OCR giấy tờ y tế: lib/ai/ocr.ts (readImageText) +
// route POST /api/v1/vision/ocr. Mock fetch để kiểm tra BODY gửi đi + response
// mà KHÔNG cần network/key thật. Chạy: scripts/test-web.sh
// ===========================================================================

import { readImageText, ocrInputSchema } from './ocr'
import { POST } from '../../app/api/v1/vision/ocr/route'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`❌ ${msg}`)
  console.log(`  ✔ ${msg}`)
}

const KEY = 'test-key-123'
const DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
const OCR_TEXT = 'Paracetamol 500mg — uống 1 viên x 3 lần/ngày sau ăn.\nGhi chú: tái khám sau 7 ngày.'

interface CapturedCall {
  url: string
  body: { model?: string; messages?: unknown[] }
}

/** Thay fetch bằng mock: chạy handler với body đã parse, trả JSON soạn sẵn. */
function mockFetch(handler: (call: CapturedCall) => unknown): () => void {
  const realFetch = globalThis.fetch
  globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as CapturedCall['body']) : {}
    const call: CapturedCall = { url: String(url), body }
    const data = handler(call)
    return { ok: true, status: 200, json: async () => data } as unknown as Response
  }) as typeof fetch
  return () => {
    globalThis.fetch = realFetch
  }
}

/** Gọi đúng handler route POST /api/v1/vision/ocr với body JSON. */
const callRoute = (body: unknown): Promise<Response> =>
  POST(
    new Request('http://localhost/api/v1/vision/ocr', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  )

async function main(): Promise<void> {
  process.env.OPENROUTER_API_KEY = KEY

  console.log('1. readImageText — data URL → text tiếng Việt')
  let restore = mockFetch((call) => {
    const userMsg = call.body.messages?.[1] as { content?: unknown } | undefined
    const content = userMsg?.content as { type: string; image_url?: { url: string } }[]
    assert(Array.isArray(content) && content[1]?.type === 'image_url', 'gửi multimodal image_url')
    assert(content[1]?.image_url?.url === DATA_URL, 'image_url là data URL gốc')
    return { choices: [{ message: { content: OCR_TEXT } }], model: 'google/gemma-4-26b-a4b-it:free' }
  })
  const text = await readImageText(DATA_URL)
  assert(text === OCR_TEXT, `trả đúng text (${text?.slice(0, 24)}…)`)
  restore()

  console.log('2. route POST — body hợp lệ → { ok:true, text }')
  restore = mockFetch(() => ({ choices: [{ message: { content: OCR_TEXT } }], model: 'google/gemma-4-26b-a4b-it:free' }))
  const r = await callRoute({ imageDataUrl: DATA_URL })
  const body = (await r.json()) as { ok?: boolean; text?: string | null }
  assert(r.status === 200 && body.ok === true && body.text === OCR_TEXT, '200 + { ok:true, text }')
  restore()

  console.log('3. không key → text null (không 500)')
  process.env.OPENROUTER_API_KEY = ''
  const noKey = await readImageText(DATA_URL)
  assert(noKey === null, 'readImageText không key → null')
  const r2 = await callRoute({ imageDataUrl: DATA_URL })
  const b2 = (await r2.json()) as { ok?: boolean; text?: string | null }
  assert(r2.status === 200 && b2.ok === true && b2.text === null, 'route không key → { ok:true, text:null }')

  console.log('4. AI trả rỗng → null (không 500)')
  process.env.OPENROUTER_API_KEY = KEY
  restore = mockFetch(() => ({ choices: [{ message: { content: '  \n ' } }], model: 'google/gemma-4-26b-a4b-it:free' }))
  const empty = await readImageText(DATA_URL)
  assert(empty === null, 'AI trả rỗng → null')
  restore()

  console.log('5. ảnh không hợp lệ → 400 (route)')
  const bad = await callRoute({ imageDataUrl: 'data:text/plain;base64,abc' })
  assert(bad.status === 400, `data URL không phải ảnh → 400 (thực tế ${bad.status})`)
  const badBody = (await bad.json()) as { error?: { code?: string } }
  assert(badBody.error?.code === 'VALIDATION_ERROR', 'code VALIDATION_ERROR')
  const bad2 = await callRoute({ imageDataUrl: 'https://x.com/a.jpg' })
  assert(bad2.status === 400, 'URL http → 400')
  assert(!ocrInputSchema.safeParse({ imageDataUrl: 'https://x.com/a.jpg' }).success, 'schema từ chối URL http')
  const bad3 = await callRoute({ imageDataUrl: 'data:image/png;base64,'.padEnd(14 * 1024 * 1024, 'A') })
  assert(bad3.status === 400, 'data URL > 10MB → 400')

  console.log('\n✅ ocr.check OK — OCR giấy tờ y tế (readImageText + route /api/v1/vision/ocr)')
}

await main()
