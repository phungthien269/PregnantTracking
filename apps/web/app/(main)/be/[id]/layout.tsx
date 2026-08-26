import { notFound } from 'next/navigation'
import { data } from '@/lib/data'
import { ChildNav } from '@/components/child-nav'
import { SectionTabs, BE_TABS } from '@/components/section-tabs'

export default async function ChildLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const childrenList = await data.getChildren()
  const child = childrenList.find((c) => c.id === id)
  if (!child) notFound()

  return (
    <div>
      <SectionTabs tabs={BE_TABS} />
      <ChildNav childId={id} name={child.name} />
      {children}
    </div>
  )
}
