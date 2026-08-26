// ===========================================================================
// Test: cx() — gộp class, bỏ falsy (util thuần duy nhất của @mevabe/ui).
// Dùng assert cục bộ (không import node:assert).
// ===========================================================================
import { cx } from './cx'

const results: { name: string; ok: boolean; err?: string }[] = []
const test = (name: string, fn: () => void): void => {
  try {
    fn()
    results.push({ name, ok: true })
  } catch (e) {
    results.push({ name, ok: false, err: (e as Error).message })
  }
}
const assert = {
  equal: (a: unknown, b: unknown, msg?: string): void => {
    if (a !== b) throw new Error(`${msg ?? 'equal'} — expected ${String(b)}, got ${String(a)}`)
  },
}

test('cx ghép các class chuỗi', () => {
  assert.equal(cx('a', 'b', 'c'), 'a b c')
})
test('cx bỏ falsy (false, null, undefined, empty string)', () => {
  assert.equal(cx('a', false, null, undefined, '', 'b'), 'a b')
})
test('cx không đối số → chuỗi rỗng', () => {
  assert.equal(cx(), '')
})

const failed = results.filter((r) => !r.ok)
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.err ? ' — ' + r.err : ''}`)
}
if (failed.length > 0) {
  throw new Error(`cx.test.ts: ${failed.length}/${results.length} test thất bại`)
}
console.log(`✅ cx.test.ts OK — ${results.length} test`)
