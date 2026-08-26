// ===========================================================================
// ai.ts — seam AI cho pipeline thư viện. Agent 5 (OpenRouter) có thể cung cấp
// 3 endpoint HTTP; chưa cấu hình → trả null → pipeline chạy fallback local
// (full-text + stage từ khóa + quiz "điền số").
//
// Khế ước đề xuất cho Agent 5 (xem comm/agent-5-ai.md):
//   POST {LIBRARY_AI_BASE_URL}/embed         body { texts: string[] } → { data: number[][] | null }
//   POST {LIBRARY_AI_BASE_URL}/suggest-stage body { text: string }   → { data: KnowledgeStage | null }
//   POST {LIBRARY_AI_BASE_URL}/quiz-gen      body { chunks: {content,citation}[], stage, title }
//                                                                    → { data: QuizDraft[] | null }
// Mọi lỗi/cấu hình thiếu → null (không chặn import).
// ===========================================================================

import type { KnowledgeStage } from '@mevabe/domain'
import type { QuizDraft } from './quiz'

const BASE = process.env.LIBRARY_AI_BASE_URL

async function callAi<T>(path: string, body: unknown): Promise<T | null> {
  if (!BASE) return null
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: T | null }
    return json.data ?? null
  } catch {
    return null
  }
}

/** Embedding 1536-d cho từng text; null → dùng full-text search. */
export function aiEmbedTexts(texts: string[]): Promise<number[][] | null> {
  return callAi<number[][]>('/embed', { texts })
}

/** Gợi ý giai đoạn bằng AI; null → guessStage (từ khóa). */
export function aiSuggestStage(text: string): Promise<KnowledgeStage | null> {
  return callAi<KnowledgeStage>('/suggest-stage', { text })
}

/** Sinh quiz bằng AI; null → generateQuizFromChunks (fallback). */
export function aiGenerateQuiz(
  chunks: { content: string; citation: string }[],
  stage: KnowledgeStage,
  title: string,
): Promise<QuizDraft[] | null> {
  return callAi<QuizDraft[]>('/quiz-gen', { chunks, stage, title })
}
