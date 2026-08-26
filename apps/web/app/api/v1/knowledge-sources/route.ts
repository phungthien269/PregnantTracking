import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError } from '@/lib/api-utils'
import { importSource, type ImportInput } from '@/lib/library/pipeline'
import type { ImportKind } from '@/lib/library/extract'

// GET /api/v1/knowledge-sources — thư viện của bạn (PDF/EPUB/URL đã import).
export async function GET(): Promise<Response> {
  return apiOk(await data.getKnowledgeSources())
}

// ---- Import: POST (multipart file PDF/EPUB, hoặc JSON { url } / { text }) ----

const importJsonSchema = z
  .object({
    url: z.string().url().max(2000).optional(),
    text: z.string().min(1).max(200_000).optional(),
    /** "Chỉ mình tôi" — mock lưu private_owner_id = active user. */
    private: z.boolean().optional(),
  })
  .refine((v) => v.url || v.text, { message: 'Cần url hoặc text' })

const importFormSchema = z.object({
  kind: z.enum(['pdf', 'epub']).optional(),
  url: z.string().url().max(2000).optional(),
  text: z.string().min(1).max(200_000).optional(),
  private: z.boolean().optional(),
})

function kindFromFilename(filename: string): ImportKind | null {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.epub')) return 'epub'
  if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.html')) return 'text'
  return null
}

export async function POST(req: Request): Promise<Response> {
  const ctype = req.headers.get('content-type') ?? ''
  const input: ImportInput = { kind: 'text' }

  try {
    if (ctype.includes('application/json')) {
      const parsed = importJsonSchema.safeParse(await req.json())
      if (!parsed.success) {
        return apiError('VALIDATION_ERROR', 'Dữ liệu gửi lên không hợp lệ', parsed.error.flatten())
      }
      input.kind = parsed.data.url ? 'url' : 'text'
      input.url = parsed.data.url
      input.text = parsed.data.text
      input.private = parsed.data.private
    } else if (ctype.includes('multipart/form-data')) {
      const form = await req.formData()
      const file = form.get('file')
      const raw: Record<string, string> = {}
      for (const [k, v] of form.entries()) if (typeof v === 'string') raw[k] = v
      const body = importFormSchema.safeParse(raw)
      if (!body.success) {
        return apiError('VALIDATION_ERROR', 'Dữ liệu gửi lên không hợp lệ', body.error.flatten())
      }
      if (file instanceof File) {
        if (file.size > 20 * 1024 * 1024) {
          return apiError('VALIDATION_ERROR', 'File quá lớn (tối đa 20 MB)')
        }
        const kind = body.data.kind ?? kindFromFilename(file.name)
        if (!kind) {
          return apiError('VALIDATION_ERROR', 'Định dạng file không hỗ trợ (chỉ PDF/EPUB/txt/md/html)')
        }
        const bytes = Buffer.from(await file.arrayBuffer())
        input.kind = kind
        input.filename = file.name
        if (kind === 'text') input.text = bytes.toString('utf8')
        else input.data = bytes
      } else if (body.data.url) {
        input.kind = 'url'
        input.url = body.data.url
      } else if (body.data.text) {
        input.kind = 'text'
        input.text = body.data.text
      } else {
        return apiError('VALIDATION_ERROR', 'Cần file, url hoặc text để import')
      }
      input.private = body.data.private
    } else {
      return apiError('VALIDATION_ERROR', 'Gửi file dạng multipart/form-data hoặc JSON')
    }

    const result = await importSource(input)
    return apiOk(result, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi import không xác định'
    const code = message.includes('không được phép') || message.includes('URL') || message.includes('không hợp lệ')
      ? 'VALIDATION_ERROR'
      : 'IMPORT_FAILED'
    return apiError(code, message, undefined, code === 'IMPORT_FAILED' ? 422 : 400)
  }
}
