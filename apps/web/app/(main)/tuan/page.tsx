import { redirect } from 'next/navigation'
import { data } from '@/lib/data'

export default async function TuanIndex() {
  const dash = await data.getDashboard()
  redirect(`/tuan/${dash.week}`)
}
export const dynamic = 'force-dynamic'
