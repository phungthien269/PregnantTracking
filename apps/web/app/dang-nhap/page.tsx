import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth-form'

export const metadata: Metadata = {
  title: 'Đăng nhập — Mẹ & Bé',
  description: 'Đăng nhập vào Mẹ & Bé để tiếp tục theo dõi thai kỳ.',
}

export default function LoginPage() {
  return <AuthForm mode="login" />
}
