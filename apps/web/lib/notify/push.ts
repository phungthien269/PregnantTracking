// ===========================================================================
// push.ts — Web Push (R-notify): lưu subscription + gửi push thật qua web-push.
// - Cần VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY (+ VAPID_SUBJECT) trong env.
// - Thiếu cấu hình → pushConfigured() false → engine fallback in-app.
// - Supabase mode: bảng push_subscriptions qua client request (RLS theo user).
// - Local mode: bảng push_subscriptions (SQLite) theo active user.
// Server-only.
// ===========================================================================

import webpush from 'web-push'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getServerSupabase } from '@/lib/supabase-server'
import { getActiveUser } from '@/lib/auth/active-user'
import { findRow, insertRow, listRows, deleteRow } from '@/lib/db/local'

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:me@demo.vn'

export function pushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC && VAPID_PRIVATE)
}

export function getPublicKey(): string | null {
  return pushConfigured() ? VAPID_PUBLIC! : null
}

interface SubRow {
  id: string
  private_owner_id: string | null
  endpoint: string
  p256dh: string
  auth: string
}

/** Ctx user hiện tại cho 2 mode. */
async function ctx(): Promise<
  | { mode: 'supabase'; client: SupabaseClient; uid: string; familyId: string }
  | { mode: 'local'; uid: string; familyId: string }
  | null
> {
  if (isSupabaseConfigured()) {
    const client = await getServerSupabase()
    if (!client) return null
    const {
      data: { user },
    } = await client.auth.getUser()
    if (!user) return null
    const { data, error } = await client
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .limit(1)
    if (error) throw error
    const familyId = data?.[0]?.family_id as string | undefined
    if (!familyId) return null
    return { mode: 'supabase', client, uid: user.id, familyId }
  }
  const au = getActiveUser()
  if (!au) return null
  return { mode: 'local', uid: au.user_id, familyId: au.family_id }
}

/** Lưu subscription (upsert theo endpoint). Yêu cầu user đã đăng nhập. */
export async function saveSubscription(sub: { endpoint: string; p256dh: string; auth: string }): Promise<void> {
  const c = await ctx()
  if (!c) throw new Error('Cần đăng nhập để bật thông báo đẩy')
  const now = new Date().toISOString()
  if (c.mode === 'supabase') {
    const { error } = await c.client.from('push_subscriptions').upsert(
      {
        endpoint: sub.endpoint,
        private_owner_id: c.uid,
        family_id: c.familyId,
        p256dh: sub.p256dh,
        auth: sub.auth,
        updated_at: now,
      } as never,
      { onConflict: 'endpoint' },
    )
    if (error) throw error
    return
  }
  const existing = listRows<SubRow>('push_subscriptions', { where: { endpoint: sub.endpoint } })[0]
  if (existing) {
    deleteRow('push_subscriptions', existing.id)
  }
  insertRow('push_subscriptions', {
    id: crypto.randomUUID(),
    family_id: c.familyId,
    private_owner_id: c.uid,
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
    created_at: now,
    updated_at: now,
  })
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const c = await ctx()
  if (!c) return
  if (c.mode === 'supabase') {
    await c.client.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('private_owner_id', c.uid)
    return
  }
  const row = listRows<SubRow>('push_subscriptions', { where: { endpoint } }).find(
    (r) => r.private_owner_id === c.uid,
  )
  if (row) deleteRow('push_subscriptions', row.id)
}

/** Gửi push tới TẤT CẢ thiết bị của 1 user. Trả số gửi thành công + số huỷ (endpoint chết). */
export async function sendPushToUser(
  uid: string,
  payload: { title: string; body: string; url?: string },
): Promise<{ sent: number; removed: number }> {
  if (!pushConfigured()) return { sent: 0, removed: 0 }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC!, VAPID_PRIVATE!)
  let subs: SubRow[] = []
  if (isSupabaseConfigured()) {
    const client = await getServerSupabase()
    // Gửi từ engine: dùng service-safe path — subscriptions của user đọc bằng client request;
    // khi engine chạy ngoài request scope → fallback anon (RLS chặn → 0 subs).
    const c = client ?? (await import('@/lib/supabase')).supabase
    if (!c) return { sent: 0, removed: 0 }
    const { data, error } = await c.from('push_subscriptions').select('*').eq('private_owner_id', uid)
    if (error) throw error
    subs = (data ?? []) as SubRow[]
  } else {
    subs = listRows<SubRow>('push_subscriptions', { where: { private_owner_id: uid } })
  }

  let sent = 0
  let removed = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        )
        sent += 1
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          // Endpoint chết (uninstall/huỷ quyền) → dọn.
          if (isSupabaseConfigured()) {
            const c = await getServerSupabase()
            await c?.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
          } else {
            const found = findRow<SubRow>('push_subscriptions', s.id)
            if (found) deleteRow('push_subscriptions', s.id)
          }
          removed += 1
        }
        console.warn('[push] gửi lỗi:', (err as Error).message?.slice(0, 120))
      }
    }),
  )
  return { sent, removed }
}
