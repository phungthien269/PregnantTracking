import { registerSchema } from '@/lib/auth/core'
import { apiOk, apiError } from '@/lib/api-utils'
import { bridgeSupabaseRegister, bridgeSupabaseFamilyBootstrap } from '@/lib/auth/supabase-bridge'
import {
  ensureAuthSeed,
  dbUserByEmail,
  dbCreateUser,
  dbCreateFamily,
  dbCreateMember,
  dbCreateSession,
  dbFamilyById,
  dbFamilyByCode,
  dbMembersForFamily,
  dbUserById,
  type DbUser,
} from '@/lib/db/local'

// ===========================================================================
// POST /api/v1/auth/register — đăng ký user vào SQLite (bền qua restart).
// - Không mã mời → TẠO gia đình mới (role owner).
// - Có mã mời hợp lệ → THAM GIA gia đình (role member); mã sai → INVITE_INVALID.
// Trả { session, family } — client lưu session vào localStorage.
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
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Dữ liệu đăng ký không hợp lệ', parsed.error.flatten())
  }
  await ensureAuthSeed()
  const { email, password, name, inviteCode } = parsed.data
  if (dbUserByEmail(email)) {
    return apiError('EMAIL_EXISTS', 'Email này đã được đăng ký')
  }
  const invite = inviteCode?.trim()
  let familyId: string
  let role: 'owner' | 'member'
  if (invite) {
    const family = dbFamilyByCode(invite)
    if (!family) return apiError('INVITE_INVALID', 'Mã mời không hợp lệ — kiểm tra lại với người tạo gia đình.')
    familyId = family.id
    role = 'member'
  } else {
    const family = dbCreateFamily(`Gia đình của ${name ?? email}`)
    familyId = family.id
    role = 'owner'
  }
  const user = await dbCreateUser(email, password, name ?? null, familyId)
  dbCreateMember(familyId, user.id, role)
  const session = dbCreateSession(user.id)
  const res = apiOk(
    {
      session: {
        token: session.token,
        user_id: user.id,
        email: user.email,
        name: user.name,
        expiresAt: session.expires_at,
      },
      family: familyContext(user),
    },
    201,
  )
  // Cầu Supabase: tạo user auth + cấp JWT + bootstrap hồ sơ/gia đình (RLS ready).
  const supabaseUserId = await bridgeSupabaseRegister(res, email, password, name ?? email)
  const fam = dbFamilyById(familyId)
  await bridgeSupabaseFamilyBootstrap({
    authUserId: supabaseUserId,
    email,
    familyId,
    familyCode: fam?.code ?? null,
    familyName: fam?.name ?? `Gia đình của ${name ?? email}`,
    role,
    fullName: name ?? email,
  })
  return res
}
