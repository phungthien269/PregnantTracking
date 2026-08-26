import type { KnowledgePhase, KnowledgeTopic } from './types'
import { topics as pregnancyLifestyle } from './pregnancy-lifestyle'
import { topics as pregnancyMindWork } from './pregnancy-mind-work'
import { topics as parenting0to24mo } from './parenting-0-24mo'
import { topics as devNutrition1000days } from './dev-nutrition-1000days'
import { topics as devNutritionInfant } from './dev-nutrition-infant'
import { topics as pregnancyNutrition } from './pregnancy-nutrition'

// Registry — gộp toàn bộ chủ đề kho kiến thức. Module rỗng ([]) không đóng góp gì.
export const allTopics: KnowledgeTopic[] = [
  ...pregnancyLifestyle,
  ...pregnancyMindWork,
  ...parenting0to24mo,
  ...devNutrition1000days,
  ...devNutritionInfant,
  ...pregnancyNutrition,
]

/** Thứ tự hiển thị nhóm giai đoạn. */
export const PHASE_ORDER: KnowledgePhase[] = ['preconception', 'pregnancy', 'infant', 'toddler']

/** Nhãn tiếng Việt từng giai đoạn. */
export const PHASE_LABELS: Record<KnowledgePhase, string> = {
  preconception: 'Trước khi mang thai',
  pregnancy: 'Thai kỳ',
  infant: 'Bé sơ sinh',
  toddler: 'Bé tập đi',
}

export type { KnowledgePhase, KnowledgeSource, KnowledgeBlock, KnowledgeSection, KnowledgeTopic } from './types'
