import { data } from '@/lib/data'
import { Badge, Card, EmptyState } from '@mevabe/ui'
import { PageHeader } from '@/components/page-header'
import { SectionTabs, CAM_NANG_TABS } from '@/components/section-tabs'
import { QuizRunner } from '@/components/quiz-runner'
import { LibrarySearch } from '@/components/LibrarySearch'
import type { DocumentStatus } from '@mevabe/domain'

const docStatusTone = (s?: DocumentStatus | null) =>
  s === 'ready' ? ('success' as const) : s === 'failed' ? ('danger' as const) : s === 'processing' ? ('warning' as const) : ('neutral' as const)

export default async function ThuVienPage() {
  // R8/B3 (perf): nạp muộn LibraryImport — tách khỏi First Load JS.
  const { LibraryImport: LazyImport } = await import('@/components/LibraryImport')
  const [documents, quizSets] = await Promise.all([data.getDocuments(), data.getQuizSets()])
  const quizzes = await Promise.all(
    quizSets.map(async (s) => ({ set: s, questions: await data.getQuizQuestions(s.id).catch(() => []) })),
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Thư viện của mẹ" description="Tài liệu đã import và các bộ quiz ôn kiến thức." />
      <SectionTabs tabs={CAM_NANG_TABS} />

      <LazyImport />

      <LibrarySearch />

      <Card title="Tài liệu đã import">
        {documents.length ? (
          <ul className="divide-y divide-border">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <p className="text-fg">{d.title}</p>
                  {d.notes && <p className="text-xs text-muted">{d.notes}</p>}
                </div>
                <Badge tone={docStatusTone(d.status)}>{d.status}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có tài liệu" description="Import bài viết, PDF hoặc link để xây thư viện riêng." />
        )}
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-fg">Quiz ôn kiến thức</h2>
        {quizzes.length ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {quizzes.map(({ set, questions }) => (
              <QuizRunner key={set.id} setTitle={set.title} questions={questions} />
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có bộ quiz" description="Chọn bộ quiz để làm trắc nghiệm và ôn câu sai." />
        )}
      </div>
    </div>
  )
}
export const dynamic = 'force-dynamic'
