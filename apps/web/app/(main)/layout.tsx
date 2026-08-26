import { AuthGuard } from '@/lib/auth/session-context'
import { AppShell } from '@/components/app-shell'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  )
}
