import { data } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { SymptomLog, type SymptomRow } from '@/components/symptom-log'
import { SymptomMealSuggestions } from '@/components/symptom-meal-suggestions'
import { weekFromLmp } from '@/lib/pregnancy-math'
import { SectionTabs, THAI_KY_TABS, SUC_KHOE_TABS } from '@/components/section-tabs'

export default async function TrieuChungPage() {
  const symptoms = await data.getSymptoms()
  const pregnancy = await data.getPregnancy()
  // Cá nhân hoá gợi ý món theo tuần thai (null nếu chưa có thai kỳ).
  const week = pregnancy?.lmp ? weekFromLmp(pregnancy.lmp) : null
  return (
    <div className="space-y-6">
      <PageHeader title="Triệu chứng" description="Ghi nhật ký và phân tích dấu hiệu, luôn kiểm tra mức khẩn trước." />
      <SectionTabs tabs={THAI_KY_TABS} />
      <SectionTabs tabs={SUC_KHOE_TABS} />
      <SymptomMealSuggestions symptoms={symptoms} week={week} />
      <SymptomLog symptoms={symptoms} />
    </div>
  )
}
export const dynamic = 'force-dynamic'
