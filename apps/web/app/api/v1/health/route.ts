import { apiOk } from '@/lib/api-utils'
import { dataMode } from '@/lib/data'

// ===========================================================================
// GET /api/v1/health — health check cho monitoring/uptime (Vercel, UptimeRobot…).
// Không lộ thông tin nhạy cảm: chỉ mode + thời điểm.
// ===========================================================================

export async function GET(): Promise<Response> {
  return apiOk({
    status: 'ok',
    mode: dataMode,
    time: new Date().toISOString(),
  })
}
