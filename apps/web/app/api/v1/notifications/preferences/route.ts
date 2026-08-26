import { data } from '@/lib/data'
import { apiOk } from '@/lib/api-utils'

// GET /api/v1/notifications/preferences — tùy chọn kênh thông báo (raw).
export async function GET(): Promise<Response> {
  return apiOk(await data.getNotificationPreferences())
}
