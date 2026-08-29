import { data } from '@/lib/data'
import type { VisitDocument } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { SectionTabs, THAI_KY_TABS } from '@/components/section-tabs'

export default async function HoSoKhamPage() {
  // R8/B3 (perf): nạp muộn MedicalVisitLog — tách khỏi First Load JS.
  const { MedicalVisitLog: LazyVisits } = await import('@/components/medical-visit-log')
  const visits = await data.getMedicalVisits()
  const documentsByVisit: Record<string, VisitDocument[]> = {}
  await Promise.all(
    visits.map(async (v) => {
      documentsByVisit[v.id] = await data.getVisitDocuments(v.id)
    }),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ khám"
        description="Lưu lịch sử các lần đi khám theo thời gian — kèm ảnh giấy khám và nội dung đọc được từ ảnh."
      />
      <SectionTabs tabs={THAI_KY_TABS} />
      <LazyVisits visits={visits} documentsByVisit={documentsByVisit} />
    </div>
  )
}
export const dynamic = 'force-dynamic'
