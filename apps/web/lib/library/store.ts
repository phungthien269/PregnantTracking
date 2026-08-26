// ===========================================================================
// store.ts — tầng lưu trữ cho thư viện import (không đụng DataApi/api.ts).
// - Mock: in-memory (demo, dữ liệu import thấy được ngay trong phiên).
// - Supabase: ghi qua client anon + RLS (cùng pattern Agent 3), private_owner_id
//   = user đang đăng nhập → mục import là riêng tư của người import.
// mock.ts merge dữ liệu import vào getter đọc (đã báo orchestrator).
// ===========================================================================

import type * as D from '@mevabe/domain'
import type { KnowledgeStage } from '@mevabe/domain'
import { supabase, isSupabaseConfigured } from '../supabase'
import { getActiveUser } from '../auth/active-user'
import type { QuizDraft } from './quiz'

// family/private dùng cho mock — khớp hằng số trong mock.ts (không import để né cycle)
const DEMO_FAMILY_ID = '10000000-0000-0000-0000-000000000001'

export interface StoredChunk {
  content: string
  citation: string
  position: number
  embedding?: number[] | null
}

export interface LibraryStore {
  createSource(
    title: string,
    opts?: { content_source_id?: string | null; stage?: KnowledgeStage | null; private?: boolean },
  ): Promise<D.KnowledgeSource>
  setSourceStatus(
    id: string,
    patch: { status?: D.KnowledgeSource['status']; chunk_count?: number; stage?: KnowledgeStage | null; title?: string },
  ): Promise<void>
  deleteSource(id: string): Promise<void>
  addChunks(sourceId: string, chunks: StoredChunk[]): Promise<void>
  getChunks(sourceId: string): Promise<StoredChunk[]>
  addStageTags(sourceId: string, stages: KnowledgeStage[]): Promise<void>
  confirmStageTag(sourceId: string, stage: KnowledgeStage): Promise<void>
  listStageTags(sourceId: string): Promise<D.KnowledgeStageTag[]>
  createQuizSet(input: { title: string; stage: KnowledgeStage | null; source_ids: string[] }): Promise<{ id: string }>
  addQuizQuestions(quizSetId: string, questions: QuizDraft[]): Promise<void>
  /** Mock-only: dữ liệu import để mock.ts merge vào getter đọc. */
  listSources(): D.KnowledgeSource[]
  listQuizSets(): D.QuizSet[]
  listQuizQuestions(): D.QuizQuestion[]
}

const now = (): string => new Date().toISOString()

// ---------------------------------------------------------------------------
// Mock
// ---------------------------------------------------------------------------

const mockSources: D.KnowledgeSource[] = []
const mockChunks: D.KnowledgeChunk[] = []
const mockTags: D.KnowledgeStageTag[] = []
const mockQuizSets: D.QuizSet[] = []
const mockQuizQuestions: D.QuizQuestion[] = []

const mockLibrary: LibraryStore = {
  async createSource(title, opts) {
    // Phase 4B: "Chỉ mình tôi" → private_owner_id = active user (mock), mặc định dùng chung.
    const privateOwnerId = opts?.private ? (getActiveUser()?.user_id ?? null) : null
    const source: D.KnowledgeSource = {
      id: crypto.randomUUID(),
      family_id: DEMO_FAMILY_ID,
      private_owner_id: privateOwnerId,
      content_source_id: opts?.content_source_id ?? null,
      title,
      stage: opts?.stage ?? null,
      status: 'processing',
      chunk_count: null,
      created_at: now(),
      updated_at: now(),
    }
    mockSources.unshift(source)
    return source
  },

  async setSourceStatus(id, patch) {
    const s = mockSources.find((x) => x.id === id)
    if (!s) throw new Error('Nguồn không tồn tại')
    Object.assign(s, patch, { updated_at: now() })
  },

  async deleteSource(id) {
    const i = mockSources.findIndex((x) => x.id === id)
    if (i >= 0) mockSources.splice(i, 1)
    for (const arr of [mockChunks, mockTags]) {
      for (let k = arr.length - 1; k >= 0; k--) {
        if (arr[k]!.knowledge_source_id === id) arr.splice(k, 1)
      }
    }
  },

  async addChunks(sourceId, chunks) {
    for (const c of chunks) {
      mockChunks.push({
        id: crypto.randomUUID(),
        family_id: DEMO_FAMILY_ID,
        private_owner_id: null,
        knowledge_source_id: sourceId,
        content: c.content,
        citation: c.citation,
        position: c.position,
        embedding: c.embedding ?? null,
        created_at: now(),
        updated_at: now(),
      })
    }
  },

  async getChunks(sourceId) {
    return mockChunks
      .filter((c) => c.knowledge_source_id === sourceId)
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ content: c.content, citation: c.citation, position: c.position, embedding: c.embedding }))
  },

  async addStageTags(sourceId, stages) {
    for (const stage of stages) {
      if (mockTags.some((t) => t.knowledge_source_id === sourceId && t.stage === stage)) continue
      mockTags.push({
        id: crypto.randomUUID(),
        family_id: DEMO_FAMILY_ID,
        private_owner_id: null,
        knowledge_source_id: sourceId,
        stage,
        confirmed_by: null,
        confirmed_at: null,
        created_at: now(),
        updated_at: now(),
      })
    }
  },

  async confirmStageTag(sourceId, stage) {
    const t = mockTags.find((x) => x.knowledge_source_id === sourceId && x.stage === stage)
    if (t) {
      t.confirmed_by = DEMO_FAMILY_ID // mock không có auth — dùng family id
      t.confirmed_at = now()
      t.updated_at = now()
    }
  },

  async listStageTags(sourceId) {
    return mockTags.filter((t) => t.knowledge_source_id === sourceId)
  },

  async createQuizSet(input) {
    const set: D.QuizSet = {
      id: crypto.randomUUID(),
      family_id: DEMO_FAMILY_ID,
      private_owner_id: null,
      title: input.title,
      stage: input.stage,
      source_ids: input.source_ids,
      status: 'draft',
      question_count: 0,
      created_at: now(),
      updated_at: now(),
    }
    mockQuizSets.unshift(set)
    return { id: set.id }
  },

  async addQuizQuestions(quizSetId, questions) {
    for (const q of questions) {
      mockQuizQuestions.push({
        id: crypto.randomUUID(),
        family_id: DEMO_FAMILY_ID,
        private_owner_id: null,
        quiz_set_id: quizSetId,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
        citation: q.citation,
        created_at: now(),
        updated_at: now(),
      })
    }
    const set = mockQuizSets.find((s) => s.id === quizSetId)
    if (set) {
      set.question_count = mockQuizQuestions.filter((q) => q.quiz_set_id === quizSetId).length
      set.status = 'ready'
      set.updated_at = now()
    }
  },

  listSources() {
    return [...mockSources]
  },

  listQuizSets() {
    return [...mockQuizSets]
  },

  listQuizQuestions() {
    return [...mockQuizQuestions]
  },
}

// ---------------------------------------------------------------------------
// Supabase (ghi qua client anon + RLS; mục import riêng tư của người import)
// ---------------------------------------------------------------------------

async function currentUser(): Promise<{ uid: string; familyId: string }> {
  if (!supabase) throw new Error('[library] Chưa cấu hình Supabase')
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('[library] Cần đăng nhập để import')
  const { data, error } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .limit(1)
  if (error) throw error
  const fid = data?.[0]?.family_id as string | undefined
  if (!fid) throw new Error('[library] Người dùng chưa thuộc gia đình nào')
  return { uid: user.id, familyId: fid }
}

const supabaseLibrary: LibraryStore = {
  async createSource(title, opts) {
    const { uid, familyId } = await currentUser()
    const { data, error } = await supabase!
      .from('knowledge_sources')
      .insert({
        family_id: familyId,
        private_owner_id: uid,
        content_source_id: opts?.content_source_id ?? null,
        title,
        stage: opts?.stage ?? null,
        status: 'processing',
        chunk_count: null,
      } as never)
      .select()
      .single()
    if (error) throw error
    return data as D.KnowledgeSource
  },

  async setSourceStatus(id, patch) {
    if (!supabase) throw new Error('[library] Chưa cấu hình Supabase')
    const { error } = await supabase.from('knowledge_sources').update(patch as never).eq('id', id)
    if (error) throw error
  },

  async deleteSource(id) {
    if (!supabase) throw new Error('[library] Chưa cấu hình Supabase')
    const { error } = await supabase.from('knowledge_sources').delete().eq('id', id)
    if (error) throw error
  },

  async addChunks(sourceId, chunks) {
    const { uid, familyId } = await currentUser()
    const { error } = await supabase!.from('knowledge_chunks').insert(
      chunks.map((c) => ({
        family_id: familyId,
        private_owner_id: uid,
        knowledge_source_id: sourceId,
        content: c.content,
        citation: c.citation,
        position: c.position,
        // `ponytail:` embedding để null — khi Agent 5 có embedding thật thì ghi
        // vector (cần đổi sang chuỗi cast cho PostgREST nếu bị từ chối).
        embedding: c.embedding ?? null,
      })) as never,
    )
    if (error) throw error
  },

  async getChunks(sourceId) {
    if (!supabase) throw new Error('[library] Chưa cấu hình Supabase')
    const { data, error } = await supabase
      .from('knowledge_chunks')
      .select('content, citation, position')
      .eq('knowledge_source_id', sourceId)
      .order('position', { ascending: true })
    if (error) throw error
    return (data ?? []) as StoredChunk[]
  },

  async addStageTags(sourceId, stages) {
    const { uid, familyId } = await currentUser()
    const { error } = await supabase!.from('knowledge_stage_tags').insert(
      stages.map((stage) => ({
        family_id: familyId,
        private_owner_id: uid,
        knowledge_source_id: sourceId,
        stage,
        confirmed_by: null,
        confirmed_at: null,
      })) as never,
    )
    if (error) throw error
  },

  async confirmStageTag(sourceId, stage) {
    if (!supabase) throw new Error('[library] Chưa cấu hình Supabase')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('[library] Cần đăng nhập')
    const { error } = await supabase
      .from('knowledge_stage_tags')
      .update({ confirmed_by: user.id, confirmed_at: now() })
      .eq('knowledge_source_id', sourceId)
      .eq('stage', stage)
    if (error) throw error
  },

  async listStageTags(sourceId) {
    if (!supabase) throw new Error('[library] Chưa cấu hình Supabase')
    const { data, error } = await supabase
      .from('knowledge_stage_tags')
      .select('*')
      .eq('knowledge_source_id', sourceId)
    if (error) throw error
    return (data ?? []) as D.KnowledgeStageTag[]
  },

  async createQuizSet(input) {
    const { uid, familyId } = await currentUser()
    const { data, error } = await supabase!
      .from('quiz_sets')
      .insert({
        family_id: familyId,
        private_owner_id: uid,
        title: input.title,
        stage: input.stage,
        source_ids: input.source_ids,
        status: 'draft',
        question_count: 0,
      } as never)
      .select()
      .single()
    if (error) throw error
    return { id: (data as { id: string }).id }
  },

  async addQuizQuestions(quizSetId, questions) {
    const { uid, familyId } = await currentUser()
    const { error } = await supabase!.from('quiz_questions').insert(
      questions.map((q) => ({
        family_id: familyId,
        private_owner_id: uid,
        quiz_set_id: quizSetId,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
        citation: q.citation,
      })) as never,
    )
    if (error) throw error
    const { error: upErr } = await supabase!
      .from('quiz_sets')
      .update({ status: 'ready', question_count: questions.length })
      .eq('id', quizSetId)
    if (upErr) throw upErr
  },

  listSources() {
    return []
  },
  listQuizSets() {
    return []
  },
  listQuizQuestions() {
    return []
  },
}

export const libraryStore: LibraryStore = isSupabaseConfigured() ? supabaseLibrary : mockLibrary
