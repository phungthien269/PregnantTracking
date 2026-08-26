// ===========================================================================
// chat-store.ts — tầng lưu trữ hội thoại "Hỏi AI" (KHÔNG đụng DataApi/api.ts).
// - Supabase: ghi qua client server (cookie `sb_token`) + RLS; private_owner_id
//   = user đang đăng nhập → mỗi người chỉ thấy/tạo chat của mình. family_id lấy
//   từ family_members (cùng pattern lib/library/store.ts + lib/data/supabase.ts).
// - Mock (không env): in-memory theo user (demo, mất khi restart server) —
//   KHÔNG phá chạy demo cũ khi chưa nối backend.
//
// Module SERVER-ONLY (dùng next/headers) — KHÔNG import từ client bundle.
// Route/page gọi qua `chatStore` export bên dưới.
// ===========================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getServerSupabase } from '@/lib/supabase-server'
import { getActiveUser } from '@/lib/auth/active-user'
import { data } from '@/lib/data'
import type { AiMessage } from './client'

// ---------------------------------------------------------------------------
// Kiểu dữ liệu chung
// ---------------------------------------------------------------------------

/** Một nguồn tham khảo của tin nhắn — đã resolve tên hiển thị (title/source). */
export interface ChatSourceRef {
  id: string
  title: string
  source: string
}

export interface ChatSessionView {
  id: string
  title: string | null
  stage: string | null
  model: string | null
  status: 'active' | 'archived'
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface ChatMessageView {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  /** Đã resolve tên hiển thị cho UI (rỗng nếu không tìm được nguồn). */
  sources: ChatSourceRef[]
  created_at: string
}

/** Input ghi 1 tin nhắn. `sources` = uuid nguồn (đối chiếu cột `uuid[]`).
 * `created_at` (tuỳ chọn) — route truyền để giữ đúng thứ tự user → assistant. */
export interface AppendMessageInput {
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  created_at?: string
}

export interface ChatStore {
  /**
   * Tạo mới (chưa có sessionId) hoặc tiếp tục (đã có, thuộc user) một phiên chat.
   * Trả null khi không xác thực được user (supabase) — lúc đó không persist.
   */
  ensureSession(opts: {
    sessionId?: string | null
    title?: string | null
    stage?: string | null
    model?: string | null
  }): Promise<{ sessionId: string } | null>
  /** Ghi 1 tin nhắn vào session (no-op khi không xác thực). */
  appendMessage(input: AppendMessageInput): Promise<void>
  /** Danh sách phiên của user, mới nhất trước. */
  listSessions(): Promise<ChatSessionView[]>
  /** Tin nhắn của 1 phiên (đã resolve nguồn hiển thị), cũ trước. */
  listMessages(sessionId: string): Promise<ChatMessageView[]>
  /** Lịch sử gửi AI (role user/assistant), tối đa `limit` tin cuối. */
  getAiHistory(sessionId: string, limit?: number): Promise<AiMessage[]>
}

const now = (): string => new Date().toISOString()

// ---------------------------------------------------------------------------
// Resolve nguồn hiển thị: uuid → { id, title, source } từ bài viết/cẩm nang.
// ---------------------------------------------------------------------------

async function resolveSources(ids: string[]): Promise<ChatSourceRef[]> {
  if (ids.length === 0) return []
  const [articles, guides] = await Promise.all([
    data.getArticles().catch(() => []),
    data.getWeeklyGuides().catch(() => []),
  ])
  const map = new Map<string, ChatSourceRef>()
  for (const a of articles) map.set(a.id, { id: a.id, title: a.title, source: a.author ?? 'Bài viết Mẹ & Bé' })
  for (const g of guides) map.set(g.id, { id: g.id, title: g.title, source: `Cẩm nang tuần ${g.week}` })
  return ids.map((id) => map.get(id) ?? { id, title: 'Nguồn thư viện', source: '' })
}

// ---------------------------------------------------------------------------
// Supabase (server-side, cookie `sb_token`)
// ---------------------------------------------------------------------------

async function sbUser(): Promise<{ client: SupabaseClient; uid: string; familyId: string } | null> {
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
  return { client, uid: user.id, familyId }
}

async function ensureSessionSupabase(opts: {
  sessionId?: string | null
  title?: string | null
  stage?: string | null
  model?: string | null
}): Promise<{ sessionId: string } | null> {
  const ctx = await sbUser()
  if (!ctx) return null
  const { client, uid, familyId } = ctx

  // Đã có sessionId → kiểm tra thuộc user (RLS chặn; thêm filter chủ động) rồi tiếp tục.
  if (opts.sessionId) {
    const { data: existing, error: qErr } = await client
      .from('chat_sessions')
      .select('id')
      .eq('id', opts.sessionId)
      .eq('private_owner_id', uid)
      .maybeSingle()
    if (!qErr && existing) {
      await client.from('chat_sessions').update({ updated_at: now() }).eq('id', existing.id)
      return { sessionId: existing.id as string }
    }
  }

  const { data, error } = await client
    .from('chat_sessions')
    .insert({
      family_id: familyId,
      private_owner_id: uid,
      title: opts.title?.slice(0, 50) ?? null,
      stage: opts.stage ?? null,
      model: opts.model ?? null,
      status: 'active',
      pinned: false,
    } as never)
    .select('id')
    .single()
  if (error) throw error
  return { sessionId: (data as { id: string }).id }
}

async function appendMessageSupabase(input: AppendMessageInput): Promise<void> {
  const ctx = await sbUser()
  if (!ctx) return
  const { client, uid, familyId } = ctx
  const { error } = await client.from('chat_messages').insert({
    family_id: familyId,
    private_owner_id: uid,
    session_id: input.sessionId,
    role: input.role,
    content: input.content,
    sources: input.sources ?? [],
    created_at: input.created_at ?? now(),
  } as never)
  if (error) throw error
  await client.from('chat_sessions').update({ updated_at: now() }).eq('id', input.sessionId)
}

async function listSessionsSupabase(): Promise<ChatSessionView[]> {
  const ctx = await sbUser()
  if (!ctx) return []
  const { client, uid } = ctx
  const { data, error } = await client
    .from('chat_sessions')
    .select('*')
    .eq('private_owner_id', uid)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ChatSessionView[]
}

async function listMessagesSupabase(sessionId: string): Promise<ChatMessageView[]> {
  const ctx = await sbUser()
  if (!ctx) return []
  const { client, uid } = ctx
  const { data, error } = await client
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .eq('private_owner_id', uid)
    .order('created_at', { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as {
    id: string
    role: 'user' | 'assistant'
    content: string
    sources: string[]
    created_at: string
  }[]
  const allIds = [...new Set(rows.flatMap((r) => r.sources ?? []))]
  const refs = await resolveSources(allIds)
  const refMap = new Map(refs.map((r) => [r.id, r]))
  return rows.map((r) => ({
    id: r.id,
    session_id: sessionId,
    role: r.role,
    content: r.content,
    sources: (r.sources ?? []).map((id) => refMap.get(id) ?? { id, title: 'Nguồn thư viện', source: '' }),
    created_at: r.created_at,
  }))
}

async function getAiHistorySupabase(sessionId: string, limit = 10): Promise<AiMessage[]> {
  const ctx = await sbUser()
  if (!ctx) return []
  const { client, uid } = ctx
  const { data, error } = await client
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .eq('private_owner_id', uid)
    .order('created_at', { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as { role: 'user' | 'assistant'; content: string }[]
  return rows.slice(-limit).map((r) => ({ role: r.role, content: r.content }))
}

// ---------------------------------------------------------------------------
// Mock (in-memory theo user — demo, không cần backend)
// ---------------------------------------------------------------------------

interface MockMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  sourceIds: string[]
  created_at: string
}

const mockSessionsByUser = new Map<string, ChatSessionView[]>()
const mockMessagesBySession = new Map<string, MockMessage[]>()

function mockUserId(): string {
  return getActiveUser()?.user_id ?? 'demo'
}

function mockSessions(): ChatSessionView[] {
  const key = mockUserId()
  let arr = mockSessionsByUser.get(key)
  if (!arr) {
    arr = []
    mockSessionsByUser.set(key, arr)
  }
  return arr
}

async function ensureSessionMock(opts: {
  sessionId?: string | null
  title?: string | null
  stage?: string | null
  model?: string | null
}): Promise<{ sessionId: string } | null> {
  const sessions = mockSessions()
  if (opts.sessionId) {
    const existing = sessions.find((s) => s.id === opts.sessionId)
    if (existing) {
      existing.updated_at = now()
      return { sessionId: existing.id }
    }
  }
  const id = crypto.randomUUID()
  sessions.unshift({
    id,
    title: opts.title?.slice(0, 50) ?? null,
    stage: opts.stage ?? null,
    model: opts.model ?? null,
    status: 'active',
    pinned: false,
    created_at: now(),
    updated_at: now(),
  })
  mockMessagesBySession.set(id, [])
  return { sessionId: id }
}

async function appendMessageMock(input: AppendMessageInput): Promise<void> {
  const messages = mockMessagesBySession.get(input.sessionId) ?? []
  messages.push({
    id: crypto.randomUUID(),
    session_id: input.sessionId,
    role: input.role,
    content: input.content,
    sourceIds: input.sources ?? [],
    created_at: input.created_at ?? now(),
  })
  mockMessagesBySession.set(input.sessionId, messages)
  const s = mockSessions().find((x) => x.id === input.sessionId)
  if (s) s.updated_at = now()
}

async function listSessionsMock(): Promise<ChatSessionView[]> {
  return [...mockSessions()]
}

async function listMessagesMock(sessionId: string): Promise<ChatMessageView[]> {
  const messages = mockMessagesBySession.get(sessionId) ?? []
  const allIds = [...new Set(messages.flatMap((m) => m.sourceIds))]
  const refs = await resolveSources(allIds)
  const refMap = new Map(refs.map((r) => [r.id, r]))
  return messages.map((m) => ({
    id: m.id,
    session_id: m.session_id,
    role: m.role,
    content: m.content,
    sources: m.sourceIds.map((id) => refMap.get(id) ?? { id, title: 'Nguồn thư viện', source: '' }),
    created_at: m.created_at,
  }))
}

async function getAiHistoryMock(sessionId: string, limit = 10): Promise<AiMessage[]> {
  const messages = mockMessagesBySession.get(sessionId) ?? []
  return messages.slice(-limit).map((m) => ({ role: m.role, content: m.content }))
}

// ---------------------------------------------------------------------------
// Export — chọn implementation theo mode
// ---------------------------------------------------------------------------

export const chatStore: ChatStore = isSupabaseConfigured()
  ? {
      ensureSession: ensureSessionSupabase,
      appendMessage: appendMessageSupabase,
      listSessions: listSessionsSupabase,
      listMessages: listMessagesSupabase,
      getAiHistory: getAiHistorySupabase,
    }
  : {
      ensureSession: ensureSessionMock,
      appendMessage: appendMessageMock,
      listSessions: listSessionsMock,
      listMessages: listMessagesMock,
      getAiHistory: getAiHistoryMock,
    }
