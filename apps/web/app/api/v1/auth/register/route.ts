import { createClient } from '@supabase/supabase-js'
import { registerSchema } from '@/lib/auth/core'
import { apiOk, apiError } from '@/lib/api-utils'
import { isSupabaseConfigured } from '@/lib/supabase'

// ===========================================================================
// POST /api/v1/auth/register — tạo tài khoản + gia đình/tham gia qua mã mời.
//   - Supabase mode: admin.createUser (service-role) → signIn → mirror
//     profiles/families/family_members (service-role, RLS-ready). KHÔNG SQLite.
//   - Local: SQLite như cũ.
// ===========================================================================

const COOKIE_OPTS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === 'production',
}

function generateFamilyCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Dữ liệu đăng ký không hợp lệ', parsed.error.flatten())
  }
  const { email, password, name, inviteCode } = parsed.data
  const fullName = name ?? email

  // ---- Supabase mode ----
  if (isSupabaseConfigured()) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!service) return apiError('SERVER_MISCONFIGURED', 'Thiếu SUPABASE_SERVICE_ROLE_KEY cho đăng ký', undefined, 500)
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })

    // Email đã tồn tại?
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000, page: 1 })
    const existed = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (existed) return apiError('EMAIL_EXISTS', 'Email này đã được đăng ký')

    // Tạo user auth.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (createErr || !created.user) {
      const msg = createErr?.message ?? 'Không tạo được tài khoản'
      return apiError(msg.toLowerCase().includes('already') ? 'EMAIL_EXISTS' : 'REGISTER_FAILED', msg, undefined, 500)
    }
    const uid = created.user.id

    // Tìm gia đình theo mã mời (bỏ RLS — service role).
    let family: { id: string; name: string; code: string | null } | null = null
    let role: 'owner' | 'member' = 'owner'
    if (inviteCode?.trim()) {
      const code = inviteCode.trim().toUpperCase()
      const { data: fam } = await admin.from('families').select('id, name, code').eq('code', code).maybeSingle()
      if (!fam) return apiError('INVITE_INVALID', 'Mã mời không hợp lệ — kiểm tra lại với người tạo gia đình.')
      family = fam as { id: string; name: string; code: string | null }
      role = 'member'
    } else {
      const fid = crypto.randomUUID()
      const ins = await admin
        .from('families')
        .insert({ id: fid, name: `Gia đình của ${fullName}`, code: generateFamilyCode() })
      if (ins.error) return apiError('REGISTER_FAILED', ins.error.message, undefined, 500)
      family = { id: fid, name: `Gia đình của ${fullName}`, code: null }
    }

    // profiles + family_members.
    const now = new Date().toISOString()
    await admin.from('profiles').upsert(
      { id: uid, full_name: fullName, created_at: now, updated_at: now },
      { onConflict: 'id' },
    )
    const famCode = family.code
      ? family.code
      : (await admin.from('families').select('code').eq('id', family.id).maybeSingle()).data?.code ?? null
    await admin.from('family_members').upsert(
      {
        family_id: family.id,
        user_id: uid,
        role,
        joined_at: now,
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'family_id,user_id' },
    )

    // Đăng nhập (signIn) → session thật cho cookie sb_token.
    const anonClient = createClient(url, anon, { auth: { persistSession: false } })
    const { data: session, error: signInErr } = await anonClient.auth.signInWithPassword({ email, password })
    if (signInErr || !session.session) {
      return apiError('REGISTER_FAILED', 'Tạo tài khoản xong nhưng chưa đăng nhập được — thử đăng nhập lại.', undefined, 500)
    }

    const res = apiOk(
      {
        session: {
          token: session.session.access_token,
          user_id: uid,
          email,
          name: fullName,
          expiresAt: session.session.expires_at ? session.session.expires_at * 1000 : Date.now() + 3600_000,
        },
        family: {
          family_id: family.id,
          family_code: famCode,
          family_name: family.name,
          members: [{ user_id: uid, name: fullName, email, role }],
        },
      },
      201,
    )
    res.cookies.set('sb_token', session.session.access_token, COOKIE_OPTS)
    return res
  }

  // ---- Local mode (SQLite) — giữ nguyên luồng cũ ----
  const { dbCreateUser, dbCreateFamily, dbCreateMember, dbCreateSession, dbUserByEmail, dbFamilyById, dbMembersForFamily, dbUserById } = await import('@/lib/db/local')
  if (dbUserByEmail(email)) return apiError('EMAIL_EXISTS', 'Email này đã được đăng ký')
  let familyId: string
  let role: 'owner' | 'member'
  const invite = parsed.data.inviteCode?.trim()
  const { dbFamilyByCode } = await import('@/lib/db/local')
  if (invite) {
    const family = dbFamilyByCode(invite)
    if (!family) return apiError('INVITE_INVALID', 'Mã mời không hợp lệ — kiểm tra lại với người tạo gia đình.')
    familyId = family.id
    role = 'member'
  } else {
    const family = dbCreateFamily(`Gia đình của ${fullName}`)
    familyId = family.id
    role = 'owner'
  }
  const user = await dbCreateUser(email, password, name ?? null, familyId)
  dbCreateMember(familyId, user.id, role)
  const session = dbCreateSession(user.id)
  const family = dbFamilyById(user.family_id)
  const members = dbMembersForFamily(user.family_id).map((m) => {
    const u = dbUserById(m.user_id)
    return { user_id: m.user_id, name: u?.name ?? null, email: u?.email ?? '', role: m.role }
  })
  return apiOk(
    {
      session: {
        token: session.token,
        user_id: user.id,
        email: user.email,
        name: user.name,
        expiresAt: session.expires_at,
      },
      family: {
        family_id: user.family_id,
        family_code: family?.code ?? null,
        family_name: family?.name ?? null,
        members,
      },
    },
    201,
  )
}
