import { z } from 'zod'
import { notificationGroupSchema, notificationChannelSchema } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'
import { runDueNotifications } from '@/lib/inngest/engine'
import { notifyClient } from '@/lib/inngest/client'

// POST — bật/tắt kênh nhận thông báo cho một nhóm (Zod validate input).
const setPrefSchema = z.object({
  group: notificationGroupSchema,
  channel: notificationChannelSchema,
  enabled: z.boolean(),
})

// GET /api/v1/notifications — thông báo đến hạn hôm nay (HCM) + hộp thư in-app.
// Không cần INGEST_KEY/INGEST_URL: thiếu key → fallback in-app, route vẫn đầy đủ.
export async function GET(): Promise<Response> {
  const notifications = await runDueNotifications()
  return apiOk({ notifications, inbox: notifyClient.inbox() })
}

// POST /api/v1/notifications — thay đổi notification_preferences.
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(setPrefSchema, body)
  if (!parsed.ok) return parsed.error
  await data.setNotificationPreference(parsed.data)
  return apiOk({ ok: true })
}
