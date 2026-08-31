'use client'
import { useLang } from '@/lib/i18n'
import { LangToggle } from './lang-toggle'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from '@/lib/auth/session-context'
import { Button, Field, Input } from '@mevabe/ui'

/** Form đăng nhập / đăng ký dùng chung (ngoài (main), không bị route guard). */
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { t } = useLang()
  const isLogin = mode === 'login'
  const router = useRouter()
  const { session, login, register } = useSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Đã đăng nhập → vào dashboard luôn.
  useEffect(() => {
    if (session) router.replace('/dashboard')
  }, [session, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      const res = isLogin
        ? await login({ email, password })
        : await register({
            email,
            password,
            name: name || undefined,
            inviteCode: inviteCode.trim() || undefined,
          })
      if (res.ok) {
        if ('confirmEmail' in res && res.confirmEmail) {
          setNotice('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.')
        }
        // Không confirmEmail → session đã set → useEffect redirect sang /dashboard.
      } else {
        setError(res.error ?? 'Có lỗi xảy ra')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex justify-end">
          <LangToggle />
        </div>
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-semibold text-fg">🌸 Mẹ &amp; Bé</h1>
          <p className="mt-1 text-sm text-muted">
            {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
          </p>
        </div>

        <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <form onSubmit={submit} className="space-y-4" noValidate>
            {!isLogin && (
              <Field label={t('auth.name')} htmlFor="name">
                <Input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Minh Anh"
                />
              </Field>
            )}

            <Field label={t('auth.email')} htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@vidu.vn"
              />
            </Field>

            <Field label={t('auth.password')} htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? 'Mật khẩu của bạn' : 'Tối thiểu 6 ký tự'}
              />
            </Field>

            {!isLogin && (
              <Field label={t('auth.invite')} htmlFor="inviteCode">
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="VD: MEVABE"
                  autoCapitalize="characters"
                />
                <p className="mt-1 text-xs text-muted">
                  Để trống → tạo gia đình mới (bạn là chủ gia đình). Nhập mã → tham gia gia đình
                  đã có.
                </p>
              </Field>
            )}

            {error && (
              <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
                {notice}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? t('auth.processing') : isLogin ? t('auth.submit') : t('auth.submitRegister')}
            </Button>

            <p className="text-center text-sm text-muted">
              {isLogin ? (
                <>
                  Chưa có tài khoản?{' '}
                  <Link
                    href="/dang-ky"
                    className="font-medium text-primary-strong underline underline-offset-2"
                  >
                    Đăng ký ngay
                  </Link>
                </>
              ) : (
                <>
                  Đã có tài khoản?{' '}
                  <Link
                    href="/dang-nhap"
                    className="font-medium text-primary-strong underline underline-offset-2"
                  >
                    Đăng nhập
                  </Link>
                </>
              )}
            </p>
          </form>
        </section>

        {isLogin && (
          <div className="mt-4 rounded-md bg-surface-muted p-3 text-xs text-muted">
            <p className="font-medium text-fg">Tài khoản demo (cùng 1 gia đình)</p>
            <p className="mt-0.5">
              Mẹ: <code className="text-fg">me@demo.vn</code> · Mật khẩu:{' '}
              <code className="text-fg">demo1234</code>
            </p>
            <p className="mt-0.5">
              Bố: <code className="text-fg">bo@demo.vn</code> · Mật khẩu:{' '}
              <code className="text-fg">demo1234</code>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
