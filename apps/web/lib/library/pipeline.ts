// ===========================================================================
// pipeline.ts — điều phối import: extract → chunk (citation+position) →
// lưu source/chunks → gợi ý giai đoạn → (tuỳ chọn) embedding. Quiz sinh riêng
// qua generateQuizSet (chỉ từ nguồn người dùng import).
// ===========================================================================

import type { KnowledgeStage } from '@mevabe/domain'
import { extractDocument, type ImportKind } from './extract'
import { chunkText, type Chunk } from './chunk'
import { libraryStore } from './store'
import { guessStage } from './stage'
import { generateQuizFromChunks } from './quiz'
import { aiEmbedTexts, aiSuggestStage, aiGenerateQuiz } from './ai'
import { data } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase'

export interface ImportResult {
  sourceId: string
  title: string
  status: 'ready' | 'failed'
  chunkCount: number
  suggestedStage: KnowledgeStage | null
  citations: string[]
}

export interface ImportInput {
  kind: ImportKind
  url?: string
  text?: string
  data?: Buffer
  filename?: string
  /** "Chỉ mình tôi" — mock: private_owner_id = active user; mặc định false = dùng chung. */
  private?: boolean
}

/** Import 1 nguồn: extract → chunk → store → stage tag (chờ user xác nhận). */
export async function importSource(input: ImportInput): Promise<ImportResult> {
  const doc = await extractDocument(input)
  const chunks = chunkText(doc)
  if (!chunks.length) throw new Error('Không trích xuất được nội dung để lập chỉ mục')

  const source = await libraryStore.createSource(doc.title, { private: input.private })
  try {
    // Embedding tuỳ chọn (Agent 5); null → fallback full-text search.
    const embeddings = await aiEmbedTexts(chunks.map((c) => c.content))
    const chunkRows = chunks.map((c, i) => ({ ...c, embedding: embeddings?.[i] ?? null }))
    await libraryStore.addChunks(source.id, chunkRows)
    // Phase 6 (agent 6G): persist chunks vào SQLite qua saveKnowledgeChunks để
    // searchKnowledgeChunks tìm được trên trang thư viện. Chế độ Supabase:
    // libraryStore.addChunks đã ghi bảng knowledge_chunks — tránh ghi đúp.
    if (!isSupabaseConfigured()) {
      await data.saveKnowledgeChunks(source.id, chunkRows)
    }

    const stage = (await aiSuggestStage(doc.text)) ?? guessStage(doc.text)
    await libraryStore.addStageTags(source.id, [stage])
    await libraryStore.setSourceStatus(source.id, { status: 'ready', chunk_count: chunks.length, stage })

    return {
      sourceId: source.id,
      title: doc.title,
      status: 'ready',
      chunkCount: chunks.length,
      suggestedStage: stage,
      citations: [...new Set(chunks.map((c) => c.citation))].slice(0, 5),
    }
  } catch (err) {
    await libraryStore.setSourceStatus(source.id, { status: 'failed' }).catch(() => {})
    throw err
  }
}

/** Xác nhận giai đoạn cho 1 nguồn (thay gợi ý ban đầu). */
export async function confirmStage(sourceId: string, stage: KnowledgeStage): Promise<void> {
  await libraryStore.confirmStageTag(sourceId, stage)
  await libraryStore.setSourceStatus(sourceId, { stage })
}

export interface QuizGenResult {
  quizSetId: string
  title: string
  questionCount: number
}

/** Sinh quiz từ chunks của các nguồn import (không trộn kho y khoa của app). */
export async function generateQuizSet(input: {
  sourceIds: string[]
  stage: KnowledgeStage | null
  title: string
}): Promise<QuizGenResult> {
  const chunkLists = await Promise.all(input.sourceIds.map((id) => libraryStore.getChunks(id)))
  const chunks: Chunk[] = chunkLists.flat().map((c) => ({ content: c.content, citation: c.citation, position: c.position }))
  if (!chunks.length) throw new Error('Nguồn chưa có nội dung để sinh quiz (chỉ dùng nguồn đã import)')

  const stage = input.stage ?? guessStage(chunks.map((c) => c.content).join('\n'))
  const drafts = (await aiGenerateQuiz(chunks, stage, input.title)) ?? generateQuizFromChunks(chunks, stage)
  if (!drafts.length) throw new Error('Không sinh được câu hỏi từ nguồn này')

  const { id: quizSetId } = await libraryStore.createQuizSet({
    title: input.title,
    stage,
    source_ids: input.sourceIds,
  })
  await libraryStore.addQuizQuestions(quizSetId, drafts)
  return { quizSetId, title: input.title, questionCount: drafts.length }
}
