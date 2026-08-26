import { NextResponse } from 'next/server'
import type { z, ZodType } from 'zod'
import { idSchema } from '@mevabe/domain'

// ===========================================================================
// Helper API /api/v1 — envelope { data } | { error: { code, message, details } }.
// ===========================================================================

export function apiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status })
}

export function apiError(
  code: string,
  message: string,
  details?: unknown,
  status = 400,
): NextResponse {
  return NextResponse.json({ error: { code, message, details } }, { status })
}

/** Validate body bằng Zod; lỗi → trả NextResponse 400 kèm details. */
export function parseBody<T extends ZodType>(
  schema: T,
  body: unknown,
): { ok: true; data: z.infer<T> } | { ok: false; error: NextResponse } {
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return {
      ok: false,
      error: apiError(
        'VALIDATION_ERROR',
        'Dữ liệu gửi lên không hợp lệ',
        parsed.error.flatten(),
        400,
      ),
    }
  }
  return { ok: true, data: parsed.data }
}

/** Validate path param `[id]` là UUID; lỗi → trả error NextResponse. */
export async function parsePathId(
  params: Promise<{ id: string }>,
): Promise<{ id: string; error?: never } | { id?: never; error: NextResponse }> {
  const { id } = await params
  const parsed = idSchema.safeParse(id)
  return parsed.success
    ? { id }
    : { error: apiError('VALIDATION_ERROR', 'ID không hợp lệ', parsed.error.flatten()) }
}
