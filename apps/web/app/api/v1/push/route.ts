import { z } from 'zod'
import { apiOk, apiError, parseBody } from '@/lib/api-utils'
import { getPublicKey, pushConfigured, saveSubscription, removeSubscription } from '@/lib/notify/push'

// ===========================================================================
// /api/v1/push — Web Push subscriptions.
//   GET    → public VAPID key (client dùng để subscribe)
//   POST   → lưu subscription của user hiện tại (Zod validate)
//   DELETE → huỷ 1 endpoint (unregister thiết bị)
// ===========================================================================

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

export async function GET(): Promise<Response> {
  return apiOk({ configured: pushConfigured(), publicKey: getPublicKey() })
}

export async function POST(req: Request): Promise<Response> {
  const parsed = parseBody(subscribeSchema, await req.json().catch(() => null))
  if (!parsed.ok) return parsed.error
  try {
    await saveSubscription({
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    })
    return apiOk({ ok: true })
  } catch (err) {
    return apiError('PUSH_SUBSCRIBE_FAILED', (err as Error).message, undefined, 500)
  }
}

export async function DELETE(req: Request): Promise<Response> {
  const parsed = parseBody(unsubscribeSchema, await req.json().catch(() => null))
  if (!parsed.ok) return parsed.error
  await removeSubscription(parsed.data.endpoint)
  return apiOk({ ok: true })
}
