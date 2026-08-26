// Self-check mock auth: register → login → session → logout → requireSession.
// Phase 4B: seed 2 tài khoản demo cùng gia đình + đăng ký có mã mời.
// Chạy: node --experimental-strip-types --no-warnings apps/web/lib/auth/index.check.ts
// Chỉ import ./core.ts (không có '@/...') nên chạy được bằng node thuần.
import assert from 'node:assert/strict'
import {
  registerUser,
  loginUser,
  getSession,
  logout,
  ensureSeed,
  AuthError,
  USERS_KEY,
  SESSION_KEY,
  FAMILIES_KEY,
  MEMBERS_KEY,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DAD_EMAIL,
  DEMO_FAMILY_ID,
  DEMO_FAMILY_CODE,
  DEMO_MOM_ID,
  DEMO_DAD_ID,
  getFamilyContext,
} from './core'

// Stub localStorage cho node (trong trình duyệt dùng window.localStorage thật).
const store = new Map<string, string>()
;(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
}

async function demo() {
  // Seed tài khoản demo → 1 gia đình + 2 thành viên (mẹ owner, bố member).
  await ensureSeed()
  assert.ok(store.has(USERS_KEY), 'seed tạo mevabe_users')
  assert.ok(store.has(FAMILIES_KEY), 'seed tạo mevabe_families')
  assert.ok(store.has(MEMBERS_KEY), 'seed tạo mevabe_family_members')
  const users = JSON.parse(store.get(USERS_KEY)!)
  assert.equal(users.length, 2, 'đúng 2 user demo (mẹ + bố)')
  assert.equal(users[0].email, DEMO_EMAIL, 'user đầu là mẹ demo')
  assert.equal(users[0].id, DEMO_MOM_ID, 'mẹ demo có id ổn định MOM_ID')
  assert.equal(users[1].email, DAD_EMAIL, 'user thứ 2 là bố demo')
  assert.equal(users[1].id, DEMO_DAD_ID, 'bố demo có id ổn định DAD_ID')
  const members = JSON.parse(store.get(MEMBERS_KEY)!)
  assert.equal(members.length, 2, 'đúng 2 thành viên trong gia đình demo')
  assert.equal(
    members.filter((m: { role: string }) => m.role === 'owner').length,
    1,
    'đúng 1 owner (mẹ)',
  )
  assert.equal(
    members.filter((m: { role: string }) => m.role === 'member').length,
    1,
    'đúng 1 member (bố)',
  )

  // getFamilyContext của mẹ → 2 thành viên + mã gia đình demo.
  const ctxMom = getFamilyContext(DEMO_MOM_ID)
  assert.ok(ctxMom, 'getFamilyContext trả context')
  assert.equal(ctxMom!.family_code, DEMO_FAMILY_CODE, 'mã gia đình demo')
  assert.equal(ctxMom!.members.length, 2, 'mẹ thấy 2 thành viên')
  assert.equal(ctxMom!.members[0]!.role, 'owner', 'mẹ là owner')

  // Login bằng mật khẩu sai → AuthError.
  await assert.rejects(
    loginUser({ email: DEMO_EMAIL, password: 'sai-sai' }),
    (e: unknown) => e instanceof AuthError && e.code === 'INVALID_CREDENTIALS',
    'mật khẩu sai bị chặn',
  )

  // Login demo đúng → session có user_id.
  const s1 = await loginUser({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
  assert.equal(s1.email, DEMO_EMAIL, 'login trả email đúng')
  assert.equal(s1.user_id, DEMO_MOM_ID, 'session có user_id ổn định')
  assert.equal(s1.token.length, 48, 'token hex 24 byte')
  assert.ok(store.has(SESSION_KEY), 'session được lưu localStorage')

  // getSession đọc lại được session còn hạn.
  const read = getSession()
  assert.equal(read?.email, DEMO_EMAIL, 'getSession trả session hợp lệ')
  assert.equal(read?.user_id, DEMO_MOM_ID, 'getSession có user_id')

  // Đăng ký email trùng → AuthError EMAIL_EXISTS.
  await assert.rejects(
    registerUser({ email: DEMO_EMAIL, password: 'whatever1' }),
    (e: unknown) => e instanceof AuthError && e.code === 'EMAIL_EXISTS',
    'email trùng bị chặn',
  )

  // Đăng ký email mới KHÔNG mã mời → TẠO gia đình mới, role owner, có mã gia đình.
  const s2 = await registerUser({ email: '  ME@test.vn ', password: 'mat-khau-1', name: 'Thu' })
  assert.equal(s2.email, 'me@test.vn', 'email được trim + lowercase')
  assert.equal(s2.name, 'Thu', 'lưu tên hiển thị')
  assert.equal(getSession()?.email, 'me@test.vn', 'register tự login')
  const ctxNew = getFamilyContext(s2.user_id)
  assert.ok(ctxNew && ctxNew.family_id !== DEMO_FAMILY_ID, 'không mã mời → gia đình mới khác demo')
  assert.ok(ctxNew!.family_code && ctxNew!.family_code.length >= 6, 'sinh mã gia đình 6+ ký tự')
  assert.equal(ctxNew!.members.length, 1, 'gia đình mới có 1 thành viên (owner)')
  assert.equal(ctxNew!.members[0]!.role, 'owner', 'người tạo là owner')

  // Đăng ký email mới CÓ mã mời demo → THAM GIA gia đình demo (role member).
  const s3 = await registerUser({
    email: 'bo-moi@test.vn',
    password: 'mat-khau-1',
    name: 'Bố mới',
    inviteCode: DEMO_FAMILY_CODE,
  })
  assert.equal(getSession()?.email, 'bo-moi@test.vn', 'register có mã mời tự login')
  const ctxJoined = getFamilyContext(s3.user_id)
  assert.ok(ctxJoined && ctxJoined.family_id === DEMO_FAMILY_ID, 'mã mời → cùng gia đình demo')
  assert.equal(ctxJoined!.family_code, DEMO_FAMILY_CODE, 'mã gia đình trùng demo')
  assert.ok(ctxJoined!.members.some((m) => m.email === DAD_EMAIL), 'thấy bố demo trong gia đình')
  const joinedRole = ctxJoined!.members.find((m) => m.user_id === s3.user_id)
  assert.equal(joinedRole?.role, 'member', 'người nhập mã mời là member')

  // Mã mời sai → AuthError INVITE_INVALID.
  await assert.rejects(
    registerUser({ email: 'loi@test.vn', password: 'mat-khau-1', inviteCode: 'SAI123' }),
    (e: unknown) => e instanceof AuthError && e.code === 'INVITE_INVALID',
    'mã mời sai bị chặn',
  )

  // Login email chưa đăng ký → INVALID_CREDENTIALS (không để lộ user tồn tại).
  await assert.rejects(
    loginUser({ email: 'chua-dang-ky@test.vn', password: 'mat-khau-1' }),
    (e: unknown) => e instanceof AuthError && e.code === 'INVALID_CREDENTIALS',
    'login email lạ bị chặn',
  )

  // Đăng ký mật khẩu quá ngắn → ZodError (registerSchema min 6).
  await assert.rejects(
    registerUser({ email: 'short@test.vn', password: '123' }),
    (e: unknown) => !(e instanceof AuthError) && (e as Error).name === 'ZodError',
    'zod chặn mật khẩu ngắn khi đăng ký',
  )

  // Logout → session hết.
  await logout()
  assert.equal(store.has(SESSION_KEY), false, 'logout xoá session')
  assert.equal(getSession(), null, 'getSession = null sau logout')

  console.log('✅ auth mock self-check PASS (2 user demo + gia đình + mã mời)')
}

demo().catch((e) => {
  console.error('❌ self-check FAIL:', e)
  process.exit(1)
})
