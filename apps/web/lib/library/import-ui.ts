// ===========================================================================
// import-ui.ts — helper thuần cho UI import thư viện (không phụ thuộc React).
// Contract khớp route POST /api/v1/knowledge-sources:
//   - text/url → JSON { text } | { url }
//   - file     → multipart/form-data có field `file` (server tự suy kind từ filename)
// ===========================================================================

import type { KnowledgeStage } from '@mevabe/domain'

export const MAX_IMPORT_MB = 20

/** Đuôi file được phép — khớp kindFromFilename trong route knowledge-sources. */
export const ALLOWED_IMPORT_EXTS = ['pdf', 'epub', 'txt', 'md', 'html'] as const

export type ImportMode = 'text' | 'url' | 'file'

/** Nhãn tiếng Việt cho từng giai đoạn (thứ tự khớp KNOWLEDGE_STAGES). */
export const IMPORT_STAGE_LABELS: Record<KnowledgeStage, string> = {
  pregnancy: 'Thai kỳ',
  postpartum: 'Sau sinh',
  newborn: 'Trẻ sơ sinh',
  age_1_6m: 'Bé 1–6 tháng',
  age_6_12m: 'Bé 6–12 tháng',
  age_12_24m: 'Bé 12–24 tháng',
}

export interface ImportFormValues {
  text: string
  url: string
  file: File | null
}

function fileExt(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

/**
 * Validate client-side (mirror luật server): text ≤200k ký tự, url http/https,
 * file ≤20MB + đuôi cho phép. Trả lỗi tiếng Việt để hiện dưới form.
 */
export function validateImport(
  mode: ImportMode,
  values: ImportFormValues,
): { ok: true } | { ok: false; error: string } {
  if (mode === 'text') {
    const t = values.text.trim()
    if (!t) return { ok: false, error: 'Mẹ hãy dán nội dung cần import.' }
    if (t.length > 200_000) return { ok: false, error: 'Nội dung quá dài (tối đa 200.000 ký tự).' }
    return { ok: true }
  }
  if (mode === 'url') {
    const u = values.url.trim()
    if (!u) return { ok: false, error: 'Mẹ hãy nhập địa chỉ URL.' }
    try {
      if (!/^https?:$/.test(new URL(u).protocol)) return { ok: false, error: 'Chỉ hỗ trợ link http/https.' }
    } catch {
      return { ok: false, error: 'URL không hợp lệ — mẹ kiểm tra lại địa chỉ.' }
    }
    return { ok: true }
  }
  // mode === 'file'
  if (!values.file) return { ok: false, error: 'Mẹ hãy chọn file PDF/EPUB/txt để tải lên.' }
  if (values.file.size > MAX_IMPORT_MB * 1024 * 1024) {
    return { ok: false, error: `File quá lớn (tối đa ${MAX_IMPORT_MB} MB).` }
  }
  if (!(ALLOWED_IMPORT_EXTS as readonly string[]).includes(fileExt(values.file.name))) {
    return { ok: false, error: 'Định dạng không hỗ trợ — chỉ nhận PDF, EPUB, TXT, MD, HTML.' }
  }
  return { ok: true }
}

/**
 * Build payload gửi POST /api/v1/knowledge-sources:
 *   - text/url → JSON (server đọc qua importJsonSchema)
 *   - file     → FormData field `file` (server suy kind từ filename)
 */
export function buildImportPayload(
  mode: ImportMode,
  values: ImportFormValues,
): { json: unknown } | { form: FormData } {
  if (mode === 'text') return { json: { text: values.text.trim() } }
  if (mode === 'url') return { json: { url: values.url.trim() } }
  const form = new FormData()
  if (values.file) form.append('file', values.file)
  return { form }
}
