import { data } from '@/lib/data'
import { todayStr } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { MealLog } from '@/components/meal-log'
import { MealPhotoUpload } from '@/components/MealPhotoUpload'
import { SectionTabs, DINH_DUONG_TABS } from '@/components/section-tabs'

export default async function BoAnPage() {
  // R8/B3 (perf): nạp muộn MealToShopping — tách khỏi First Load JS.
  const { MealToShopping: LazyToShopping } = await import('@/components/meal-to-shopping')
  const dash = await data.getDashboard()
  const [meals, saved, focus] = await Promise.all([
    data.getMealsByDate(todayStr()),
    data.getSavedMeals(),
    data.getNutritionFocus(dash.week),
  ])
  return (
    <div className="space-y-6">
      <SectionTabs tabs={DINH_DUONG_TABS} />
      <PageHeader title="Bữa ăn" description="Nhật ký bữa ăn + gợi ý món theo tuần cho mẹ Việt." />
      <MealPhotoUpload />
      <MealLog meals={meals} saved={saved} focus={focus} />
      <LazyToShopping meals={saved} />
    </div>
  )
}
export const dynamic = 'force-dynamic'
