import Link from 'next/link'
import { data } from '@/lib/data'
import { fmtDate } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { BirthRecordForm } from '@/components/birth-record-form'
import { ChildForm } from '@/components/child-form'
import { buttonClasses, Card, EmptyState } from '@mevabe/ui'
import type { Gender } from '@mevabe/domain'
import { SectionTabs, BE_TABS } from '@/components/section-tabs'

interface ChildRow {
  id: string
  name: string
  birth_date?: string | null
  sex?: Gender | null
}

const genderLabel = (g?: Gender | null) => (g === 'male' ? 'Bé trai' : g === 'female' ? 'Bé gái' : null)

export default async function BePage() {
  const birth = await data.getBirthRecord().catch(() => null)
  const children = await data.getChildren()

  return (
    <div className="space-y-6">
      <SectionTabs tabs={BE_TABS} />
      <PageHeader title="Bé yêu" description="Hồ sơ sau sinh: nhật ký bú, ngủ, tã, tăng trưởng và tiêm chủng." />

      <Card title="Hồ sơ sinh">
        {birth ? (
          <BirthRecordForm birth={birth} />
        ) : (
          <div className="space-y-3">
            <EmptyState title="Chưa có hồ sơ sinh" description="Khi bé chào đời, cập nhật thông tin sinh tại đây." />
            <BirthRecordForm birth={null} />
          </div>
        )}
      </Card>

      <Card title="Các bé">
        <ChildForm birthId={birth?.id} />
        {children.length ? (
          <ul className="divide-y divide-border">
            {children.map((c: ChildRow) => (
              <li key={c.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-fg">
                      {c.name}
                      {c.sex && <span className="ml-2 font-normal text-muted">{genderLabel(c.sex)}</span>}
                    </p>
                    {c.birth_date && <p className="text-xs text-muted">Sinh: {fmtDate(c.birth_date)}</p>}
                  </div>
                  <Link className={buttonClasses('secondary', 'sm')} href={`/be/${c.id}`}>
                    Mở →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có bé nào" description="Sau khi sinh, thêm hồ sơ bé để theo dõi nhật ký." />
        )}
      </Card>
    </div>
  )
}
export const dynamic = 'force-dynamic'
