import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError } from '@/lib/api-utils'

// GET /api/v1/chat?sessionId=<uuid> — tin nhắn của một phiên chat.
export async function GET(req: Request): Promise<Response> {
  const sessionId = new URL(req.url).searchParams.get('sessionId')
  const parsed = z.string().uuid().safeParse(sessionId)
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Thiếu/không hợp lệ tham số sessionId (uuid)')
  return apiOk(await data.getChatMessages(parsed.data))
}
