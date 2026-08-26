// ===========================================================================
// stage.ts — gợi ý giai đoạn (pregnancy/postpartum/newborn/1-6m/6-12m/12-24m)
// bằng từ khóa. Fallback khi không có AI; Agent 5 có thể thay bằng AI.
// ===========================================================================

import type { KnowledgeStage } from '@mevabe/domain'

export const STAGE_KEYWORDS: Record<KnowledgeStage, string[]> = {
  pregnancy: [
    'mang thai', 'thai kỳ', 'thai kì', 'thai nhi', 'bà bầu', 'sản phụ', 'thai máy',
    'thai giáo', 'tuần thai', 'siêu âm', 'sản khoa', 'nghén', 'nạo vét', 'tam cá nguyệt',
    'quỹ đạo', 'cân nặng thai', 'chuyển dạ', 'vỡ ối', 'cơn gò', 'ngôi thai',
  ],
  postpartum: [
    'sau sinh', 'hậu sản', 'ở cữ', 'sản dịch', 'cho con bú', 'về sữa', 'vết mổ',
    'khâu tầng sinh môn', 'sau khi sinh', 'mẹ sau sinh', 'tuần đầu sau sinh',
  ],
  newborn: [
    'trẻ sơ sinh', 'sơ sinh', 'em bé mới sinh', 'trẻ mới sinh', 'vàng da', 'cuống rốn',
    'rốn', 'tiêm chủng sơ sinh', 'da kề da', 'cân nặng sơ sinh', 'bú sữa non',
    'bé 1 tháng', 'bé 2 tháng', 'sữa mẹ', 'khám sơ sinh',
  ],
  age_1_6m: [
    'tập lẫy', 'lẫy', 'nằm sấp', 'bé 3 tháng', 'bé 4 tháng', 'bé 5 tháng', 'bé 6 tháng',
    'tăng cân', 'bú bình', 'ti mẹ', 'từ 1 đến 6 tháng', '1-6 tháng', 'trẻ 2 tháng',
  ],
  age_6_12m: [
    'ăn dặm', 'bò', 'ngồi vững', 'mọc răng', 'tập ăn', 'cháo', 'baby led weaning',
    'trẻ 7 tháng', 'trẻ 8 tháng', 'trẻ 9 tháng', 'trẻ 10 tháng', 'trẻ 11 tháng',
    'trẻ 1 tuổi', 'bé 8 tháng', 'từ 6 đến 12 tháng', '6-12 tháng',
  ],
  age_12_24m: [
    'tập đi', 'trẻ 1 tuổi', 'bé 1 tuổi', 'trẻ 18 tháng', 'trẻ 2 tuổi', 'từ 1 đến 2 tuổi',
    'ăn cơm', 'tách sữa mẹ', 'tập nói', '12-24 tháng', '1-2 tuổi', 'nhà trẻ',
  ],
}

/** Tính điểm từ khóa trên văn bản; trả giai đoạn điểm cao nhất (thứ tự cố định khi hòa). */
export function guessStage(text: string): KnowledgeStage {
  const lower = text.toLowerCase()
  let best: KnowledgeStage = 'pregnancy'
  let bestScore = 0
  for (const stage of STAGE_ORDER) {
    let score = 0
    for (const kw of STAGE_KEYWORDS[stage]) {
      if (lower.includes(kw)) score++
    }
    if (score > bestScore) {
      best = stage
      bestScore = score
    }
  }
  return bestScore > 0 ? best : 'pregnancy'
}

const STAGE_ORDER: KnowledgeStage[] = [
  'pregnancy',
  'postpartum',
  'newborn',
  'age_1_6m',
  'age_6_12m',
  'age_12_24m',
]
