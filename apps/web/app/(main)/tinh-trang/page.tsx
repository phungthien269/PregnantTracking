import { data } from '@/lib/data'
import TinhTrangClient from '@/components/tinh-trang-client'

export const dynamic = 'force-dynamic'

/**
 * /tinh-trang — R8 (perf): server fetch 3 nguồn dữ liệu ban đầu (trước đây client
 * tự gọi 3 API rồi mới render) → đảo client nhận props, giữ toàn bộ tương tác.
 */
export default async function TinhTrangPage() {
  const [profile, reminders, measurements] = await Promise.all([
    data.getNutritionProfile().catch(() => null),
    data.getReminders().catch(() => []),
    data.getMeasurements().catch(() => []),
  ])

  return (
    <TinhTrangClient
      conditions={profile?.conditions ?? []}
      doctorNotes={profile?.doctor_instructions ?? ''}
      reminders={reminders}
      measurements={measurements}
    />
  )
}
