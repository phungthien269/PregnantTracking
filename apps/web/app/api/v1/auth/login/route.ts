import { createClient } from '@supabase/supabase-js'
import { sha256Hex, loginSchema } from '@/lib/auth/core'
import { apiOk, apiError } from '@/lib/api-utils'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  ensureAuthSeed,
  dbUserByEmail,
  dbCreateSession,
  dbFamilyById,
  dbMembersForFamily,
  dbUserById,
  type DbUser,
} from '@/lib/db/local'

// ===========================================================================
// POST /api/v1/auth/login — verify user, tạo session mới.
//   - Supabase mode: signInWithPassword (auth.users) → JWT = sb_token cookie
//     (RLS auth.uid()). KHÔNG đụng SQLite (Vercel read-only FS sẽ 500).
//   - Local: SQLite như cũ (demo).
// ===========================================================================

const COOKIE_OPTS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === 'production',
}

function familyContext(user: DbUser) {
  const family = dbFamilyById(user.family_id)
  const members = dbMembersForFamily(user.family_id).map((m) => {
    const u = dbUserById(m.user_id)
    return { user_id: m.user_id, name: u?.name ?? null, email: u?.email ?? '', role: m.role }
  })
  return {
    family_id: user.family_id,
    family_code: family?.code ?? null,
    family_name: family?.name ?? null,
    members,
  }
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Dữ liệu đăng nhập không hợp lệ', parsed.error.flatten())
  }
  const { email, password } = parsed.data

  // ---- Supabase mode: Supabase Auth là nguồn sự thật ----
  if (isSupabaseConfigured()) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const client = createClient(url, anon, { auth: { persistSession: false } })
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error || !data.session) return apiError('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng')
    const u = data.user

    // Family context (family_members → families) qua client đã xác thực (RLS).
    const { data: fm } = await client
      .from('family_members')
      .select('family_id, role')
      .eq('user_id', u.id)
      .limit(1)
    const familyId = (fm?.[0]?.family_id as string | undefined) ?? null
    let family: {
      family_id: string | null
      family_code: string | null
      family_name: string | null
      members: { user_id: string; name: string | null; email: string; role: string }[]
    } = { family_id: null, family_code: null, family_name: null, members: [] }
    if (familyId) {
      const [{ data: fam }, { data: members }] = await Promise.all([
        client.from('families').select('name, code').eq('id', familyId).maybeSingle(),
        client.from('family_members').select('user_id, role').eq('family_id', familyId),
      ])
      const memberIds = (members ?? []).map((m) => m.user_id as string)
      const { data: profiles } = memberIds.length
        ? await client.from('profiles').select('id, full_name').in('id', memberIds)
        : { data: [] }
      const nameById = new Map((profiles ?? []).map((p) => [p.id as string, p.full_name as string | null]))
      family = {
        family_id: familyId,
        family_code: (fam?.code as string | null) ?? null,
        family_name: (fam?.name as string | null) ?? null,
        members: (members ?? []).map((m) => ({
          user_id: m.user_id as string,
          name: nameById.get(m.user_id as string) ?? null,
          email: '',
          role: m.role as string,
        })),
      }
    }

    const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 3600_000
    const res = apiOk({
      session: {
        token: data.session.access_token,
        user_id: u.id,
        email: u.email ?? email,
        name: (u.user_metadata?.full_name as string | undefined) ?? null,
        expiresAt,
      },
      family,
    })
    res.cookies.set('sb_token', data.session.access_token, COOKIE_OPTS)
    return res
  }

  // ---- Local mode (SQLite) ----
  await ensureAuthSeed()
  const user = dbUserByEmail(email)
  if (!user) return apiError('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng')
  const hash = await sha256Hex(user.salt + password)
  if (hash !== user.hash) return apiError('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng')
  const session = dbCreateSession(user.id)
  const res = apiOk({
    session: {
      token: session.token,
      user_id: user.id,
      email: user.email,
      name: user.name,
      expiresAt: session.expires_at,
    },
    family: familyContext(user),
  })
  return res
}
