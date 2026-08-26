// ===========================================================================
// quiz.ts — sinh câu hỏi trắc nghiệm TỪ NGUỒN NGƯỜI DÙNG IMPORT (không trộn
// kho y khoa của app). Fallback xác định: câu "điền số" lấy câu chứa số liệu,
// đáp án sai lấy số liệu khác trong cùng nguồn. Khi có AI (Agent 5) → sinh
// thêm câu tình huống.
// ===========================================================================

import type { KnowledgeStage } from '@mevabe/domain'
import type { Chunk } from './chunk'
import { splitSentences } from './text'

export interface QuizDraft {
  type: 'multiple_choice' | 'scenario'
  prompt: string
  options: string[]
  correct_index: number
  explanation: string
  citation: string
}

const GENERIC_NUMBERS = ['0', '24 giờ', '48 giờ', '50', '500', '1000', '2000']

/** Câu chứa số liệu (mg, tuần, cm…) → dùng làm câu hỏi "điền số". */
function blankedFact(sentence: string): { prompt: string; num: string } | null {
  const m = sentence.match(/(\d[\d.,–\-]*(?:\s?[a-zA-Z%µ]+)?)/)
  if (!m || !/\d/.test(m[1]!)) return null
  const num = m[1]!.trim()
  if (num.length > 12) return null
  const prompt = sentence.replace(m[1]!, '____')
  if (prompt === sentence) return null
  return { prompt, num }
}

/** Gộp các câu số liệu từ chunk làm nguồn "đáp án sai" (cùng nguồn). */
function numberPool(chunks: Chunk[], exclude: Set<string>, max = 8): string[] {
  const pool: string[] = []
  for (const chunk of chunks) {
    for (const s of splitSentences(chunk.content)) {
      const m = s.match(/\d[\d.,–\-]*(?:\s?[a-zA-Z%µ]+)?/)
      if (!m || !/\d/.test(m[1]!)) continue
      const v = m[1]!.trim()
      if (v.length > 12 || exclude.has(v) || pool.includes(v)) continue
      pool.push(v)
      if (pool.length >= max) return pool
    }
  }
  for (const g of GENERIC_NUMBERS) {
    if (pool.length >= max) break
    if (!exclude.has(g) && !pool.includes(g)) pool.push(g)
  }
  return pool
}

function buildQuestion(index: number, prompt: string, correct: string, distractors: string[], citation: string): QuizDraft {
  const options = [...distractors]
  const ci = (index + 1) % (options.length + 1)
  options.splice(ci, 0, correct)
  return {
    type: 'multiple_choice',
    prompt,
    options,
    correct_index: ci,
    explanation: `Theo nguồn đã import: ${correct}. (${citation})`,
    citation,
  }
}

/** Sinh tối đa `max` câu trắc nghiệm từ chunks của một (hoặc nhiều) nguồn import. */
export function generateQuizFromChunks(
  chunks: Chunk[],
  _stage: KnowledgeStage,
  max = 5,
): QuizDraft[] {
  if (!chunks.length) return []
  const questions: QuizDraft[] = []
  const usedPrompts = new Set<string>()
  const usedCorrect = new Set<string>()

  const addForChunk = (chunk: Chunk) => {
    if (questions.length >= max) return
    for (const sentence of splitSentences(chunk.content)) {
      if (sentence.length < 12 || sentence.length > 200) continue
      const fact = blankedFact(sentence)
      if (!fact || usedCorrect.has(fact.num)) continue
      const distractors = numberPool(chunks, new Set([fact.num])).slice(0, 3)
      if (distractors.length < 2) continue // cần đủ đáp án sai
      const prompt = `Theo nguồn đã import, điền số đúng: “${fact.prompt.trim()}”`
      if (usedPrompts.has(prompt)) continue
      usedPrompts.add(prompt)
      usedCorrect.add(fact.num)
      questions.push(buildQuestion(questions.length, prompt, fact.num, distractors, chunk.citation))
      if (questions.length >= max) return
    }
  }

  for (const chunk of chunks) addForChunk(chunk)
  return questions
}
