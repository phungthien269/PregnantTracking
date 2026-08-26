// ===========================================================================
// Auth core — mock store (localStorage) + hash + Zod schemas.
// KHÔNG import '@/lib/supabase' để chạy được self-check bằng node thuần.
// Seam supabase ở ./supabase.ts; chọn backend ở ./index.ts.
//
// Giới hạn mock (ghi rõ cho agent kế): auth chỉ quản lý user/session. Dữ liệu
// demo vẫn là 1 family chung (lib/data/mock.ts) — per-user thật làm bằng
// Supabase RLS (family_members) khi nối backend.
// ===========================================================================

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AuthUser {
  user_id: string
  email: string
  name: string | null
}

export interface AuthSession {
  token: string
  user_id: string
  email: string
  name: string | null
  expiresAt: number
}

export interface RegisterInput {
  email: string
  password: string
  name?: string
  /** Mã mời gia đình (không bắt buộc) — có → THAM GIA gia đình; không → TẠO gia đình mới. */
  inviteCode?: string
}

export interface LoginInput {
  email: string
  password: string
}

// ---------------------------------------------------------------------------
// Zod — mọi input biên giới đều validate (tiếng Việt)
// ---------------------------------------------------------------------------
const emailSchema = z.string().trim().toLowerCase().email('Email không hợp lệ')
const passwordSchema = z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự')
const nameSchema = z
  .string()
  .trim()
  .min(2, 'Tên tối thiểu 2 ký tự')
  .max(60, 'Tên tối đa 60 ký tự')

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional(),
  inviteCode: z.string().trim().max(10, 'Mã mời tối đa 10 ký tự').optional(),
})
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

// ---------------------------------------------------------------------------
// Lỗi nghiệp vụ — message tiếng Việt
// ---------------------------------------------------------------------------
export const AUTH_MESSAGES = {
  EMAIL_EXISTS: 'Email này đã được đăng ký',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  INVITE_INVALID: 'Mã mời không hợp lệ — kiểm tra lại với người tạo gia đình.',
  SIGNUP_CONFIRM: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.',
  UNKNOWN: 'Có lỗi xảy ra, vui lòng thử lại.',
} as const

export class AuthError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

/** Chuyển lỗi bất kỳ (Zod/AuthError/…) thành message tiếng Việt. */
export function authErrorMessage(e: unknown): string {
  if (e instanceof AuthError) return e.message
  if (e instanceof z.ZodError) return e.issues[0]?.message ?? AUTH_MESSAGES.UNKNOWN
  return AUTH_MESSAGES.UNKNOWN
}

// ---------------------------------------------------------------------------
// Web Crypto — SHA-256 (không dùng lib)
// ---------------------------------------------------------------------------
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------------------------
// Mock store — localStorage: mevabe_users + mevabe_session + mevabe_families
// + mevabe_family_members. Auth mock chỉ chạy browser (localStorage); data
// layer mock chạy server-side — cầu nối active user ở lib/auth/active-user.ts.
// ---------------------------------------------------------------------------
export const USERS_KEY = 'mevabe_users'
export const SESSION_KEY = 'mevabe_session'
export const FAMILIES_KEY = 'mevabe_families'
export const MEMBERS_KEY = 'mevabe_family_members'
const SEED_VERSION_KEY = 'mevabe_seed_v'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 ngày

export const DEMO_EMAIL = 'me@demo.vn'
export const DEMO_PASSWORD = 'demo1234'
export const DAD_EMAIL = 'bo@demo.vn'
/** Mã gia đình demo (bố nhập mã này để vào cùng gia đình mẹ). */
export const DEMO_FAMILY_CODE = 'MEVABE'
export const DEMO_FAMILY_ID = '10000000-0000-0000-0000-000000000001'
export const DEMO_MOM_ID = '10000000-0000-0000-0000-000000000002'
export const DEMO_DAD_ID = '10000000-0000-0000-0000-000000000003'

/** Vai trò trong gia đình (khớp @mevabe/domain familyRoleSchema). */
export type FamilyRole = 'owner' | 'member'

interface StoredUser {
  id: string
  email: string
  name: string | null
  salt: string
  hash: string
  createdAt: string
  family_id: string
}

interface MockFamily {
  id: string
  name: string
  code: string
  created_at: string
}

interface MockMember {
  id: string
  family_id: string
  user_id: string
  role: FamilyRole
  created_at: string
}

function ls(): Storage | null {
  // Dùng globalThis thay window để self-check (node) có thể gắn stub localStorage.
  return (globalThis as { localStorage?: Storage }).localStorage ?? null
}

function readUsers(): StoredUser[] {
  try {
    const raw = ls()?.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]): void {
  ls()?.setItem(USERS_KEY, JSON.stringify(users))
}

function readFamilies(): MockFamily[] {
  try {
    const raw = ls()?.getItem(FAMILIES_KEY)
    return raw ? (JSON.parse(raw) as MockFamily[]) : []
  } catch {
    return []
  }
}

function writeFamilies(families: MockFamily[]): void {
  ls()?.setItem(FAMILIES_KEY, JSON.stringify(families))
}

function readMembers(): MockMember[] {
  try {
    const raw = ls()?.getItem(MEMBERS_KEY)
    return raw ? (JSON.parse(raw) as MockMember[]) : []
  } catch {
    return []
  }
}

function writeMembers(members: MockMember[]): void {
  ls()?.setItem(MEMBERS_KEY, JSON.stringify(members))
}

function readSession(): AuthSession | null {
  try {
    const raw = ls()?.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

function writeSession(s: AuthSession): void {
  ls()?.setItem(SESSION_KEY, JSON.stringify(s))
}

function clearSession(): void {
  ls()?.removeItem(SESSION_KEY)
}

/** Sinh mã gia đình 6 ký tự — bảng chữ không nhập nhằng (bỏ 0/O, 1/I). */
export function generateFamilyCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

function findFamilyByCode(code: string): MockFamily | null {
  const c = code.trim().toUpperCase()
  return readFamilies().find((f) => f.code.toUpperCase() === c) ?? null
}

const familyMemberId = (): string => randomHex(16)

/**
 * Seed demo (idempotent, chạy lại an toàn): 1 gia đình + 2 tài khoản demo
 * trong CÙNG gia đình — mẹ (owner, MOM_ID) + bố (member, DAD_ID). Mã gia đình
 * cố định `MEVABE` để kiểm thử mời thành viên dễ dàng. Không xoá user khác.
 */
export async function ensureSeed(): Promise<void> {
  const users = readUsers()
  const families = readFamilies()
  const members = readMembers()

  if (!families.some((f) => f.id === DEMO_FAMILY_ID)) {
    families.push({
      id: DEMO_FAMILY_ID,
      name: 'Gia đình Mẹ & Bé',
      code: DEMO_FAMILY_CODE,
      created_at: new Date().toISOString(),
    })
  }

  const ensureUser = async (
    id: string,
    email: string,
    name: string,
    password: string,
    role: FamilyRole,
  ): Promise<void> => {
    let user = users.find((u) => u.email === email)
    if (!user) {
      const salt = randomHex(16)
      const hash = await sha256Hex(salt + password)
      user = { id, email, name, salt, hash, createdAt: new Date().toISOString(), family_id: DEMO_FAMILY_ID }
      users.push(user)
    } else {
      // Upgrade user cũ (seed v1 chưa có id/family_id) → gán id + family ổn định.
      user.id = user.id || id
      user.family_id = user.family_id || DEMO_FAMILY_ID
      if (!user.name) user.name = name
    }
    if (!members.some((m) => m.user_id === user!.id && m.family_id === DEMO_FAMILY_ID)) {
      members.push({
        id: familyMemberId(),
        family_id: DEMO_FAMILY_ID,
        user_id: user!.id,
        role,
        created_at: new Date().toISOString(),
      })
    }
  }

  await ensureUser(DEMO_MOM_ID, DEMO_EMAIL, 'Mẹ demo', DEMO_PASSWORD, 'owner')
  await ensureUser(DEMO_DAD_ID, DAD_EMAIL, 'Bố demo', DEMO_PASSWORD, 'member')

  writeUsers(users)
  writeFamilies(families)
  writeMembers(members)
  ls()?.setItem(SEED_VERSION_KEY, '2')
}

// ---------------------------------------------------------------------------
// Mock API
// ---------------------------------------------------------------------------
function createSession(user: StoredUser): AuthSession {
  const session: AuthSession = {
    token: randomHex(24),
    user_id: user.id,
    email: user.email,
    name: user.name,
    expiresAt: Date.now() + SESSION_TTL_MS,
  }
  writeSession(session)
  return session
}

export async function registerUser(input: RegisterInput): Promise<AuthSession> {
  const parsed = registerSchema.parse(input)
  await ensureSeed()
  const users = readUsers()
  if (users.some((u) => u.email === parsed.email)) {
    throw new AuthError('EMAIL_EXISTS', AUTH_MESSAGES.EMAIL_EXISTS)
  }

  // Mã mời hợp lệ → THAM GIA gia đình (role member); ngược lại TẠO gia đình mới (role owner).
  const families = readFamilies()
  const members = readMembers()
  const invite = parsed.inviteCode?.trim()
  const joinedFamily = invite ? findFamilyByCode(invite) : null
  if (invite && !joinedFamily) {
    throw new AuthError('INVITE_INVALID', AUTH_MESSAGES.INVITE_INVALID)
  }

  const salt = randomHex(16)
  const hash = await sha256Hex(salt + parsed.password)
  const userId = crypto.randomUUID()
  let familyId: string
  if (joinedFamily) {
    familyId = joinedFamily.id
    members.push({
      id: familyMemberId(),
      family_id: familyId,
      user_id: userId,
      role: 'member',
      created_at: new Date().toISOString(),
    })
  } else {
    familyId = crypto.randomUUID()
    families.push({
      id: familyId,
      name: `Gia đình của ${parsed.name ?? parsed.email}`,
      code: generateFamilyCode(),
      created_at: new Date().toISOString(),
    })
    members.push({
      id: familyMemberId(),
      family_id: familyId,
      user_id: userId,
      role: 'owner',
      created_at: new Date().toISOString(),
    })
  }

  const user: StoredUser = {
    id: userId,
    email: parsed.email,
    name: parsed.name ?? null,
    salt,
    hash,
    createdAt: new Date().toISOString(),
    family_id: familyId,
  }
  writeUsers([...users, user])
  writeFamilies(families)
  writeMembers(members)
  return createSession(user)
}

export async function loginUser(input: LoginInput): Promise<AuthSession> {
  const parsed = loginSchema.parse(input)
  await ensureSeed()
  const user = readUsers().find((u) => u.email === parsed.email)
  if (!user) throw new AuthError('INVALID_CREDENTIALS', AUTH_MESSAGES.INVALID_CREDENTIALS)
  const hash = await sha256Hex(user.salt + parsed.password)
  if (hash !== user.hash) throw new AuthError('INVALID_CREDENTIALS', AUTH_MESSAGES.INVALID_CREDENTIALS)
  return createSession(user)
}

export function getSession(): AuthSession | null {
  const s = readSession()
  if (!s) return null
  if (Date.now() > s.expiresAt) {
    clearSession()
    return null
  }
  return s
}

export function logout(): void {
  clearSession()
}

// ---------------------------------------------------------------------------
// Family context (browser) — client sync lên server qua POST /api/v1/auth/sync
// ---------------------------------------------------------------------------

export interface FamilyContextMember {
  user_id: string
  name: string | null
  email: string
  role: FamilyRole
}

export interface FamilyContext {
  family_id: string
  family_code: string | null
  members: FamilyContextMember[]
}

/**
 * Ghi state auth vào localStorage (users/families/members) sau khi login/register
 * qua server (SQLite — Phase 5). Giữ `getFamilyContext` (client) hoạt động như cũ:
 * salt/hash đánh dấu "server" (không dùng để verify trong local mode — verify qua API).
 */
export function persistLocalAuthState(params: {
  user_id: string
  email: string
  name: string | null
  family_id: string
  family_name: string | null
  family_code: string | null
  members: { user_id: string; name: string | null; email: string; role: FamilyRole }[]
}): void {
  const users = readUsers()
  const families = readFamilies()
  const members = readMembers()
  const storedUser: StoredUser = {
    id: params.user_id,
    email: params.email,
    name: params.name,
    salt: 'server',
    hash: 'server',
    createdAt: new Date().toISOString(),
    family_id: params.family_id,
  }
  const userIdx = users.findIndex((u) => u.id === params.user_id)
  if (userIdx >= 0) users[userIdx] = storedUser
  else users.push(storedUser)
  if (!families.some((f) => f.id === params.family_id)) {
    families.push({
      id: params.family_id,
      name: params.family_name ?? 'Gia đình',
      code: params.family_code ?? '',
      created_at: new Date().toISOString(),
    })
  }
  for (const m of params.members) {
    if (!members.some((x) => x.user_id === m.user_id && x.family_id === params.family_id)) {
      members.push({
        id: `${params.family_id}::${m.user_id}`,
        family_id: params.family_id,
        user_id: m.user_id,
        role: m.role,
        created_at: new Date().toISOString(),
      })
    }
  }
  writeUsers(users)
  writeFamilies(families)
  writeMembers(members)
}

/** Bối cảnh gia đình của user (đọc localStorage) — null nếu không tìm thấy. */
export function getFamilyContext(userId: string): FamilyContext | null {
  const users = readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) return null
  const family = readFamilies().find((f) => f.id === user.family_id)
  const members = readMembers()
    .filter((m) => m.family_id === user.family_id)
    .map((m) => {
      const mu = users.find((u) => u.id === m.user_id)
      return { user_id: m.user_id, name: mu?.name ?? null, email: mu?.email ?? '', role: m.role }
    })
  return { family_id: user.family_id, family_code: family?.code ?? null, members }
}
