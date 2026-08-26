import { PageHeader } from '@/components/page-header'
import { MorningBrief } from '@/components/morning-brief'
import { fmtDate, todayStr } from '@/lib/format'

export default function BanTinSangPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bản tin sáng"
        description={`Những điều mẹ cần biết hôm nay · ${fmtDate(todayStr())}`}
      />
      <MorningBrief />
    </div>
  )
}
export const dynamic = 'force-dynamic'
