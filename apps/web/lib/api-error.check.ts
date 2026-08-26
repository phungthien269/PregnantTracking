// ===========================================================================
// api-error.check.ts — test helper lỗi API ngoại tuyến (apps/web/lib/api-error.ts).
// Chạy: cd code && node --experimental-strip-types apps/web/lib/api-error.check.ts
// ===========================================================================

import { OFFLINE_MESSAGE, apiErrorMessage, isOfflineError } from './api-error'

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

// ---- isOfflineError: envelope OFFLINE từ SW ----
test('envelope OFFLINE (SW v2, status 503) → offline', () => {
  const body = { error: { code: 'OFFLINE', message: 'Không có kết nối mạng.' } }
  assert(isOfflineError(body) === true, 'phải nhận diện OFFLINE')
  assert(apiErrorMessage(body, 'lỗi') === OFFLINE_MESSAGE, 'message thân thiện')
})

test('TypeError "Failed to fetch" (mạng chết, dev) → offline', () => {
  const err = new TypeError('Failed to fetch')
  assert(isOfflineError(err) === true, 'TypeError là offline')
  assert(apiErrorMessage(err, 'lỗi') === OFFLINE_MESSAGE, 'message thân thiện')
})

// ---- lỗi khác: message chuẩn từ error.message ----
test('lỗi server có message → trả message chuẩn', () => {
  const body = { error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu gửi lên không hợp lệ' } }
  assert(isOfflineError(body) === false, 'không phải offline')
  assert(apiErrorMessage(body, 'lỗi') === 'Dữ liệu gửi lên không hợp lệ', 'message chuẩn')
})

test('envelope không có error → fallback', () => {
  assert(apiErrorMessage(null, 'lỗi chung') === 'lỗi chung', 'null → fallback')
  assert(apiErrorMessage({ data: { ok: true } }, 'lỗi chung') === 'lỗi chung', 'data → fallback')
  assert(apiErrorMessage({ error: {} }, 'lỗi chung') === 'lỗi chung', 'error rỗng → fallback')
})

console.log(`\n✅ api-error.check OK — ${n} test`)
