import { data } from '@/lib/data'
import { OnboardingForm } from './onboarding-form'

export const dynamic = 'force-dynamic'

/**
 * /onboarding — R8 (perf): server kiểm tra thai kỳ hiện có → form client nhận
 * props (trước đây client nạp cả data layer để tự hỏi server 2 lượt).
 */
export default async function OnboardingPage() {
  const preg = await data.getPregnancy().catch(() => null)
  const fetalCount = preg
    ? (await data.getFetuses().catch(() => [])).filter((f) => f.pregnancy_id === preg.id).length
    : 0

  return <OnboardingForm existing={Boolean(preg)} currentFetuses={fetalCount} />
}
