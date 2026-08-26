'use client'

import { useRouter } from 'next/navigation'
import { WeekPicker } from '@mevabe/ui'

/** WeekPicker nối với router — client wrapper cho trang server. */
export function WeekNav({ week }: { week: number }) {
  const router = useRouter()
  return <WeekPicker week={week} onChange={(w) => router.push(`/tuan/${w}`)} />
}
