import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { SectionTabs, CAM_NANG_TABS } from '@/components/section-tabs'
import { Badge, buttonClasses, Card } from '@mevabe/ui'
import { allTopics, PHASE_LABELS, PHASE_ORDER } from '@/lib/knowledge'
import type { KnowledgeBlock } from '@/lib/knowledge'

function Block({ block }: { block: KnowledgeBlock }) {
  switch (block.kind) {
    case 'p':
      return <p className="text-sm leading-relaxed text-fg">{block.text}</p>
    case 'list':
      return (
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-fg">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'warn':
      return (
        <div className="rounded-md bg-warning/10 p-3">
          <p className="text-xs font-medium text-warning">Lưu ý</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{block.text}</p>
        </div>
      )
    case 'table':
      return (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {block.headers.map((h) => (
                  <th
                    key={h}
                    className="border-b border-border bg-surface-muted px-3 py-2 text-left text-xs font-semibold text-fg"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border-b border-border px-3 py-2 text-xs text-muted last:border-b-0">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'sources':
      return (
        <ul className="space-y-1.5 text-sm">
          {block.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary-strong underline underline-offset-2 hover:text-success"
              >
                {s.org} — {s.title}
              </a>
            </li>
          ))}
        </ul>
      )
  }
}

export function generateStaticParams() {
  return allTopics.map((t) => ({ slug: t.slug }))
}

export default async function CamNangDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const topic = allTopics.find((t) => t.slug === slug)
  if (!topic) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${topic.emoji ? `${topic.emoji} ` : ''}${topic.title}`}
        description={topic.summary}
        action={
          <Link href="/cam-nang" className={buttonClasses('secondary', 'sm')}>
            ← Cẩm nang
          </Link>
        }
      />
      <SectionTabs tabs={CAM_NANG_TABS} />

      <div className="flex flex-wrap items-center gap-1.5">
        {topic.ageRange && <Badge tone="neutral">{topic.ageRange}</Badge>}
        {PHASE_ORDER.filter((p) => topic.phases.includes(p)).map((p) => (
          <Badge key={p} tone="accent">
            {PHASE_LABELS[p]}
          </Badge>
        ))}
      </div>

      {topic.sections.map((section) => (
        <Card key={section.heading} title={section.heading}>
          <div className="space-y-3">
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>
        </Card>
      ))}

      {topic.bookSources && topic.bookSources.length > 0 && (
        <Card title="Tham khảo sách">
          <ul className="space-y-3">
            {topic.bookSources.map((b, i) => (
              <li key={i}>
                <p className="text-sm font-medium text-fg">{b.book}</p>
                {b.authors && <p className="mt-0.5 text-xs text-muted">{b.authors}</p>}
                {b.note && <p className="mt-0.5 text-xs leading-relaxed text-muted">{b.note}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="flex items-center gap-2 text-sm text-muted">
        <Badge tone="neutral">Lưu ý</Badge>
        Thông tin tham khảo từ nguồn y khoa — không thay thế tư vấn của bác sĩ.
      </p>
    </div>
  )
}
