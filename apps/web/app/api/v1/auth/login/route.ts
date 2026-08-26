import { sha256Hex, loginSchema } from '@/lib/auth/core'
import { apiOk, apiError } from '@/lib/api-utils'
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
// POST /api/v1/auth/login — verify user trong SQLite, tạo session mới.
// ===========================================================================

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
  await ensureAuthSeed()
  const user = dbUserByEmail(parsed.data.email)
  if (!user) return apiError('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng')
  const hash = await sha256Hex(user.salt + parsed.data.password)
  if (hash !== user.hash) return apiError('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng')
  const session = dbCreateSession(user.id)
  return apiOk({
    session: {
      token: session.token,
      user_id: user.id,
      email: user.email,
      name: user.name,
      expiresAt: session.expires_at,
    },
    family: familyContext(user),
  })
}
