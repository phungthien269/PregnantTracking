import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth-form'

export const metadata: Metadata = {
  title: 'Đăng ký — Mẹ & Bé',
  description: 'Tạo tài khoản Mẹ & Bé để bắt đầu hành trình thai kỳ.',
}

export default function RegisterPage() {
  return <AuthForm mode="register" />
}
