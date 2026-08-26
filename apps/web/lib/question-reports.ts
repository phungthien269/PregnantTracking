// ===========================================================================
// question-reports.ts — báo lỗi câu hỏi quiz (bảng public.question_reports).
// - Mock: in-memory (demo, thấy ngay trong phiên).
// - Supabase: ghi qua client anon + RLS chuẩn family_id (migration 0007/0008).
// API route dùng module này trực tiếp — nằm ngoài DataApi (seam Agent 3).
// ===========================================================================

import type * as D from '@mevabe/domain'
import { z } from 'zod'
import { supabase, isSupabaseConfigured } from './supabase'

// family/reporter dùng cho mock — khớp hằng số trong mock.ts (không import để né cycle)
const DEMO_FAMILY_ID = '10000000-0000-0000-0000-000000000001'
const DEMO_REPORTER_ID = '10000000-0000-0000-0000-000000000002'

// reason ≤ 200 + details ≤ 700 + dấu nối ≤ 1000 (khớp questionReportSchema.reason max 1000).
// Dùng z.string().uuid() thay vì idSchema để tránh import runtime @mevabe/domain
// (self-check chạy bằng `node --experimental-strip-types` không resolve directory index).
export const questionReportInputSchema = z.object({
  quiz_question_id: z.string().uuid('ID câu hỏi không hợp lệ'),
  reason: z.string().min(1, 'Chọn lý do báo lỗi').max(200),
  details: z.string().max(700).optional(),
})
export type QuestionReportInput = z.infer<typeof questionReportInputSchema>

export interface QuestionReportGroup {
  quiz_question_id: string
  count: number
  open_count: number
  latest_reported_at: string | null
  statuses: { open: number; resolved: number; rejected: number }
}

export interface QuestionReportStore {
  create(input: QuestionReportInput): Promise<D.QuestionReport>
  list(): Promise<D.QuestionReport[]>
  updateStatus(id: string, status: D.QuestionReport['status']): Promise<D.QuestionReport>
  summary(): Promise<QuestionReportGroup[]>
}

/** Gộp danh sách report theo câu hỏi — dùng chung cho cả mock lẫn supabase. */
export function groupReports(reports: D.QuestionReport[]): QuestionReportGroup[] {
  const byQuestion = new Map<string, QuestionReportGroup>()
  for (const r of reports) {
    let g = byQuestion.get(r.quiz_question_id)
    if (!g) {
      g = {
        quiz_question_id: r.quiz_question_id,
        count: 0,
        open_count: 0,
        latest_reported_at: null,
        statuses: { open: 0, resolved: 0, rejected: 0 },
      }
      byQuestion.set(r.quiz_question_id, g)
    }
    g.count += 1
    g.statuses[r.status] += 1
    if (r.status === 'open') g.open_count += 1
    if (!g.latest_reported_at || r.created_at > g.latest_reported_at) g.latest_reported_at = r.created_at
  }
  return [...byQuestion.values()].sort((a, b) => b.open_count - a.open_count || b.count - a.count)
}

const now = (): string => new Date().toISOString()
const combineReason = (input: QuestionReportInput): string =>
  input.details ? `${input.reason} — ${input.details}` : input.reason

// ---------------------------------------------------------------------------
// Mock (in-memory)
// ---------------------------------------------------------------------------

const mockReports: D.QuestionReport[] = []

const mockStore: QuestionReportStore = {
  async create(input) {
    const report: D.QuestionReport = {
      id: crypto.randomUUID(),
      family_id: DEMO_FAMILY_ID,
      private_owner_id: null,
      quiz_question_id: input.quiz_question_id,
      reporter_id: DEMO_REPORTER_ID,
      reason: combineReason(input),
      status: 'open',
      created_at: now(),
      updated_at: now(),
    }
    mockReports.unshift(report)
    return report
  },

  async list() {
    return [...mockReports]
  },

  async updateStatus(id, status) {
    const report = mockReports.find((r) => r.id === id)
    if (!report) throw new Error('Báo cáo không tồn tại')
    report.status = status
    report.updated_at = now()
    return { ...report }
  },

  async summary() {
    return groupReports(mockReports)
  },
}

// ---------------------------------------------------------------------------
// Supabase (client anon + RLS; family_id của người đang đăng nhập)
// ---------------------------------------------------------------------------

async function currentUser(): Promise<{ uid: string; familyId: string }> {
  if (!supabase) throw new Error('[question-reports] Chưa cấu hình Supabase')
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('[question-reports] Cần đăng nhập để báo lỗi')
  const { data, error } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .limit(1)
  if (error) throw error
  const fid = data?.[0]?.family_id as string | undefined
  if (!fid) throw new Error('[question-reports] Người dùng chưa thuộc gia đình nào')
  return { uid: user.id, familyId: fid }
}

const supabaseStore: QuestionReportStore = {
  async create(input) {
    const { uid, familyId } = await currentUser()
    const { data, error } = await supabase!
      .from('question_reports')
      .insert({
        family_id: familyId,
        private_owner_id: uid,
        quiz_question_id: input.quiz_question_id,
        reporter_id: uid,
        reason: combineReason(input),
        status: 'open',
      } as never)
      .select()
      .single()
    if (error) throw error
    return data as D.QuestionReport
  },

  async list() {
    if (!supabase) throw new Error('[question-reports] Chưa cấu hình Supabase')
    const { data, error } = await supabase
      .from('question_reports')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as D.QuestionReport[]
  },

  async updateStatus(id, status) {
    if (!supabase) throw new Error('[question-reports] Chưa cấu hình Supabase')
    const { data, error } = await supabase!
      .from('question_reports')
      .update({ status } as never)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as D.QuestionReport
  },

  async summary() {
    return groupReports(await this.list())
  },
}

export const questionReportStore: QuestionReportStore = isSupabaseConfigured()
  ? supabaseStore
  : mockStore
