import { data } from '@/lib/data'
import { todayStr } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { MealLog } from '@/components/meal-log'
import { MealPhotoUpload } from '@/components/MealPhotoUpload'
import { MealToShopping } from '@/components/meal-to-shopping'
import { SectionTabs, DINH_DUONG_TABS } from '@/components/section-tabs'

export default async function BoAnPage() {
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
      <MealToShopping meals={saved} />
    </div>
  )
}
export const dynamic = 'force-dynamic'
