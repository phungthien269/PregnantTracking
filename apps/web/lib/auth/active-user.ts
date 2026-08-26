// ===========================================================================
// Active user bridge — mock mode (Phase 4B: gia đình 2 tài khoản).
//
// Auth mock lưu session ở localStorage (chỉ trình duyệt đọc được). Data layer
// mock chạy server-side (server components + route handlers) nên cần "cầu nối":
// client sync active user vào đây sau login/register/restore-session qua
// POST /api/v1/auth/sync (đặt server-side) + gọi setActiveUser trực tiếp
// (đặt client-side cho mutation chạy trong browser).
//
// Module này là plain TS, không localStorage / không server-only → chạy được
// ở cả browser lẫn node (self-check). Khi KHÔNG có active user → getters trả
// toàn bộ như cũ (tương thích ngược, 62 check smoke không vỡ).
// ===========================================================================

export interface ActiveMember {
  user_id: string
  name: string | null
  email: string
  role: 'owner' | 'member'
}

export interface ActiveUserContext {
  user_id: string
  family_id: string
  family_code: string | null
  members: ActiveMember[]
}

let active: ActiveUserContext | null = null

export function setActiveUser(ctx: ActiveUserContext | null): void {
  active = ctx
}

export function getActiveUser(): ActiveUserContext | null {
  return active
}
