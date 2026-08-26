// ===========================================================================
// Sinh quiz từ nội dung import (Agent 6 sẽ nối UI). Thuần: dựng prompt + parse JSON.
// Chỉ import runtime `zod` (package) + type-only sibling → chạy được bằng node.
// ===========================================================================

import { z } from 'zod'
import type { AiMessage } from './client'

export interface QuizGenInput {
  title: string
  /** Các chunk nội dung đã lập index (dạng text thường). */
  chunks: string[]
  count?: number
}

const QUIZ_SYSTEM = `Bạn là trợ lý "Mẹ & Bé" — ứng dụng chăm sóc thai kỳ cho gia đình Việt.
Sinh câu hỏi trắc nghiệm (nhiều lựa chọn) TỪ ĐÚNG nội dung được cung cấp, bằng tiếng Việt.
Trả lời JSON thuần:
{"questions":[{"type":"multiple_choice","prompt":"...","options":["...","..."],"correct_index":0,"explanation":"giải thích ≤ 100 từ","citation":"nguồn trích từ nội dung gốc"}]}
options phải ≥ 2, correct_index chỉ đúng đáp án, citation lấy nguyên từ nội dung (không bịa).`

export function buildQuizMessages(input: QuizGenInput): AiMessage[] {
  const chunks = input.chunks.slice(0, 6).join('\n\n')
  const count = Math.min(input.count ?? 5, 10)
  return [
    { role: 'system', content: QUIZ_SYSTEM },
    {
      role: 'user',
      content: `Tựa nội dung: ${input.title}\n\nSinh đúng ${count} câu trắc nghiệm từ nội dung dưới đây:\n\n${chunks}`,
    },
  ]
}

export const quizQuestionOutputSchema = z.object({
  type: z.literal('multiple_choice'),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correct_index: z.number().int().nonnegative(),
  explanation: z.string().min(1).max(2000),
  citation: z.string(),
})
export type QuizQuestionOutput = z.infer<typeof quizQuestionOutputSchema>

/** Trích JSON thuần từ phản hồi model (nhiều model bọc trong markdown). */
export function extractJson(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('JSON_MISSING')
  return text.slice(start, end + 1)
}

export function parseQuizResponse(text: string): QuizQuestionOutput[] {
  const parsed = z
    .object({ questions: z.array(quizQuestionOutputSchema) })
    .safeParse(JSON.parse(extractJson(text)))
  if (!parsed.success) throw new Error(`QUIZ_PARSE_FAIL: ${parsed.error.message}`)
  return parsed.data.questions
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

/** demo() chạy bằng `node --experimental-strip-types quiz-gen.ts`. */
export function demo(): void {
  const valid = '{"questions":[{"type":"multiple_choice","prompt":"A hay B?","options":["A","B"],"correct_index":1,"explanation":"Giải thích.","citation":"Nguồn 1"}]}'
  assert(parseQuizResponse(valid)[0]!.correct_index === 1, 'parse valid json')
  assert(parseQuizResponse('```json\n' + valid + '\n```')[0]!.prompt === 'A hay B?', 'parse markdown-wrapped')

  const bad = { questions: [{ type: 'multiple_choice', prompt: 'x', options: ['a'], correct_index: 9, explanation: 'e', citation: 'c' }] }
  let threw = false
  try {
    parseQuizResponse(JSON.stringify(bad))
  } catch {
    threw = true
  }
  assert(threw, 'reject invalid question')

  const msgs = buildQuizMessages({ title: 'Cẩm nang', chunks: ['Nội dung A', 'Nội dung B'], count: 3 })
  assert(msgs.length === 2 && msgs[1]!.content.includes('3 câu'), 'build messages')
  console.log('✅ quiz-gen.demo OK')
}

if (process.argv[1]?.endsWith('quiz-gen.ts')) demo()
