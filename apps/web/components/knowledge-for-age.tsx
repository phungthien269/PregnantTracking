import Link from 'next/link'
import { Badge, Card } from '@mevabe/ui'
import { allTopics, PHASE_LABELS } from '@/lib/knowledge'
import { babyPhase } from '@/lib/baby-age'

/** Gợi ý kiến thức theo độ tuổi bé: lọc allTopics theo giai đoạn (infant/toddler). */
export function KnowledgeForAge({ months }: { months: number }) {
  const phase = babyPhase(months)
  const topics = allTopics.filter((t) => t.phases.includes(phase))
  const over24 = months >= 24
  const description =
    `Giai đoạn ${PHASE_LABELS[phase]}` +
    (over24 ? ' — bé trên 24 tháng, kho kiến thức hiện tập trung giai đoạn 0–24 tháng' : '')

  return (
    <Card title="Kiến thức cho bé độ tuổi này" description={description}>
      <ul className="space-y-2">
        {topics.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/cam-nang/${t.slug}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-sm shadow-card transition-colors hover:bg-surface-muted"
            >
              <span aria-hidden="true">{t.emoji ?? '📄'}</span>
              <span className="flex-1 font-medium text-fg">{t.title}</span>
              {t.ageRange && <Badge tone="neutral">{t.ageRange}</Badge>}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
