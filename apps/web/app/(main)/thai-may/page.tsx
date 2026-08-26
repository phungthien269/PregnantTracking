import { data } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { FetalLog } from '@/components/fetal-log'
import { SectionTabs, THAI_KY_TABS, SUC_KHOE_TABS } from '@/components/section-tabs'

export default async function ThaiMayPage() {
  const logs = await data.getFetalMovementLogs()
  return (
    <div className="space-y-6">
      <PageHeader title="Thai máy" description="Theo dõi cảm nhận chuyển động của bé theo ngày." />
      <SectionTabs tabs={THAI_KY_TABS} />
      <SectionTabs tabs={SUC_KHOE_TABS} />
      <FetalLog logs={logs} />
    </div>
  )
}
export const dynamic = 'force-dynamic'
