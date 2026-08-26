// ===========================================================================
// api-utils.check.ts — test envelope API (apps/web/lib/api-utils.ts):
//   apiOk / apiError / parseBody / parsePathId đúng shape `{ data }` và
//   `{ error: { code, message, details } }`.
// Chạy: scripts/test-web.sh (loader riêng map `next/server` + `@mevabe/domain`).
// ===========================================================================

import { apiOk, apiError, parseBody, parsePathId } from './api-utils'
import { z } from 'zod'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
}

let n = 0
const test = (name: string, fn: () => void): void => {
  n++
  try {
    fn()
    console.log(`  ✔ ${n}. ${name}`)
  } catch (e) {
    console.error(`  ✘ ${n}. ${name} — ${(e as Error).message}`)
    throw e
  }
}

const json = (r: Response): Promise<unknown> => r.json()

// ---- apiOk: { data } ----
test('apiOk mặc định status 200, body { data }', async () => {
  const r = apiOk({ deleted: true })
  assert(r.status === 200, `status = ${r.status}`)
  assert(JSON.stringify(await json(r)) === '{"data":{"deleted":true}}', 'body { data }')
})

test('apiOk với status tuỳ chỉnh (201)', async () => {
  const r = apiOk({ id: 'x' }, 201)
  assert(r.status === 201, 'status 201')
  assert(JSON.stringify(await json(r)) === '{"data":{"id":"x"}}', 'body giữ data')
})

// ---- apiError: { error: { code, message, details } } ----
test('apiError mặc định 400, body { error: { code, message } }', async () => {
  const r = apiError('VALIDATION_ERROR', 'ID không hợp lệ')
  assert(r.status === 400, 'status 400')
  const body = (await json(r)) as { error?: { code?: string; message?: string; details?: unknown } }
  assert(body.error?.code === 'VALIDATION_ERROR', `code = ${body.error?.code}`)
  assert(body.error?.message === 'ID không hợp lệ', 'message tiếng Việt')
  assert(body.error?.details === undefined, 'không truyền details → không có key')
})

test('apiError có details + status 422', async () => {
  const r = apiError('X', 'msg', { fields: ['name'] }, 422)
  assert(r.status === 422, 'status 422')
  const body = (await json(r)) as { error?: { details?: unknown } }
  assert(JSON.stringify(body.error?.details) === '{"fields":["name"]}', 'details giữ nguyên')
})

// ---- parseBody: Zod ----
test('parseBody hợp lệ → { ok:true, data }', () => {
  const schema = z.object({ name: z.string().min(1) })
  const r = parseBody(schema, { name: 'Mẹ' })
  assert(r.ok === true, 'ok = true')
  if (r.ok) assert(r.data.name === 'Mẹ', 'data đúng')
})

test('parseBody không hợp lệ → { ok:false, error } với 400 + VALIDATION_ERROR', async () => {
  const schema = z.object({ name: z.string().min(1) })
  const r = parseBody(schema, { name: '' })
  assert(r.ok === false, 'ok = false')
  if (!r.ok) {
    assert(r.error.status === 400, 'status 400')
    const body = (await json(r.error)) as { error?: { code?: string; details?: unknown } }
    assert(body.error?.code === 'VALIDATION_ERROR', `code = ${body.error?.code}`)
    assert(body.error?.details !== undefined, 'có details là flatten của Zod')
  }
})

// ---- parsePathId: UUID ----
test('parsePathId UUID hợp lệ → { id }', async () => {
  const r = await parsePathId(Promise.resolve({ id: '40000000-0000-0000-0000-0000000000aa' }))
  assert('id' in r && r.id === '40000000-0000-0000-0000-0000000000aa', 'trả id')
})

test('parsePathId không phải UUID → { error } 400 + VALIDATION_ERROR', async () => {
  const r = await parsePathId(Promise.resolve({ id: 'abc' }))
  if ('id' in r) throw new Error('❌ không phải UUID nhưng trả id')
  assert(r.error.status === 400, 'status 400')
  const body = (await json(r.error)) as { error?: { code?: string } }
  assert(body.error?.code === 'VALIDATION_ERROR', 'code VALIDATION_ERROR')
})

console.log(`\n✅ api-utils.check OK — ${n} test`)
