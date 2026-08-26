import { data } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { SectionTabs, GIA_DINH_TABS } from '@/components/section-tabs'
import { TaskBoard } from '@/components/task-board'

export default async function CongViecPage() {
  const tasks = await data.getTasks()
  return (
    <div className="space-y-6">
      <PageHeader title="Công việc" description="Checklist chuẩn bị đón bé và chăm sóc cả nhà." />
      <SectionTabs tabs={GIA_DINH_TABS} />
      <TaskBoard tasks={tasks} />
    </div>
  )
}
export const dynamic = 'force-dynamic'
