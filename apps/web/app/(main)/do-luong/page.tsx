import { data } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { MeasurementLog } from '@/components/measurement-log'
import { SectionTabs, THAI_KY_TABS } from '@/components/section-tabs'

export default async function DoLuongPage() {
  const measurements = await data.getMeasurements()
  return (
    <div className="space-y-6">
      <PageHeader title="Đo lường" description="Theo dõi cân nặng, huyết áp, đường huyết theo thời gian." />
      <SectionTabs tabs={THAI_KY_TABS} />
      <MeasurementLog measurements={measurements} />
    </div>
  )
}
export const dynamic = 'force-dynamic'
