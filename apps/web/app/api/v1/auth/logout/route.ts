import { apiOk } from '@/lib/api-utils'
import { dbDeleteSession } from '@/lib/db/local'

// POST /api/v1/auth/logout — xoá session server-side (best-effort).
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const token = (body as { token?: string } | null)?.token
  if (token) dbDeleteSession(token)
  return apiOk({ ok: true })
}
