import { PageHeader } from '@/components/page-header'
import { SectionTabs, DINH_DUONG_TABS } from '@/components/section-tabs'
import { TheoDoiDinhDuongClient } from './theo-doi-client'

export default function TheoDoiDinhDuongPage() {
  return (
    <div className="space-y-6">
      <SectionTabs tabs={DINH_DUONG_TABS} />
      <PageHeader
        title="Theo dõi dinh dưỡng hằng ngày"
        description="Nhập bữa ăn và thực phẩm chức năng mỗi ngày — so nhu cầu vi chất theo tuần thai, xem món nào thiếu để bổ sung."
      />
      <TheoDoiDinhDuongClient />
    </div>
  )
}
