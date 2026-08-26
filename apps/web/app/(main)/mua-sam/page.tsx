import { data } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { SectionTabs, GIA_DINH_TABS } from '@/components/section-tabs'
import { ShoppingBoard } from '@/components/shopping-board'

export default async function MuaSamPage() {
  const [items, budget] = await Promise.all([data.getShopping(), data.getBudget()])
  return (
    <div className="space-y-6">
      <PageHeader title="Mua sắm" description="Danh sách đồ dùng và ngân sách chuẩn bị đón bé." />
      <SectionTabs tabs={GIA_DINH_TABS} />
      <ShoppingBoard items={items} budget={budget} />
    </div>
  )
}
export const dynamic = 'force-dynamic'
