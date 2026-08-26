'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  authErrorMessage,
  getFamilyContext,
  getSession,
  loginUser,
  logout as authLogout,
  registerUser,
} from './index'
import type { AuthSession, AuthUser, LoginInput, RegisterInput } from './index'
import { setActiveUser } from './active-user'

interface Result {
  ok: boolean
  error?: string
}

interface RegisterResult extends Result {
  /** true khi đăng ký thành công nhưng chưa có session (supabase bật xác nhận email). */
  confirmEmail?: boolean
}

interface SessionContextValue {
  user: AuthUser | null
  session: AuthSession | null
  /** true khi đang đọc session lúc mount — tránh nhấp nháy redirect. */
  loading: boolean
  login: (input: LoginInput) => Promise<Result>
  register: (input: RegisterInput) => Promise<RegisterResult>
  logout: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getSession()
      .then((s) => {
        if (alive) setSession(s)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  // Cầu nối active user (Phase 4B): mỗi khi session đổi → cập nhật ngay ở
  // client (mutation mock chạy trong browser) + POST /api/v1/auth/sync để
  // data layer mock server-side lọc đúng quyền. Đăng xuất → xoá active user.
  useEffect(() => {
    let cancelled = false
    const sync = async () => {
      if (!session) {
        setActiveUser(null)
        if (!cancelled) {
          fetch('/api/v1/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: null }),
          }).catch(() => {})
        }
        return
      }
      const ctx = getFamilyContext(session.user_id)
      const payload = ctx ? { user_id: session.user_id, ...ctx } : { user_id: session.user_id }
      setActiveUser(ctx ? { user_id: session.user_id, ...ctx } : null)
      if (!cancelled) {
        fetch('/api/v1/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {})
      }
    }
    void sync()
    return () => {
      cancelled = true
    }
  }, [session])

  const login = useCallback(async (input: LoginInput): Promise<Result> => {
    try {
      const s = await loginUser(input)
      setSession(s)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: authErrorMessage(e) }
    }
  }, [])

  const register = useCallback(async (input: RegisterInput): Promise<RegisterResult> => {
    try {
      const s = await registerUser(input)
      if (!s) return { ok: true, confirmEmail: true }
      setSession(s)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: authErrorMessage(e) }
    }
  }, [])

  const logout = useCallback(async () => {
    await authLogout()
    setSession(null)
  }, [])

  const value = useMemo<SessionContextValue>(() => {
    const user: AuthUser | null = session
      ? { user_id: session.user_id, email: session.email, name: session.name }
      : null
    return { user, session, loading, login, register, logout }
  }, [session, loading, login, register, logout])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession phải dùng trong <SessionProvider>')
  return ctx
}

/**
 * Route guard cho (main): chưa login → redirect /dang-nhap.
 * Hiển thị trạng thái "đang kiểm tra" lúc mount để tránh nhấp nháy nội dung.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) router.replace('/dang-nhap')
  }, [loading, session, router])

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg" role="status">
        <p className="text-sm text-muted">Đang kiểm tra phiên…</p>
      </div>
    )
  }
  if (!session) return null
  return <>{children}</>
}
