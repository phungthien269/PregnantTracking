import { z } from 'zod'
import { setActiveUser } from '@/lib/auth/active-user'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getServerSupabase } from '@/lib/supabase-server'
import { apiOk, apiError } from '@/lib/api-utils'
import { ensureAuthSeed, dbUserById, dbFamilyById, dbMembersForFamily } from '@/lib/db/local'

// ===========================================================================
// POST /api/v1/auth/sync — cầu nối "active user" (data layer server-side).
//   - Supabase: tự suy user từ token (supabase.auth.getUser) + family_members.
//   - Local (SQLite): suy user + family context từ DB (KHÔNG tin body client).
// Khi không có active user → getters trả toàn bộ (tương thích ngược).
// ===========================================================================

const memberSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string(),
  role: z.enum(['owner', 'member']),
})

const syncSchema = z.object({
  user_id: z.string().uuid().nullable(),
  family_id: z.string().uuid().nullable().optional(),
  family_code: z.string().max(20).nullable().optional(),
  members: z.array(memberSchema).optional(),
})

export async function POST(req: Request): Promise<Response> {
  const raw = await req.json().catch(() => null)
  const parsed = syncSchema.safeParse(raw)
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Dữ liệu đồng bộ không hợp lệ')

  const body = parsed.data

  // Supabase: tự tin cậy session thật (token từ cookie, không tin client body).
  if (isSupabaseConfigured()) {
    const client = await getServerSupabase()
    if (!client) {
      setActiveUser(null)
      return apiOk({ activeUserId: null })
    }
    const {
      data: { user },
    } = await client.auth.getUser()
    if (user) {
      const { data: rows } = await client
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .limit(1)
      const familyId = (rows?.[0]?.family_id as string | undefined) ?? ''
      setActiveUser({ user_id: user.id, family_id: familyId, family_code: null, members: [] })
    } else {
      setActiveUser(null)
    }
    return apiOk({ activeUserId: user?.id ?? null })
  }

  // Local (SQLite): suy family context từ DB — bền qua restart, không tin body.
  if (!body.user_id) {
    setActiveUser(null)
    return apiOk({ activeUserId: null })
  }
  await ensureAuthSeed()
  const user = dbUserById(body.user_id)
  if (!user) {
    setActiveUser(null)
    return apiOk({ activeUserId: null })
  }
  const family = dbFamilyById(user.family_id)
  const members = dbMembersForFamily(user.family_id).map((m) => {
    const u = dbUserById(m.user_id)
    return { user_id: m.user_id, name: u?.name ?? null, email: u?.email ?? '', role: m.role }
  })
  setActiveUser({
    user_id: user.id,
    family_id: user.family_id,
    family_code: family?.code ?? null,
    members,
  })
  return apiOk({ activeUserId: user.id })
}
