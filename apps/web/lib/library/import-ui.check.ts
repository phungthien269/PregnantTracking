// ===========================================================================
// import-ui.check.ts — tự kiểm tra helper UI import thư viện:
//   - validateImport mirror luật server (url, size, đuôi file)
//   - buildImportPayload đúng format: text/url → JSON, file → multipart `file`
//   - payload JSON pass schema (mirror importJsonSchema của route)
// Chạy:
//   cd apps/web && node --experimental-strip-types --import ./lib/library/node-loader.mjs lib/library/import-ui.check.ts
// ===========================================================================

import { z } from 'zod'
import {
  ALLOWED_IMPORT_EXTS,
  MAX_IMPORT_MB,
  buildImportPayload,
  validateImport,
  type ImportFormValues,
} from './import-ui'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
  console.log(`  ✔ ${msg}`)
}

// Schema mirror route POST /api/v1/knowledge-sources → importJsonSchema.
const importJsonSchema = z
  .object({
    url: z.string().url().max(2000).optional(),
    text: z.string().min(1).max(200_000).optional(),
  })
  .refine((v) => v.url || v.text, { message: 'Cần url hoặc text' })

const empty = (): ImportFormValues => ({ text: '', url: '', file: null })

function main(): void {
  // ---- 1. validateImport ----
  console.log('1. validateImport — mirror luật server')
  assert(validateImport('text', { ...empty(), text: '   ' }).ok === false, 'text rỗng → lỗi')
  assert(validateImport('text', { ...empty(), text: 'Mẹ bầu cần 1000 mg canxi/ngày.' }).ok === true, 'text hợp lệ')
  assert(validateImport('text', { ...empty(), text: 'a'.repeat(200_001) }).ok === false, 'text quá 200k ký tự → lỗi')
  assert(validateImport('url', { ...empty(), url: 'khong-phai-url' }).ok === false, 'url sai → lỗi')
  assert(validateImport('url', { ...empty(), url: 'ftp://example.com/x' }).ok === false, 'ftp → lỗi')
  assert(validateImport('url', { ...empty(), url: 'https://example.com/bai-viet' }).ok === true, 'url https hợp lệ')

  const noFile = validateImport('file', empty())
  assert(noFile.ok === false, 'thiếu file → lỗi')
  const big = new File([new Uint8Array(MAX_IMPORT_MB * 1024 * 1024 + 1)], 'lon.pdf')
  assert(validateImport('file', { ...empty(), file: big }).ok === false, `file > ${MAX_IMPORT_MB}MB → lỗi`)
  const badExt = new File(['x'], 'anh.jpg')
  assert(validateImport('file', { ...empty(), file: badExt }).ok === false, 'đuôi jpg → lỗi')
  const goodPdf = new File(['nội dung'], 'cam-nang.pdf')
  assert(validateImport('file', { ...empty(), file: goodPdf }).ok === true, 'file pdf hợp lệ')
  const goodTxt = new File(['nội dung'], 'ghi-chu.txt')
  assert(validateImport('file', { ...empty(), file: goodTxt }).ok === true, 'file txt hợp lệ')
  assert(ALLOWED_IMPORT_EXTS.includes('pdf') && ALLOWED_IMPORT_EXTS.includes('epub'), 'có pdf/epub trong danh sách đuôi')

  // ---- 2. buildImportPayload ----
  console.log('2. buildImportPayload — format request')
  const t = buildImportPayload('text', { ...empty(), text: '  Nội dung canxi  ' })
  assert('json' in t && (t.json as { text: string }).text === 'Nội dung canxi', 'text → JSON { text } (đã trim)')
  const u = buildImportPayload('url', { ...empty(), url: '  https://example.com  ' })
  assert('json' in u && (u.json as { url: string }).url === 'https://example.com', 'url → JSON { url } (đã trim)')
  const f = buildImportPayload('file', { ...empty(), file: goodPdf })
  assert('form' in f, 'file → FormData')
  if ('form' in f) {
    const got = f.form.get('file')
    assert(got instanceof File && got.name === 'cam-nang.pdf', 'FormData có field `file` đúng tên')
  }

  // ---- 3. payload JSON pass schema route (mirror) ----
  console.log('3. payload JSON pass schema route')
  for (const p of [t, u]) {
    if (!('json' in p)) continue
    const r = importJsonSchema.safeParse(p.json)
    assert(r.success, `payload ${'url' in (p.json as object) ? 'url' : 'text'} pass importJsonSchema (${r.success ? 'ok' : JSON.stringify(r.error.flatten())})`)
  }

  console.log('\n✅ import-ui.check OK — validate + format request khớp contract route')
}

main()
