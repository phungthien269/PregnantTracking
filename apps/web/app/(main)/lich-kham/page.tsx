import { data } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { AppointmentManager } from '@/components/appointment-manager'
import { SectionTabs, THAI_KY_TABS } from '@/components/section-tabs'

export default async function LichKhamPage() {
  const appointments = await data.getAppointments()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch khám"
        description="Sắp xếp các buổi khám thai, siêu âm, xét nghiệm — ghi câu hỏi trước khám và kết quả, đơn thuốc sau mỗi buổi khám."
      />
      <SectionTabs tabs={THAI_KY_TABS} />
      <AppointmentManager initial={appointments} />
    </div>
  )
}
export const dynamic = 'force-dynamic'
