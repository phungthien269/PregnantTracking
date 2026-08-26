// ===========================================================================
// Supabase data layer — Agent 3 (Backend data)
// Cùng interface `DataApi` như mock.ts nhưng truy vấn backend thật.
// Bảng đặt tên snake_case theo plan §3; RLS + migrations đã apply (0001–0012).
//
// Client: `db()` trả request-scoped client (server, token từ cookie) nếu được
// gắn bởi lib/data/index.ts (server entry); ngược lại dùng singleton browser
// (localStorage session). Xem lib/supabase-server.ts.
// ===========================================================================

import type * as D from '@mevabe/domain'
import type {
  AppointmentInput,
  AppointmentUpdateInput,
  BirthRecordInput,
  BudgetInput,
  BudgetUpdateInput,
  ChildInput,
  ConditionMeasurementInput,
  ConditionPlanInput,
  DailyIntakeInput,
  DailyIntakeItem,
  DailyIntakeLog,
  DashboardSummary,
  DataApi,
  FamilyMemberView,
  FetusInput,
  GrowthPoint,
  GrowthPointInput,
  HealthProfileUpdateInput,
  KnowledgeChunkInput,
  MealPhotoInput,
  MedicalVisit,
  MedicalVisitInput,
  NutritionFocus,
  NutritionProfileInput,
  NutrientSummary,
  NutrientValueMap,
  PregnancyUpdateInput,
  ReminderInput,
  ShoppingItemUpdateInput,
  SymptomReportInput,
  VaccinationInput,
  VisitDocument,
  VisitDocumentInput,
  WaterCaffeine,
  WeekInfo,
} from './api'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import { PREG_ID, weekFromLmp, WEEKS, CURRENT_WEEK, trimesterOf, computeNutritionFocus } from './mock'
import { aggregateNutrients, buildNutrientSummary } from '../nutrition/intake-calcs'
import { todayStr } from '../format'
import { dedupeHealthMetrics, healthMetricKey, type HealthMetricInput } from '../health-sync'

// ---------------------------------------------------------------------------
// Client resolver — request-scoped (server) hoặc singleton (browser).
// ---------------------------------------------------------------------------

/**
 * Client request-scoped do server entry gắn mỗi method call (token từ cookie).
 * Dùng refcount để nhiều method gọi song song trong cùng request (VD dashboard
 * `Promise.all([...])`) không bị method khác null đi giữa chừng.
 */
let requestClient: SupabaseClient | null = null
let requestDepth = 0

/** Gắn client request-scoped — gọi bởi lib/data/index.ts trước mỗi method. */
export function setRequestSupabaseClient(c: SupabaseClient | null): void {
  if (c) {
    requestDepth += 1
    requestClient = c
  } else {
    requestDepth = Math.max(0, requestDepth - 1)
    if (requestDepth === 0) requestClient = null
  }
}

/** Client hiện dùng: ưu tiên request-scoped (server) → singleton (browser). */
function db(): SupabaseClient {
  if (requestClient) return requestClient
  if (supabase) return supabase
  throw new Error('[supabase] Chưa cấu hình NEXT_PUBLIC_SUPABASE_URL/ANON_KEY')
}

async function getRows<T>(table: string): Promise<T[]> {
  const { data, error } = await db().from(table).select('*')
  if (error) throw error
  return (data ?? []) as T[]
}

/** family_id của user đang đăng nhập (dùng cho mutation; RLS vẫn là biên giới chính). */
async function currentFamilyId(): Promise<string> {
  const {
    data: { user },
  } = await db().auth.getUser()
  if (!user) throw new Error('[supabase] Cần đăng nhập để ghi dữ liệu')
  const { data, error } = await db().from('family_members').select('family_id').eq('user_id', user.id).limit(1)
  if (error) throw error
  const fid = data?.[0]?.family_id as string | undefined
  if (!fid) throw new Error('[supabase] Người dùng chưa thuộc gia đình nào')
  return fid
}

async function insertRow<T>(table: string, row: Record<string, unknown>): Promise<T> {
  const family_id = await currentFamilyId()
  // `ponytail:` cast qua any — client supabase-js chưa cấu hình generic schema;
  // khi gắn Database type đầy đủ thì bỏ cast.
  const { data, error } = await db().from(table).insert({ ...row, family_id } as never).select().single()
  if (error) throw error
  return data as T
}

async function updateRow(table: string, id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await db().from(table).update(patch).eq('id', id)
  if (error) throw error
}

const DAY_MS = 86_400_000

/** Naegele: EDD = LMP + 280 ngày. */
function eddFromLmp(lmp: string): string {
  const [y, m, d] = lmp.split('-').map(Number)
  const date = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, d ?? 1))
  date.setUTCDate(date.getUTCDate() + 280)
  return date.toISOString().slice(0, 10)
}

/** Naegele ngược: LMP = EDD − 280 ngày. */
function lmpFromEdd(edd: string): string {
  const [y, m, d] = edd.split('-').map(Number)
  const date = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, d ?? 1))
  date.setUTCDate(date.getUTCDate() - 280)
  return date.toISOString().slice(0, 10)
}

const supabaseImpl = {
  // ---- Thai kỳ & sức khỏe ----
  async getPregnancy(): Promise<D.Pregnancy | null> {
    const rows = await getRows<D.Pregnancy>('pregnancies')
    return rows.find((p) => p.status === 'ongoing') ?? null
  },

  async getFetuses(): Promise<D.Fetus[]> {
    return getRows<D.Fetus>('fetuses')
  },

  async getWeekInfo(week: number): Promise<WeekInfo> {
    // Nội dung tuần là TĨNH — không query DB, dùng bảng WEEKS (mock.ts, phủ 0–41).
    const clamped = Math.min(41, Math.max(0, week))
    return { ...WEEKS[clamped]! }
  },

  async getDashboard(): Promise<DashboardSummary> {
    const [pregnancies, appointments, measurements, symptoms, tasks, meals, hydration] =
      await Promise.all([
        getRows<D.Pregnancy>('pregnancies'),
        getRows<D.Appointment>('appointments'),
        getRows<D.MaternalMeasurement>('maternal_measurements'),
        getRows<D.SymptomReport>('symptom_reports'),
        getRows<D.Task>('tasks'),
        getRows<D.MealEntry>('meal_entries'),
        getRows<{ amount_ml?: number }>('hydration_logs'),
      ])
    const preg = pregnancies.find((p) => p.status === 'ongoing') ?? null
    const week = preg?.lmp ? weekFromLmp(preg.lmp) : CURRENT_WEEK
    const dueDate = preg?.edd ?? ''
    const daysLeft = preg?.edd
      ? Math.round((Date.parse(preg.edd) - Date.now()) / DAY_MS)
      : 0
    const upcoming = appointments
      .filter((a) => new Date(a.scheduled_at).getTime() > Date.now())
      .slice(0, 2)
    const latestWeights = measurements.filter((m) => m.type === 'weight').slice(-2)
    const latestBp = measurements.filter((m) => m.type === 'blood_pressure').slice(-1)
    const ongoing = symptoms.filter((x) => x.ended_at === null)
    const today = todayStr()
    return {
      week,
      trimester: trimesterOf(week),
      dueDate,
      daysLeft,
      taskCount: tasks.length,
      tasksDone: tasks.filter((t) => t.status === 'done').length,
      mealCountToday: meals.filter((m) => m.logged_at.startsWith(today)).length,
      waterLoggedMl: hydration.reduce((acc, r) => acc + (r.amount_ml ?? 0), 0),
      waterGoalMl: 2000,
      upcomingAppointments: upcoming,
      latestMeasurements: [...latestWeights, ...latestBp],
      recentSymptoms: ongoing,
      dailyInsight:
        'Bé đang lớn nhanh — tuần này mẹ chú ý canxi và sắt. Thai máy đều đặn là dấu hiệu tốt.',
    }
  },

  async getMeasurements(): Promise<D.MaternalMeasurement[]> {
    return getRows<D.MaternalMeasurement>('maternal_measurements')
  },

  async getSymptoms(): Promise<D.SymptomReport[]> {
    return getRows<D.SymptomReport>('symptom_reports')
  },

  async getFetalMovementLogs(): Promise<D.FetalMovementLog[]> {
    return getRows<D.FetalMovementLog>('fetal_movement_logs')
  },

  async getAppointments(): Promise<D.Appointment[]> {
    return getRows<D.Appointment>('appointments')
  },

  async addAppointment(input: AppointmentInput): Promise<D.Appointment> {
    return insertRow<D.Appointment>('appointments', {
      private_owner_id: null,
      pregnancy_id: PREG_ID,
      type: input.type,
      scheduled_at: input.scheduled_at,
      location: input.location ?? null,
      doctor: input.doctor ?? null,
      summary_before: input.summary_before ?? null,
      outcome: input.outcome ?? null,
      followup_at: input.followup_at ?? null,
      notes: input.notes ?? null,
      prescription: input.prescription ?? null,
      tasks_after: input.tasks_after ?? null,
    })
  },

  async updateAppointment(id: string, input: AppointmentUpdateInput): Promise<D.Appointment> {
      const { data: existing, error: qErr } = await db().from('appointments').select('*').eq('id', id).maybeSingle()
    if (qErr || !existing) throw new Error('[supabase] Không tìm thấy lịch khám')
    const patch: Record<string, unknown> = {}
    if (input.type !== undefined) patch.type = input.type
    if (input.scheduled_at !== undefined) patch.scheduled_at = input.scheduled_at
    if (input.location !== undefined) patch.location = input.location
    if (input.doctor !== undefined) patch.doctor = input.doctor
    if (input.summary_before !== undefined) patch.summary_before = input.summary_before
    if (input.outcome !== undefined) patch.outcome = input.outcome
    if (input.followup_at !== undefined) patch.followup_at = input.followup_at
    if (input.notes !== undefined) patch.notes = input.notes
    if (input.prescription !== undefined) patch.prescription = input.prescription
    if (input.tasks_after !== undefined) patch.tasks_after = input.tasks_after
    await updateRow('appointments', id, patch)
    return { ...(existing as D.Appointment), ...patch, updated_at: new Date().toISOString() }
  },

  async getDocuments(): Promise<D.DocumentRecord[]> {
    return getRows<D.DocumentRecord>('document_records')
  },

  // ---- Dinh dưỡng ----
  async getMeals(): Promise<D.MealEntry[]> {
    return getRows<D.MealEntry>('meal_entries')
  },

  async getMealsByDate(date: string): Promise<D.MealEntry[]> {
      const { data, error } = await db().from('meal_entries').select('*').gte('logged_at', `${date}T00:00:00+07:00`).lt('logged_at', `${date}T23:59:59+07:00`)
    if (error) throw error
    return (data ?? []) as D.MealEntry[]
  },

  async getNutritionFocus(week: number): Promise<NutritionFocus> {
    // Nội dung tĩnh — dùng computeNutritionFocus (trùng local.ts / mock.ts).
    return computeNutritionFocus(week)
  },

  /** Tổng nước/caffeine hôm nay (giờ VN) từ hydration_logs + caffeine_logs (migration 0009). */
  async getWaterCaffeine(): Promise<WaterCaffeine> {
      const today = todayStr()
    const { data: hydration, error: hErr } = await db()
      .from('hydration_logs')
      .select('amount_ml')
      .gte('logged_at', `${today}T00:00:00+07:00`)
      .lt('logged_at', `${today}T23:59:59+07:00`)
    if (hErr) throw hErr
    const { data: caffeine, error: cErr } = await db()
      .from('caffeine_logs')
      .select('amount_mg')
      .gte('logged_at', `${today}T00:00:00+07:00`)
      .lt('logged_at', `${today}T23:59:59+07:00`)
    if (cErr) throw cErr
    const sum = (rows: { amount_mg?: number; amount_ml?: number }[], key: 'amount_ml' | 'amount_mg') =>
      (rows ?? []).reduce((acc, r) => acc + (r[key] ?? 0), 0)
    return {
      waterGoalMl: 2000,
      waterLoggedMl: sum(hydration as { amount_ml?: number }[], 'amount_ml'),
      caffeineLimitMg: 200,
      caffeineLoggedMg: sum(caffeine as { amount_mg?: number }[], 'amount_mg'),
    }
  },

  async getSupplements(): Promise<D.SupplementPlan[]> {
    return getRows<D.SupplementPlan>('supplement_plans')
  },

  async getSavedMeals(): Promise<D.SavedMeal[]> {
    return getRows<D.SavedMeal>('saved_meals')
  },

  async getNutritionProfile(): Promise<D.NutritionProfile | null> {
    const rows = await getRows<D.NutritionProfile>('nutrition_profiles')
    return rows.find((n) => n.pregnancy_id === PREG_ID) ?? null
  },

  async updateNutritionProfile(input: NutritionProfileInput): Promise<D.NutritionProfile> {
    const rows = await getRows<D.NutritionProfile>('nutrition_profiles')
    const current = rows.find((n) => n.pregnancy_id === PREG_ID)
    const patch: Record<string, unknown> = {}
    if (input.conditions !== undefined) patch.conditions = input.conditions
    if (input.doctor_instructions !== undefined) patch.doctor_instructions = input.doctor_instructions
    if (current) {
      await updateRow('nutrition_profiles', current.id, patch)
      return { ...current, ...patch, updated_at: new Date().toISOString() }
    }
    return insertRow<D.NutritionProfile>('nutrition_profiles', {
      private_owner_id: null,
      pregnancy_id: PREG_ID,
      dietary_pattern: 'omnivore',
      allergies: [],
      dislikes: [],
      budget_per_week: null,
      cook_time_min: null,
      pre_pregnancy_weight_kg: null,
      conditions: input.conditions ?? [],
      doctor_instructions: input.doctor_instructions ?? null,
    })
  },

  // ---- Sau sinh & bé ----
  async getBirthRecord(): Promise<D.BirthRecord | null> {
      const { data, error } = await db().from('birth_records').select('*').order('created_at', { ascending: false }).limit(1)
    if (error) throw error
    return (data?.[0] as D.BirthRecord) ?? null
  },

  async getChildren(): Promise<D.Child[]> {
    return getRows<D.Child>('children')
  },

  async getFeedings(childId: string): Promise<D.FeedingLog[]> {
      const { data, error } = await db().from('feeding_logs').select('*').eq('child_id', childId).order('started_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as D.FeedingLog[]
  },

  async getSleeps(childId: string): Promise<D.SleepLog[]> {
      const { data, error } = await db().from('sleep_logs').select('*').eq('child_id', childId).order('started_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as D.SleepLog[]
  },

  async getDiapers(childId: string): Promise<D.DiaperLog[]> {
      const { data, error } = await db().from('diaper_logs').select('*').eq('child_id', childId).order('changed_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as D.DiaperLog[]
  },

  async getGrowth(childId: string): Promise<GrowthPoint[]> {
    // growth_measurements lưu từng dòng 1 loại (weight/height/head_circumference)
    // → pivot theo ngày thành GrowthPoint {date, weightKg, heightCm, headCm}.
    const rows = await getRows<D.GrowthMeasurement>('growth_measurements')
    const byDate = new Map<string, GrowthPoint>()
    for (const r of rows.filter((r) => r.child_id === childId)) {
      const date = r.measured_at.slice(0, 10)
      const point = byDate.get(date) ?? { date, weightKg: null, heightCm: null, headCm: null }
      if (r.type === 'weight') point.weightKg = r.value
      if (r.type === 'height') point.heightCm = r.value
      if (r.type === 'head_circumference') point.headCm = r.value
      byDate.set(date, point)
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
  },

  async getMilestones(childId: string): Promise<D.Milestone[]> {
      const { data, error } = await db().from('milestones').select('*').eq('child_id', childId)
    if (error) throw error
    return (data ?? []) as D.Milestone[]
  },

  async getVaccinations(childId: string): Promise<D.Vaccination[]> {
      const { data, error } = await db().from('vaccinations').select('*').eq('child_id', childId).order('scheduled_date')
    if (error) throw error
    return (data ?? []) as D.Vaccination[]
  },

  // ---- Phase 7: Sau sinh — mutation (dữ liệu gia đình, shared) ----
  async addBirthRecord(input: BirthRecordInput): Promise<D.BirthRecord> {
    return insertRow<D.BirthRecord>('birth_records', {
      private_owner_id: null,
      pregnancy_id: input.pregnancy_id ?? PREG_ID,
      birth_date: input.birth_date,
      birth_type: input.birth_type,
      hospital: input.hospital ?? null,
      duration_hours: input.duration_hours ?? null,
      complications: input.complications ?? [],
      notes: input.notes ?? null,
    })
  },

  async updateBirthRecord(id: string, input: Partial<BirthRecordInput>): Promise<D.BirthRecord> {
      const { data: existing, error: qErr } = await db().from('birth_records').select('*').eq('id', id).maybeSingle()
    if (qErr || !existing) throw new Error('[supabase] Không tìm thấy bản ghi sinh')
    const patch: Record<string, unknown> = {}
    if (input.pregnancy_id !== undefined) patch.pregnancy_id = input.pregnancy_id
    if (input.birth_date !== undefined) patch.birth_date = input.birth_date
    if (input.birth_type !== undefined) patch.birth_type = input.birth_type
    if (input.hospital !== undefined) patch.hospital = input.hospital
    if (input.duration_hours !== undefined) patch.duration_hours = input.duration_hours
    if (input.complications !== undefined) patch.complications = input.complications
    if (input.notes !== undefined) patch.notes = input.notes
    await updateRow('birth_records', id, patch)
    return { ...(existing as D.BirthRecord), ...patch, updated_at: new Date().toISOString() }
  },

  async addChild(input: ChildInput): Promise<D.Child> {
    return insertRow<D.Child>('children', {
      private_owner_id: null,
      birth_record_id: input.birth_record_id ?? null,
      name: input.name,
      sex: input.sex,
      birth_date: input.birth_date,
      birth_weight_kg: input.birth_weight_kg ?? null,
      birth_length_cm: input.birth_length_cm ?? null,
      head_circumference_cm: input.head_circumference_cm ?? null,
      blood_type: input.blood_type ?? null,
      allergies: input.allergies ?? [],
    })
  },

  async addGrowthPoint(childId: string, input: GrowthPointInput): Promise<GrowthPoint> {
    // growth_measurements lưu 1 dòng / loại (weight/height/head_circumference) —
    // pivot ngược với getGrowth. Chỉ số nào không có → bỏ qua dòng đó.
    const rows: { type: D.GrowthType; value: number; unit: string }[] = []
    if (input.weightKg !== undefined && input.weightKg !== null) rows.push({ type: 'weight', value: input.weightKg, unit: 'kg' })
    if (input.heightCm !== undefined && input.heightCm !== null) rows.push({ type: 'height', value: input.heightCm, unit: 'cm' })
    if (input.headCm !== undefined && input.headCm !== null) rows.push({ type: 'head_circumference', value: input.headCm, unit: 'cm' })
    for (const r of rows) {
      await insertRow('growth_measurements', {
        private_owner_id: null,
        child_id: childId,
        type: r.type,
        value: r.value,
        unit: r.unit,
        measured_at: `${input.date}T00:00:00+07:00`,
        note: null,
        source: 'manual',
      })
    }
    return {
      date: input.date,
      weightKg: input.weightKg ?? null,
      heightCm: input.heightCm ?? null,
      headCm: input.headCm ?? null,
    }
  },

  async addVaccination(childId: string, input: VaccinationInput): Promise<D.Vaccination> {
    return insertRow<D.Vaccination>('vaccinations', {
      private_owner_id: null,
      child_id: childId,
      vaccine_name: input.vaccine_name,
      dose_number: input.dose_number ?? null,
      scheduled_date: input.scheduled_date ?? input.administered_date ?? todayStr(),
      administered_date: input.administered_date ?? null,
      location: input.location ?? null,
      notes: input.notes ?? null,
    })
  },

  // ---- Điều phối gia đình ----
  async getTasks(): Promise<D.Task[]> {
    return getRows<D.Task>('tasks')
  },

  async getShopping(): Promise<D.ShoppingItem[]> {
    return getRows<D.ShoppingItem>('shopping_items')
  },

  async getBudget(): Promise<D.BudgetEntry[]> {
    return getRows<D.BudgetEntry>('budget_entries')
  },

  async addBudget(input: BudgetInput): Promise<D.BudgetEntry> {
    return insertRow<D.BudgetEntry>('budget_entries', {
      private_owner_id: null,
      title: input.title,
      amount: input.amount,
      type: input.type,
      category: input.category ?? null,
      occurred_at: input.occurred_at,
      note: input.note ?? null,
    })
  },

  async updateBudget(id: string, input: BudgetUpdateInput): Promise<D.BudgetEntry> {
      const { data: existing, error: qErr } = await db().from('budget_entries').select('*').eq('id', id).maybeSingle()
    if (qErr || !existing) throw new Error('[supabase] Không tìm thấy khoản thu/chi')
    const patch: Record<string, unknown> = {}
    if (input.title !== undefined) patch.title = input.title
    if (input.amount !== undefined) patch.amount = input.amount
    if (input.type !== undefined) patch.type = input.type
    if (input.category !== undefined) patch.category = input.category
    if (input.occurred_at !== undefined) patch.occurred_at = input.occurred_at
    if (input.note !== undefined) patch.note = input.note
    await updateRow('budget_entries', id, patch)
    return { ...(existing as D.BudgetEntry), ...patch, updated_at: new Date().toISOString() }
  },

  async getReminders(): Promise<D.Reminder[]> {
    return getRows<D.Reminder>('reminders')
  },

  async addReminder(input: ReminderInput): Promise<D.Reminder> {
    return insertRow<D.Reminder>('reminders', {
      private_owner_id: null,
      title: input.title,
      scheduled_at: input.scheduled_at,
      frequency: input.frequency,
      channels: input.channels?.length ? input.channels : ['in_app'],
      active: true,
      last_sent_at: null,
      payload: input.payload ?? null,
    })
  },

  async updateReminder(id: string, input: { active?: boolean }): Promise<D.Reminder> {
      const { data: existing, error: qErr } = await db().from('reminders').select('*').eq('id', id).maybeSingle()
    if (qErr || !existing) throw new Error('[supabase] Không tìm thấy nhắc nhở')
    const patch: Record<string, unknown> = {}
    if (input.active !== undefined) patch.active = input.active
    await updateRow('reminders', id, patch)
    return { ...(existing as D.Reminder), ...patch, updated_at: new Date().toISOString() }
  },

  async getNotificationPreferences(): Promise<D.NotificationPreference[]> {
    return getRows<D.NotificationPreference>('notification_preferences')
  },

  // ---- Gia đình (Phase 4B) ----
  async getFamilyMembers(): Promise<FamilyMemberView[]> {
      const family_id = await currentFamilyId()
    const { data, error } = await db()
      .from('family_members')
      .select('user_id, role')
      .eq('family_id', family_id)
    if (error) throw error
    return (data ?? []).map((m) => ({
      user_id: m.user_id as string,
      name: null,
      email: '',
      role: (m.role === 'owner' ? 'owner' : 'member') as FamilyMemberView['role'],
    }))
  },

  async getFamilyCode(): Promise<string | null> {
    const family_id = await currentFamilyId()
    const { data, error } = await db()
      .from('families')
      .select('code')
      .eq('id', family_id)
      .maybeSingle()
    if (error) throw error
    return (data?.code as string | null | undefined) ?? null
  },

  async setNotificationPreference(input: { group: D.NotificationGroup; channel: D.NotificationChannel; enabled: boolean }): Promise<void> {
    const family_id = await currentFamilyId()
    const { data: existing } = await db().from('notification_preferences').select('id').eq('family_id', family_id).eq('group', input.group).eq('channel', input.channel).maybeSingle()
    if (existing) {
      const { error } = await db().from('notification_preferences').update({ enabled: input.enabled }).eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await db().from('notification_preferences').insert({
        family_id,
        private_owner_id: null,
        group: input.group,
        channel: input.channel,
        enabled: input.enabled,
      } as never)
      if (error) throw error
    }
  },

  // ---- Nội dung & học cùng con ----
  async getWeeklyGuides(): Promise<D.WeeklyGuide[]> {
    return getRows<D.WeeklyGuide>('weekly_guides')
  },

  async getArticles(): Promise<D.Article[]> {
    return getRows<D.Article>('articles')
  },

  async getQuizSets(): Promise<D.QuizSet[]> {
    return getRows<D.QuizSet>('quiz_sets')
  },

  async getQuizQuestions(quizSetId: string): Promise<D.QuizQuestion[]> {
      const { data, error } = await db().from('quiz_questions').select('*').eq('quiz_set_id', quizSetId)
    if (error) throw error
    return (data ?? []) as D.QuizQuestion[]
  },

  async getKnowledgeSources(): Promise<D.KnowledgeSource[]> {
    return getRows<D.KnowledgeSource>('knowledge_sources')
  },

  async getChatMessages(sessionId: string): Promise<D.ChatMessage[]> {
      const { data, error } = await db().from('chat_messages').select('*').eq('session_id', sessionId).order('created_at')
    if (error) throw error
    return (data ?? []) as D.ChatMessage[]
  },

  // ---- Phase 6: Condition plans / measurements ----
  async getConditionPlans(): Promise<D.ConditionPlan[]> {
    return getRows<D.ConditionPlan>('condition_plans')
  },

  async addConditionPlan(input: ConditionPlanInput): Promise<D.ConditionPlan> {
    return insertRow<D.ConditionPlan>('condition_plans', {
      private_owner_id: null,
      condition_type: input.condition_type,
      plan_text: input.plan_text,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      doctor_notes: input.doctor_notes ?? null,
    })
  },

  async getConditionMeasurements(): Promise<D.ConditionMeasurement[]> {
    return getRows<D.ConditionMeasurement>('condition_measurements')
  },

  async addConditionMeasurement(input: ConditionMeasurementInput): Promise<D.ConditionMeasurement> {
    return insertRow<D.ConditionMeasurement>('condition_measurements', {
      private_owner_id: null,
      condition_plan_id: input.condition_plan_id,
      type: input.type,
      value: input.value,
      unit: input.unit,
      measured_at: input.measured_at,
      note: input.note ?? null,
    })
  },

  // ---- Phase 6: Knowledge retrieval (chunks) ----
  async searchKnowledgeChunks(query: string): Promise<D.KnowledgeChunk[]> {
      const q = query.trim()
    if (!q) return []
    // ponytail: ilike đơn giản — khi Agent 5 nối embedding thật thì chuyển sang
    // pgvector (rpc). Giữ giới hạn 50 kết quả.
    const { data, error } = await db()
      .from('knowledge_chunks')
      .select('*')
      .or(`content.ilike.%${q}%,citation.ilike.%${q}%`)
      .order('position', { ascending: true })
      .limit(50)
    if (error) throw error
    return (data ?? []) as D.KnowledgeChunk[]
  },

  async saveKnowledgeChunks(sourceId: string, chunks: KnowledgeChunkInput[]): Promise<void> {
      const family_id = await currentFamilyId()
    const {
      data: { user },
    } = await db().auth.getUser()
    const { error } = await db().from('knowledge_chunks').insert(
      chunks.map((c) => ({
        family_id,
        private_owner_id: user?.id ?? null,
        knowledge_source_id: sourceId,
        content: c.content,
        citation: c.citation,
        position: c.position,
        embedding: c.embedding ?? null,
      })) as never,
    )
    if (error) throw error
  },

  // ---- Phase 6: Content versions ----
  async getContentVersions(
    contentType: D.ContentVersion['content_type'],
    contentId: string,
  ): Promise<D.ContentVersion[]> {
      const { data, error } = await db()
      .from('content_versions')
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('version', { ascending: false })
    if (error) throw error
    return (data ?? []) as D.ContentVersion[]
  },

  // ---- Phase 6J: Theo dõi dinh dưỡng hằng ngày ----
  async addDailyIntake(input: DailyIntakeInput): Promise<DailyIntakeLog> {
      const {
      data: { user },
    } = await db().auth.getUser()
    const ownerId = user?.id ?? null
    // `items` là quan hệ con — KHÔNG insert vào cột log (bảng daily_intake_logs không có cột items).
    const log = await insertRow<DailyIntakeLog>('daily_intake_logs', {
      private_owner_id: ownerId,
      date: input.date,
      note: input.note ?? null,
    })
    const items: DailyIntakeItem[] = []
    for (const it of input.items) {
      const item = await insertRow<DailyIntakeItem>('intake_items', {
        private_owner_id: ownerId,
        log_id: log.id,
        kind: it.kind,
        name: it.name,
        ref_id: it.ref_id ?? null,
        amount_g: it.amount_g ?? null,
        qty: it.qty ?? null,
        dose_mg: it.dose_mg ?? null,
        pills: it.pills ?? null,
        nutrients: it.nutrients ?? {},
        estimated: it.estimated ?? false,
        note: it.note ?? null,
      })
      items.push(item)
    }
    return { ...log, items }
  },

  async getDailyIntake(id: string): Promise<DailyIntakeLog | null> {
      const { data: log, error } = await db().from('daily_intake_logs').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!log) return null
    const { data: items, error: iErr } = await db()
      .from('intake_items')
      .select('*')
      .eq('log_id', (log as { id: string }).id)
      .order('created_at', { ascending: true })
    if (iErr) throw iErr
    return { ...(log as DailyIntakeLog), items: (items ?? []) as DailyIntakeItem[] }
  },

  async listIntakeHistory(limit = 30): Promise<DailyIntakeLog[]> {
      const { data: logs, error } = await db()
      .from('daily_intake_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)
    if (error) throw error
    const out: DailyIntakeLog[] = []
    for (const log of logs ?? []) {
      const { data: items } = await db()
        .from('intake_items')
        .select('*')
        .eq('log_id', (log as { id: string }).id)
        .order('created_at', { ascending: true })
      out.push({ ...(log as DailyIntakeLog), items: (items ?? []) as DailyIntakeItem[] })
    }
    return out
  },

  async getNutrientSummary(period: { from: string; to: string }): Promise<NutrientSummary> {
      const { data: logs, error } = await db()
      .from('daily_intake_logs')
      .select('*')
      .gte('date', period.from)
      .lte('date', period.to)
      .order('date', { ascending: true })
    if (error) throw error
    const days: { date: string; nutrients: NutrientValueMap; itemCount: number }[] = []
    for (const log of logs ?? []) {
      const l = log as { id: string; date: string }
      const { data: items, error: iErr } = await db().from('intake_items').select('*').eq('log_id', l.id)
      if (iErr) throw iErr
      const itemList = (items ?? []) as DailyIntakeItem[]
      days.push({ date: l.date, nutrients: aggregateNutrients(itemList), itemCount: itemList.length })
    }
    const preg = await this.getPregnancy()
    const week = preg?.lmp ? weekFromLmp(preg.lmp) : null
    return buildNutrientSummary(period.from, period.to, days, week)
  },

  // ---- Phase 7: Hồ sơ khám (medical visits) — PER-USER ----
  async getMedicalVisits(): Promise<MedicalVisit[]> {
      const { data, error } = await db()
      .from('medical_visits')
      .select('*')
      .order('visit_date', { ascending: false })
    if (error) throw error
    return (data ?? []) as MedicalVisit[]
  },

  async addMedicalVisit(input: MedicalVisitInput): Promise<MedicalVisit> {
      const {
      data: { user },
    } = await db().auth.getUser()
    return insertRow<MedicalVisit>('medical_visits', {
      private_owner_id: user?.id ?? null,
      visit_date: input.visit_date,
      clinic: input.clinic ?? null,
      reason: input.reason ?? null,
      notes: input.notes ?? null,
      child_id: input.child_id ?? null,
      pregnancy_id: input.pregnancy_id ?? null,
    })
  },

  async getVisitDocuments(visitId: string): Promise<VisitDocument[]> {
      const { data, error } = await db()
      .from('visit_documents')
      .select('*')
      .eq('visit_id', visitId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as VisitDocument[]
  },

  async addVisitDocument(visitId: string, input: VisitDocumentInput): Promise<VisitDocument> {
      const {
      data: { user },
    } = await db().auth.getUser()
    return insertRow<VisitDocument>('visit_documents', {
      private_owner_id: user?.id ?? null,
      visit_id: visitId,
      filename: input.filename,
      mime: input.mime,
      image_data: input.imageDataUrl,
      ocr_text: input.ocrText ?? null,
    })
  },

  // ---- Mutation ----
  async addMeal(entry: { meal_type: D.MealType; name: string; logged_at: string; calories?: number; note?: string }): Promise<D.MealEntry> {
    return insertRow<D.MealEntry>('meal_entries', {
      private_owner_id: null,
      meal_type: entry.meal_type,
      name: entry.name,
      logged_at: entry.logged_at,
      calories: entry.calories ?? null,
      note: entry.note ?? null,
      source: 'manual',
    })
  },

  /** Ghi record ảnh bữa ăn — ảnh đã upload storage (bucket `meal-photos`) trước đó. */
  async addMealPhoto(input: MealPhotoInput): Promise<D.MealPhoto> {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '') ?? ''
    const storage_path = input.storage_path ?? `uploads/${input.file_name}`
    const file_url = storage_path.startsWith('http')
      ? storage_path
      : `${base}/storage/v1/object/public/meal-photos/${storage_path}`
    return insertRow<D.MealPhoto>('meal_photos', {
      private_owner_id: null,
      meal_id: input.meal_id,
      file_url,
      ai_suggested_name: null,
      confirmed: true,
      confirmed_by: null,
    })
  },

  /**
   * Đồng bộ mẫu HealthKit (iOS). Dedupe theo source='healthkit' + type + taken_at
   * (so epoch ms) → bỏ qua bản ghi đã có, KHÔNG ghi đè dữ liệu nguồn manual/document.
   */
  async upsertHealthMetric(rows: HealthMetricInput[]): Promise<{ created: D.MaternalMeasurement[]; duplicates: number }> {
      if (rows.length === 0) return { created: [], duplicates: 0 }
    const family_id = await currentFamilyId()

    const { data: existing, error: qErr } = await db()
      .from('maternal_measurements')
      .select('type, taken_at')
      .eq('source', 'healthkit')
    if (qErr) throw qErr

    const existingKeys = new Set(
      (existing ?? []).map((r) => healthMetricKey({ type: r.type as D.MeasurementType, taken_at: r.taken_at as string })),
    )
    const { kept, duplicates } = dedupeHealthMetrics(rows, existingKeys)
    if (kept.length === 0) return { created: [], duplicates }

    const pregnancy = await this.getPregnancy()
    const pregnancy_id = pregnancy?.id ?? PREG_ID

    // ponytail: insert lần lượt — batch insert supabase-js chưa cấu hình generic schema;
    // payload iOS tối đa 1000 mẫu, dedupe xong thường ít.
    const created: D.MaternalMeasurement[] = []
    for (const r of kept) {
      const { data, error } = await db().from('maternal_measurements').insert({
        family_id,
        private_owner_id: null,
        pregnancy_id,
        type: r.type,
        value: r.value,
        unit: r.unit,
        diastolic: r.diastolic ?? null,
        taken_at: r.taken_at,
        note: null,
        source: 'healthkit',
      } as never).select().single()
      if (error) throw error
      created.push(data as D.MaternalMeasurement)
    }
    return { created, duplicates }
  },

  async addMeasurement(m: { type: D.MeasurementType; value: number; unit: string; diastolic?: number; taken_at: string; note?: string }): Promise<D.MaternalMeasurement> {
    return insertRow<D.MaternalMeasurement>('maternal_measurements', {
      private_owner_id: null,
      pregnancy_id: PREG_ID,
      type: m.type,
      value: m.value,
      unit: m.unit,
      diastolic: m.diastolic ?? null,
      taken_at: m.taken_at,
      note: m.note ?? null,
      source: 'manual',
    })
  },

  async addSymptom(s: { symptom: string; severity: D.SymptomSeverity; started_at: string; note?: string }): Promise<D.SymptomReport> {
    return insertRow<D.SymptomReport>('symptom_reports', {
      private_owner_id: null,
      pregnancy_id: PREG_ID,
      symptom: s.symptom,
      severity: s.severity,
      started_at: s.started_at,
      ended_at: null,
      note: s.note ?? null,
      source: 'manual',
    })
  },

  /** Import hàng loạt triệu chứng (tối đa 100) — insert nhiều dòng, RLS tự lọc theo family. */
  async importSymptoms(items: SymptomReportInput[]): Promise<{ created: number }> {
    const family_id = await currentFamilyId()
    const rows = items.map((s) => ({
      family_id,
      private_owner_id: null,
      pregnancy_id: PREG_ID,
      symptom: s.symptom,
      severity: s.severity,
      started_at: s.started_at,
      ended_at: null,
      note: s.note ?? null,
      source: 'manual',
    }))
    // `ponytail:` cast qua never — chưa gắn Database type; bỏ khi cấu hình generic.
    const { error } = await db().from('symptom_reports').insert(rows as never)
    if (error) throw error
    return { created: items.length }
  },

  async addTask(t: { title: string; due_date?: string | null; assignee_id?: string | null }): Promise<D.Task> {
    return insertRow<D.Task>('tasks', {
      private_owner_id: null,
      title: t.title,
      description: null,
      status: 'todo',
      due_date: t.due_date ?? null,
      assignee_id: t.assignee_id ?? null,
      completed_at: null,
      reminder_id: null,
    })
  },

  async toggleTask(id: string, done: boolean): Promise<void> {
    await updateRow('tasks', id, { status: done ? 'done' : 'todo', completed_at: done ? new Date().toISOString() : null })
  },

  // ---- Mutation mở rộng ----
  async startPregnancy(input: { lmp: string; edd?: string | null; fetalCount?: number }): Promise<D.Pregnancy> {
    const pregnancy = await insertRow<D.Pregnancy>('pregnancies', {
      private_owner_id: null,
      lmp: input.lmp,
      edd: input.edd ?? eddFromLmp(input.lmp),
      status: 'ongoing',
      notes: null,
      source: 'manual',
    })
    // Đa thai: fetalCount 1–3 → tự tạo N fetus (birth_order 1..N, name A/B/C).
    const count = Math.min(3, Math.max(1, input.fetalCount ?? 1))
    for (let i = 1; i <= count; i++) {
      await insertRow<D.Fetus>('fetuses', {
        private_owner_id: null,
        pregnancy_id: pregnancy.id,
        name: count > 1 ? String.fromCharCode(64 + i) : null,
        sex: 'unknown',
        birth_order: i,
        notes: null,
      })
    }
    return pregnancy
  },

  async addFetus(input: FetusInput): Promise<D.Fetus> {
    const pregnancy = await this.getPregnancy()
    const pregnancy_id = pregnancy?.id ?? PREG_ID
    const rows = await getRows<D.Fetus>('fetuses')
    const order = input.birth_order ?? Math.max(0, ...rows.filter((f) => f.pregnancy_id === pregnancy_id).map((f) => f.birth_order)) + 1
    return insertRow<D.Fetus>('fetuses', {
      private_owner_id: null,
      pregnancy_id,
      name: input.name ?? (order > 1 ? String.fromCharCode(64 + order) : null),
      sex: input.sex ?? 'unknown',
      birth_order: order,
      notes: input.notes ?? null,
    })
  },

  /** Cập nhật thai kỳ hiện tại: đổi LMP/EDD theo Naegele (chỉ nhập một trong hai → tái tính cái còn lại). */
  async updatePregnancy(input: PregnancyUpdateInput): Promise<D.Pregnancy> {
    const rows = await getRows<D.Pregnancy>('pregnancies')
    const current = rows.find((p) => p.status === 'ongoing')
    if (!current) throw new Error('[supabase] Không tìm thấy thai kỳ hiện tại')
    if (input.lmp && input.edd && input.edd <= input.lmp) {
      throw new Error('Ngày dự sinh (EDD) phải sau ngày đầu kỳ kinh cuối (LMP)')
    }
    let { lmp, edd, notes } = current
    if (input.lmp) lmp = input.lmp
    if (input.edd) edd = input.edd
    if (input.lmp && !input.edd) edd = eddFromLmp(input.lmp)
    if (input.edd && !input.lmp) lmp = lmpFromEdd(input.edd)
    if (input.notes !== undefined) notes = input.notes
    await updateRow('pregnancies', current.id, { lmp, edd, notes })
    return { ...current, lmp, edd, notes, updated_at: new Date().toISOString() }
  },

  /** Cập nhật hồ sơ sức khỏe cá nhân của thai kỳ hiện tại (health_profiles). */
  async updateHealthProfile(input: HealthProfileUpdateInput): Promise<D.HealthProfile> {
    const rows = await getRows<D.HealthProfile>('health_profiles')
    const current = rows.find((h) => h.pregnancy_id === PREG_ID)
    if (!current) throw new Error('[supabase] Không tìm thấy hồ sơ sức khỏe')
    const patch: Record<string, unknown> = {}
    if (input.height_cm !== undefined) patch.height_cm = input.height_cm
    if (input.pre_pregnancy_weight_kg !== undefined) patch.pre_pregnancy_weight_kg = input.pre_pregnancy_weight_kg
    if (input.blood_type !== undefined) patch.blood_type = input.blood_type
    if (input.allergies !== undefined) patch.allergies = input.allergies
    if (input.preexisting_conditions !== undefined) patch.preexisting_conditions = input.preexisting_conditions
    if (input.notes !== undefined) patch.notes = input.notes
    await updateRow('health_profiles', current.id, patch)
    return { ...current, ...patch, updated_at: new Date().toISOString() }
  },

  async addFeeding(
    childId: string,
    input: { method: D.FeedingMethod; amount_ml?: number | null; started_at: string; duration_min?: number | null; side?: D.FeedingSide | null; note?: string },
  ): Promise<D.FeedingLog> {
    return insertRow<D.FeedingLog>('feeding_logs', {
      private_owner_id: null,
      child_id: childId,
      method: input.method,
      side: input.side ?? null,
      amount_ml: input.amount_ml ?? null,
      started_at: input.started_at,
      duration_min: input.duration_min ?? null,
      note: input.note ?? null,
      source: 'manual',
    })
  },

  async addSleep(
    childId: string,
    input: { started_at: string; ended_at?: string | null; place: D.SleepPlace; note?: string },
  ): Promise<D.SleepLog> {
    return insertRow<D.SleepLog>('sleep_logs', {
      private_owner_id: null,
      child_id: childId,
      started_at: input.started_at,
      ended_at: input.ended_at ?? null,
      place: input.place,
      note: input.note ?? null,
    })
  },

  async addDiaper(childId: string, input: { changed_at: string; type: D.DiaperType; note?: string }): Promise<D.DiaperLog> {
    return insertRow<D.DiaperLog>('diaper_logs', {
      private_owner_id: null,
      child_id: childId,
      changed_at: input.changed_at,
      type: input.type,
      note: input.note ?? null,
    })
  },

  async addFetalMovement(input: { felt_at: string; feeling: D.FetalMovementFeeling; duration_min?: number | null; note?: string }): Promise<D.FetalMovementLog> {
    return insertRow<D.FetalMovementLog>('fetal_movement_logs', {
      private_owner_id: null,
      pregnancy_id: PREG_ID,
      felt_at: input.felt_at,
      feeling: input.feeling,
      duration_min: input.duration_min ?? null,
      note: input.note ?? null,
    })
  },

  async addWater(input: { logged_at: string; amount_ml: number }): Promise<void> {
    await insertRow('hydration_logs', {
      private_owner_id: null,
      logged_at: input.logged_at,
      amount_ml: input.amount_ml,
      source: 'manual',
    })
  },

  async addShoppingItem(input: { name: string; category?: string | null; quantity?: number | null; unit?: string | null; estimated_price?: number | null }): Promise<D.ShoppingItem> {
    return insertRow<D.ShoppingItem>('shopping_items', {
      private_owner_id: null,
      name: input.name,
      category: input.category ?? null,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      estimated_price: input.estimated_price ?? null,
      actual_price: null,
      status: 'pending',
      note: null,
    })
  },

  async toggleShopping(id: string, done: boolean): Promise<void> {
    await updateRow('shopping_items', id, { status: done ? 'bought' : 'pending' })
  },

  async deleteShoppingItem(id: string): Promise<void> {
      const { error } = await db().from('shopping_items').delete().eq('id', id)
    if (error) throw error
  },

  async updateShoppingItem(id: string, input: ShoppingItemUpdateInput): Promise<D.ShoppingItem> {
      const { data: existing, error: qErr } = await db().from('shopping_items').select('*').eq('id', id).maybeSingle()
    if (qErr || !existing) throw new Error('[supabase] Không tìm thấy món cần mua')
    const patch: Record<string, unknown> = {}
    if (input.name !== undefined) patch.name = input.name
    if (input.category !== undefined) patch.category = input.category
    if (input.estimated_price !== undefined) patch.estimated_price = input.estimated_price
    if (input.note !== undefined) patch.note = input.note
    if (input.done !== undefined) patch.status = input.done ? 'bought' : 'pending'
    await updateRow('shopping_items', id, patch)
    return { ...(existing as D.ShoppingItem), ...patch, updated_at: new Date().toISOString() }
  },

  async addMealToShopping(meal: D.SavedMeal): Promise<D.ShoppingItem[]> {
    const family_id = await currentFamilyId()
    const rows = (meal.ingredients ?? []).map((ingredient) => ({
      family_id,
      private_owner_id: null,
      name: ingredient.trim(),
      category: 'Nguyên liệu',
      quantity: 1,
      unit: null,
      estimated_price: null,
      actual_price: null,
      status: 'pending',
      note: `Món: ${meal.name}`,
    }))
    // ponytail: insert lần lượt — batch insert chưa cấu hình generic schema.
    const created: D.ShoppingItem[] = []
    for (const r of rows) {
      const { data, error } = await db().from('shopping_items').insert(r as never).select().single()
      if (error) throw error
      created.push(data as D.ShoppingItem)
    }
    return created
  },

  async addMilestone(childId: string, input: { name: string; stage?: string | null; status: D.MilestoneStatus; achieved_at?: string | null; note?: string }): Promise<D.Milestone> {
    return insertRow<D.Milestone>('milestones', {
      private_owner_id: null,
      child_id: childId,
      name: input.name,
      stage: input.stage ?? null,
      achieved_at: input.achieved_at ?? null,
      status: input.status,
      note: input.note ?? null,
    })
  },

  // Xóa family (cascade mọi bảng gia đình qua FK); policy `families_delete` chỉ owner.
  async deleteFamilyData(): Promise<void> {
      const family_id = await currentFamilyId()
    const { error } = await db().from('families').delete().eq('id', family_id)
    if (error) throw error
  },
}

export const supabaseApi: DataApi = supabaseImpl
