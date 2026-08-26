// /cai-dat — server component: fetch data layer server-side, đưa `initial`
// (tuần/EDD/LMP) cho WeekPicker client. Các phần tương tác (theme, AI, export)
// nằm trong CaiDatClient.
import Link from 'next/link'
import { data } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { WeekPicker } from '@/components/WeekPicker'
import { buttonClasses, Card } from '@mevabe/ui'
import { CaiDatClient } from './cai-dat-client'

export default async function CaiDatPage() {
  const [preg, dash] = await Promise.all([
    data.getPregnancy().catch(() => null),
    data.getDashboard().catch(() => null),
  ])

  const initial =
    preg && dash && preg.lmp
      ? {
          week: dash.week,
          trimester: dash.trimester,
          dueDate: dash.dueDate,
          lmp: preg.lmp,
          edd: preg.edd,
        }
      : null

  return (
    <div className="space-y-6">
      <PageHeader title="Cài đặt" description="Giao diện, quyền riêng tư và trợ lý AI." />

      {initial ? (
        <WeekPicker initial={initial} />
      ) : (
        <Card title="Thông tin thai kỳ" description="Chưa có thai kỳ để chỉnh sửa.">
          <p className="text-sm text-muted">
            Mẹ hãy tạo hành trình thai kỳ trước, sau đó quay lại đây để sửa ngày đầu kỳ kinh
            cuối (LMP) và ngày dự sinh (EDD).
          </p>
          <div className="mt-3">
            <Link className={buttonClasses('secondary', 'sm')} href="/onboarding">
              Bắt đầu →
            </Link>
          </div>
        </Card>
      )}

      <CaiDatClient />
    </div>
  )
}
export const dynamic = 'force-dynamic'
