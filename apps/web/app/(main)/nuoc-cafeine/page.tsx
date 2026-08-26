import { data } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { WaterLog } from '@/components/water-log'
import { SectionTabs, THAI_KY_TABS, SUC_KHOE_TABS } from '@/components/section-tabs'

export default async function NuocCafeinePage() {
  const water = await data.getWaterCaffeine()
  return (
    <div className="space-y-6">
      <PageHeader title="Nước & caffeine" description="Theo dõi lượng nước và caffeine mỗi ngày, nhẹ nhàng không áp lực." />
      <SectionTabs tabs={THAI_KY_TABS} />
      <SectionTabs tabs={SUC_KHOE_TABS} />
      <WaterLog initial={water} />
    </div>
  )
}
export const dynamic = 'force-dynamic'
