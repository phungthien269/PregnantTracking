import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { SectionTabs, CAM_NANG_TABS } from '@/components/section-tabs'
import { buttonClasses, Card } from '@mevabe/ui'
import { allTopics, PHASE_LABELS, PHASE_ORDER } from '@/lib/knowledge'

export default function CamNangPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Cẩm nang"
        description="Kho kiến thức thai kỳ và nuôi dạy con — dinh dưỡng, vận động, giấc ngủ, tâm lý — có nguồn tham khảo y khoa."
      />
      <SectionTabs tabs={CAM_NANG_TABS} />

      {PHASE_ORDER.map((phase) => {
        const topics = allTopics.filter((t) => t.phases.includes(phase))
        if (!topics.length) return null
        return (
          <section key={phase}>
            <h2 className="mb-3 text-sm font-semibold text-fg">{PHASE_LABELS[phase]}</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {topics.map((topic) => (
                <Card
                  key={topic.slug}
                  title={`${topic.emoji ? `${topic.emoji} ` : ''}${topic.title}`}
                  description={topic.ageRange}
                  action={
                    <Link href={`/cam-nang/${topic.slug}`} className={buttonClasses('secondary', 'sm')}>
                      Đọc →
                    </Link>
                  }
                >
                  <p className="text-sm leading-relaxed text-muted">{topic.summary}</p>
                </Card>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
