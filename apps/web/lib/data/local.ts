// ===========================================================================
// Local data layer — DataApi trên SQLite (server-side). SERVER-ONLY.
//
// - Đọc/ghi qua `lib/db/local.ts` (singleton node:sqlite). Mutations persist
//   ngay (INSERT/UPDATE/DELETE). Seed = mock.ts (DB rỗng → seed y hệt mock).
// - Lọc privacy/family bằng SQL (`family_id = ?`, `private_owner_id IS NULL OR
//   = activeUser`); KHÔNG active user → trả toàn bộ (tương thích ngược, 62 smoke).
// - Port logic từ mock.ts: cùng hành vi, cùng trả tiếng Việt.
//
// KHÔNG import vào client component (node:sqlite chỉ server-side). Client dùng
// `lib/data/client.ts` (proxy fetch → các route /api/v1).
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
  DataApi,
  DashboardSummary,
  FetusInput,
  GrowthPoint,
  GrowthPointInput,
  KnowledgeChunkInput,
  MealEntryInput,
  MealPhotoInput,
  MeasurementInput,
  MedicalVisit,
  MedicalVisitInput,
  NutritionFocus,
  NutritionProfileInput,
  NutrientSummary,
  ReminderInput,
  ShoppingItemUpdateInput,
  SymptomReportInput,
  TaskInput,
  VaccinationInput,
  VisitDocument,
  VisitDocumentInput,
  WaterCaffeine,
  WeekInfo,
} from './api'
import { aggregateNutrients, buildNutrientSummary } from '../nutrition/intake-calcs'
import { getActiveUser } from '../auth/active-user'
import { libraryStore } from '../library/store'
import { dedupeHealthMetrics, healthMetricKey, type HealthMetricInput } from '../health-sync'
import {
  insertRow,
  updateRow,
  deleteRow,
  deleteRows,
  listRows,
  findRow,
  dbMembersForFamily,
  dbUserById,
  dbFamilyById,
} from '../db/local'
import {
  FAMILY_ID,
  PREG_ID,
  HEALTH_ID,
  WEEKS,
  REAL_TODAY,
  CURRENT_WEEK,
  EDD,
  DAYS_LEFT,
  visible,
  eddFromLmp,
  lmpFromEdd,
  weekFromLmp,
  trimesterOf,
  computeNutritionFocus,
} from './mock'

const uid = (): string => crypto.randomUUID()
const DAY_MS = 86_400_000

// ---------------------------------------------------------------------------
// Scope — active user (bridge từ POST /api/v1/auth/sync + active-user.ts).
// KHÔNG active user → không lọc gì (trả toàn bộ — tương thích ngược).
// ---------------------------------------------------------------------------

interface ScopeOpts {
  familyId?: string
  privateId?: string
}

function scope(): ScopeOpts {
  const au = getActiveUser()
  if (!au) return {}
  return { familyId: au.family_id || undefined, privateId: au.user_id }
}

function myFamilyId(): string {
  return getActiveUser()?.family_id || FAMILY_ID
}

function myOwnerId(): string | null {
  return getActiveUser()?.user_id ?? null
}

/** Pregnancy id của active family (fallback PREG_ID demo) — để row mới gắn đúng thai kỳ.
 * Ưu tiên thai kỳ ongoing thuộc family hiện tại; nếu không có (vd sau sinh) fallback
 * PREG_ID seed demo + log cảnh báo để trace (mutation mới sẽ gắn vào thai kỳ demo). */
function currentPregnancyId(): string {
  const au = getActiveUser()
  const opts = au?.family_id ? { familyId: au.family_id } : {}
  const preg = listRows<D.Pregnancy>('pregnancies', opts).find((p) => p.status === 'ongoing')
  if (!preg) {
    console.warn(
      '[local] currentPregnancyId: không có thai kỳ ongoing cho family hiện tại — fallback PREG_ID demo (mutation mới gắn vào thai kỳ demo).',
    )
    return PREG_ID
  }
  return preg.id
}

/** Tổng nước đã uống HÔM NAY (lọc theo logged_at prefix REAL_TODAY) — tránh phình theo
 * toàn lịch sử khi SQLite bền vững. Bám mock.ts: seed 1400 = "hôm nay". */
function waterToday(): number {
  return listRows<D.HydrationLog>('hydration_logs', { ...scope(), prefix: { logged_at: REAL_TODAY } }).reduce(
    (sum, l) => sum + (l.amount_ml ?? 0),
    0,
  )
}

// ---------------------------------------------------------------------------
// Impl DataApi — SQLite
// ---------------------------------------------------------------------------

const localImpl = {
  // ---- Thai kỳ & sức khỏe ----
  async getPregnancy(): Promise<D.Pregnancy | null> {
    return listRows<D.Pregnancy>('pregnancies', scope()).find((p) => p.status === 'ongoing') ?? null
  },

  async getFetuses(): Promise<D.Fetus[]> {
    return listRows<D.Fetus>('fetuses', scope())
  },

  async getWeekInfo(week: number): Promise<WeekInfo> {
    const clamped = Math.min(41, Math.max(0, week))
    return { ...WEEKS[clamped]! }
  },

  async getDashboard(): Promise<DashboardSummary> {
    const s = scope()
    const au = getActiveUser()
    const opts = au?.family_id ? { familyId: au.family_id } : {}
    // "Sắp tới" lọc theo thời điểm thật (giờ VN) — không đứng yên theo DEMO_NOW cố định.
    const nowIso = new Date().toISOString()
    const upcoming = listRows<D.Appointment>('appointments', s)
      .filter((a) => a.scheduled_at > nowIso)
      .slice(0, 2)
    const measurements = listRows<D.MaternalMeasurement>('maternal_measurements', s)
    const latestWeights = measurements.filter((m) => m.type === 'weight').slice(-2)
    const latestBp = measurements.filter((m) => m.type === 'blood_pressure').slice(-1)
    const ongoing = listRows<D.SymptomReport>('symptom_reports', s).filter((x) => x.ended_at === null)
    const preg = listRows<D.Pregnancy>('pregnancies', opts).find((p) => p.status === 'ongoing')
    const week = preg?.lmp ? weekFromLmp(preg.lmp) : CURRENT_WEEK
    const dueDate = preg?.edd ?? EDD
    // daysLeft theo ngày thật (REAL_TODAY, giờ VN) — bộ đếm tự trôi, không đứng yên theo TODAY.
    const daysLeft = preg?.edd ? Math.round((Date.parse(preg.edd) - Date.parse(REAL_TODAY)) / DAY_MS) : DAYS_LEFT
    const tasks = listRows<D.Task>('tasks', s)
    const meals = listRows<D.MealEntry>('meal_entries', s)
    return {
      week,
      trimester: trimesterOf(week),
      dueDate,
      daysLeft,
      taskCount: tasks.length,
      tasksDone: tasks.filter((t) => t.status === 'done').length,
      mealCountToday: meals.filter((m) => m.logged_at.startsWith(REAL_TODAY)).length,
      waterLoggedMl: waterToday(),
      waterGoalMl: 2000,
      upcomingAppointments: upcoming,
      latestMeasurements: [...latestWeights, ...latestBp],
      recentSymptoms: ongoing,
      dailyInsight: 'Bé đang lớn nhanh — tuần này mẹ chú ý canxi và sắt. Thai máy đều đặn là dấu hiệu tốt.',
    }
  },

  async getMeasurements(): Promise<D.MaternalMeasurement[]> {
    return listRows<D.MaternalMeasurement>('maternal_measurements', scope())
  },

  async getSymptoms(): Promise<D.SymptomReport[]> {
    return listRows<D.SymptomReport>('symptom_reports', scope())
  },

  async getFetalMovementLogs(): Promise<D.FetalMovementLog[]> {
    return listRows<D.FetalMovementLog>('fetal_movement_logs', scope())
  },

  async getAppointments(): Promise<D.Appointment[]> {
    return listRows<D.Appointment>('appointments', scope())
  },

  async addAppointment(input: AppointmentInput): Promise<D.Appointment> {
    const now = new Date().toISOString()
    const created: D.Appointment = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      pregnancy_id: currentPregnancyId(),
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
    }
    insertRow('appointments', created as unknown as Record<string, unknown>)
    return created
  },

  async updateAppointment(id: string, input: AppointmentUpdateInput): Promise<D.Appointment> {
    const existing = findRow<D.Appointment>('appointments', id)
    if (!existing) throw new Error('Không tìm thấy lịch khám')
    const patch: Partial<D.Appointment> = {}
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
    return updateRow('appointments', id, patch)!
  },

  async getDocuments(): Promise<D.DocumentRecord[]> {
    return listRows<D.DocumentRecord>('documents', scope())
  },

  // ---- Dinh dưỡng ----
  async getMeals(): Promise<D.MealEntry[]> {
    return listRows<D.MealEntry>('meal_entries', scope())
  },

  async getMealsByDate(date: string): Promise<D.MealEntry[]> {
    return listRows<D.MealEntry>('meal_entries', { ...scope(), prefix: { logged_at: date } })
  },

  async getNutritionFocus(week: number): Promise<NutritionFocus> {
    return computeNutritionFocus(week)
  },

  async getWaterCaffeine(): Promise<WaterCaffeine> {
    return {
      waterGoalMl: 2000,
      waterLoggedMl: waterToday(),
      caffeineLimitMg: 200,
      caffeineLoggedMg: 0,
    }
  },

  async getSupplements(): Promise<D.SupplementPlan[]> {
    return listRows<D.SupplementPlan>('supplement_plans', scope())
  },

  async getSavedMeals(): Promise<D.SavedMeal[]> {
    return listRows<D.SavedMeal>('saved_meals', scope())
  },

  async getNutritionProfile(): Promise<D.NutritionProfile | null> {
    return listRows<D.NutritionProfile>('nutrition_profiles', scope()).find((n) => n.pregnancy_id === currentPregnancyId()) ?? null
  },

  async updateNutritionProfile(input: NutritionProfileInput): Promise<D.NutritionProfile> {
    const now = new Date().toISOString()
    const pregId = currentPregnancyId()
    let np = listRows<D.NutritionProfile>('nutrition_profiles', scope()).find((n) => n.pregnancy_id === pregId)
    if (!np) {
      // Tạo hồ sơ mới — áp ngay input.conditions/doctor_instructions (fix: trước đây tạo
      // rỗng rồi return, bỏ qua input → lần đầu khai báo tình trạng đặc biệt không lưu).
      np = {
        id: uid(),
        family_id: myFamilyId(),
        private_owner_id: null,
        created_at: now,
        updated_at: now,
        pregnancy_id: pregId,
        dietary_pattern: 'omnivore',
        allergies: [],
        dislikes: [],
        budget_per_week: null,
        cook_time_min: null,
        pre_pregnancy_weight_kg: null,
        conditions: input.conditions ?? [],
        doctor_instructions: input.doctor_instructions ?? null,
      }
      insertRow('nutrition_profiles', np as unknown as Record<string, unknown>)
      return np
    }
    const patch: Partial<D.NutritionProfile> = {}
    if (input.conditions !== undefined) patch.conditions = input.conditions
    if (input.doctor_instructions !== undefined) patch.doctor_instructions = input.doctor_instructions
    return updateRow('nutrition_profiles', np.id, patch as Partial<D.NutritionProfile>)!
  },

  // ---- Sau sinh & bé ----
  async getBirthRecord(): Promise<D.BirthRecord | null> {
    // Mới nhất trước — addBirthRecord (mutation Phase 7) phải thấy ngay.
    return (
      listRows<D.BirthRecord>('birth_records', { ...scope(), orderBy: 'created_at', desc: true })[0] ?? null
    )
  },

  async getChildren(): Promise<D.Child[]> {
    return listRows<D.Child>('children', scope())
  },

  async getFeedings(childId: string): Promise<D.FeedingLog[]> {
    return listRows<D.FeedingLog>('feeding_logs', { ...scope(), where: { child_id: childId } })
  },

  async getSleeps(childId: string): Promise<D.SleepLog[]> {
    return listRows<D.SleepLog>('sleep_logs', { ...scope(), where: { child_id: childId } })
  },

  async getDiapers(childId: string): Promise<D.DiaperLog[]> {
    return listRows<D.DiaperLog>('diaper_logs', { ...scope(), where: { child_id: childId } })
  },

  async getGrowth(childId: string): Promise<GrowthPoint[]> {
    return listRows<GrowthPoint>('growth_points', { ...scope(), where: { child_id: childId } }).map(
      (g) => ({
        date: (g as unknown as Record<string, unknown>).date as string,
        weightKg: (g as unknown as Record<string, unknown>).weightKg as number | null | undefined,
        heightCm: (g as unknown as Record<string, unknown>).heightCm as number | null | undefined,
        headCm: (g as unknown as Record<string, unknown>).headCm as number | null | undefined,
      }),
    )
  },

  async getMilestones(childId: string): Promise<D.Milestone[]> {
    return listRows<D.Milestone>('milestones', { ...scope(), where: { child_id: childId } })
  },

  async getVaccinations(childId: string): Promise<D.Vaccination[]> {
    return listRows<D.Vaccination>('vaccinations', { ...scope(), where: { child_id: childId } })
  },

  // ---- Phase 7: Sau sinh — mutation (dữ liệu gia đình, shared) ----
  async addBirthRecord(input: BirthRecordInput): Promise<D.BirthRecord> {
    const now = new Date().toISOString()
    const created: D.BirthRecord = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      pregnancy_id: input.pregnancy_id ?? currentPregnancyId(),
      birth_date: input.birth_date,
      birth_type: input.birth_type,
      hospital: input.hospital ?? null,
      duration_hours: input.duration_hours ?? null,
      complications: input.complications ?? [],
      notes: input.notes ?? null,
    }
    insertRow('birth_records', created as unknown as Record<string, unknown>)
    return created
  },

  async updateBirthRecord(id: string, input: Partial<BirthRecordInput>): Promise<D.BirthRecord> {
    const existing = findRow<D.BirthRecord>('birth_records', id)
    if (!existing) throw new Error('Không tìm thấy bản ghi sinh')
    // KHÔNG để trống các trường bắt buộc hiện có (birth_date/birth_type).
    if (input.birth_date !== undefined && !input.birth_date) throw new Error('birth_date không được để trống')
    if (input.birth_type !== undefined && !input.birth_type) throw new Error('birth_type không được để trống')
    const patch: Partial<D.BirthRecord> = {}
    if (input.pregnancy_id !== undefined) patch.pregnancy_id = input.pregnancy_id
    if (input.birth_date !== undefined) patch.birth_date = input.birth_date
    if (input.birth_type !== undefined) patch.birth_type = input.birth_type
    if (input.hospital !== undefined) patch.hospital = input.hospital
    if (input.duration_hours !== undefined) patch.duration_hours = input.duration_hours
    if (input.complications !== undefined) patch.complications = input.complications
    if (input.notes !== undefined) patch.notes = input.notes
    return updateRow('birth_records', id, patch)!
  },

  async addChild(input: ChildInput): Promise<D.Child> {
    const now = new Date().toISOString()
    const created: D.Child = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      birth_record_id: input.birth_record_id ?? null,
      name: input.name,
      sex: input.sex,
      birth_date: input.birth_date,
      birth_weight_kg: input.birth_weight_kg ?? null,
      birth_length_cm: input.birth_length_cm ?? null,
      head_circumference_cm: input.head_circumference_cm ?? null,
      blood_type: input.blood_type ?? null,
      allergies: input.allergies ?? [],
    }
    insertRow('children', created as unknown as Record<string, unknown>)
    return created
  },

  async addGrowthPoint(childId: string, input: GrowthPointInput): Promise<GrowthPoint> {
    const now = new Date().toISOString()
    // getGrowth đọc payload (date/weightKg/heightCm/headCm) — id dùng uuid, không
    // đụng id seed `${childId}::${date}` để tránh trùng khi ghi 2 điểm cùng ngày.
    const created: GrowthPoint = {
      date: input.date,
      weightKg: input.weightKg ?? null,
      heightCm: input.heightCm ?? null,
      headCm: input.headCm ?? null,
    }
    insertRow('growth_points', {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      child_id: childId,
      ...created,
    })
    return created
  },

  async addVaccination(childId: string, input: VaccinationInput): Promise<D.Vaccination> {
    const now = new Date().toISOString()
    const created: D.Vaccination = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      child_id: childId,
      vaccine_name: input.vaccine_name,
      dose_number: input.dose_number ?? null,
      scheduled_date: input.scheduled_date ?? input.administered_date ?? REAL_TODAY,
      administered_date: input.administered_date ?? null,
      location: input.location ?? null,
      notes: input.notes ?? null,
    }
    insertRow('vaccinations', created as unknown as Record<string, unknown>)
    return created
  },

  // ---- Điều phối gia đình ----
  async getTasks(): Promise<D.Task[]> {
    return listRows<D.Task>('tasks', scope())
  },

  async getShopping(): Promise<D.ShoppingItem[]> {
    return listRows<D.ShoppingItem>('shopping_items', scope())
  },

  async getBudget(): Promise<D.BudgetEntry[]> {
    return listRows<D.BudgetEntry>('budget_entries', scope())
  },

  async getReminders(): Promise<D.Reminder[]> {
    return listRows<D.Reminder>('reminders', scope())
  },

  async addReminder(input: ReminderInput): Promise<D.Reminder> {
    const now = new Date().toISOString()
    const created: D.Reminder = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      title: input.title,
      scheduled_at: input.scheduled_at,
      frequency: input.frequency,
      channels: input.channels?.length ? input.channels : ['in_app'],
      active: true,
      last_sent_at: null,
      payload: input.payload ?? null,
    }
    insertRow('reminders', created as unknown as Record<string, unknown>)
    return created
  },

  async updateReminder(id: string, input: { active?: boolean }): Promise<D.Reminder> {
    const r = findRow<D.Reminder>('reminders', id)
    if (!r) throw new Error('Không tìm thấy nhắc nhở')
    const patch: Partial<D.Reminder> = {}
    if (input.active !== undefined) patch.active = input.active
    return updateRow('reminders', id, patch)!
  },

  async getNotificationPreferences(): Promise<D.NotificationPreference[]> {
    return listRows<D.NotificationPreference>('notification_preferences', scope())
  },

  // ---- Gia đình (Phase 4B) — đọc từ SQLite (bền qua restart) ----
  async getFamilyMembers() {
    const au = getActiveUser()
    if (!au?.family_id) return au?.members ?? []
    const members = dbMembersForFamily(au.family_id)
    return members.map((m) => {
      const u = dbUserById(m.user_id)
      return { user_id: m.user_id, name: u?.name ?? null, email: u?.email ?? '', role: m.role }
    })
  },

  async getFamilyCode() {
    const au = getActiveUser()
    if (!au?.family_id) return au?.family_code ?? null
    return dbFamilyById(au.family_id)?.code ?? null
  },

  async setNotificationPreference(input: {
    group: D.NotificationGroup
    channel: D.NotificationChannel
    enabled: boolean
  }): Promise<void> {
    const existing = listRows<D.NotificationPreference>('notification_preferences', scope()).find(
      (p) => p.group === input.group && p.channel === input.channel,
    )
    if (existing) {
      updateRow('notification_preferences', existing.id, { enabled: input.enabled })
      return
    }
    const now = new Date().toISOString()
    insertRow('notification_preferences', {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      group: input.group,
      channel: input.channel,
      enabled: input.enabled,
      quiet_start: null,
      quiet_end: null,
    })
  },

  // ---- Nội dung & học cùng con ----
  async getWeeklyGuides(): Promise<D.WeeklyGuide[]> {
    return listRows<D.WeeklyGuide>('weekly_guides', scope())
  },

  async getArticles(): Promise<D.Article[]> {
    return listRows<D.Article>('articles', scope())
  },

  async getQuizSets(): Promise<D.QuizSet[]> {
    const au = getActiveUser()
    const lib = au ? visible(libraryStore.listQuizSets()) : libraryStore.listQuizSets()
    return [...lib, ...listRows<D.QuizSet>('quiz_sets', scope())]
  },

  async getQuizQuestions(quizSetId: string): Promise<D.QuizQuestion[]> {
    const au = getActiveUser()
    const lib = au
      ? visible(libraryStore.listQuizQuestions().filter((q) => q.quiz_set_id === quizSetId))
      : libraryStore.listQuizQuestions().filter((q) => q.quiz_set_id === quizSetId)
    return [...lib, ...listRows<D.QuizQuestion>('quiz_questions', { ...scope(), where: { quiz_set_id: quizSetId } })]
  },

  async getKnowledgeSources(): Promise<D.KnowledgeSource[]> {
    const au = getActiveUser()
    const lib = au ? visible(libraryStore.listSources()) : libraryStore.listSources()
    return [...lib, ...listRows<D.KnowledgeSource>('knowledge_sources', scope())]
  },

  async getChatMessages(sessionId: string): Promise<D.ChatMessage[]> {
    return listRows<D.ChatMessage>('chat_messages', { ...scope(), where: { session_id: sessionId } })
  },

  // ---- Phase 6: Condition plans / measurements ----
  async getConditionPlans(): Promise<D.ConditionPlan[]> {
    return listRows<D.ConditionPlan>('condition_plans', scope())
  },

  async addConditionPlan(input: ConditionPlanInput): Promise<D.ConditionPlan> {
    const now = new Date().toISOString()
    const created: D.ConditionPlan = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      condition_type: input.condition_type,
      plan_text: input.plan_text,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      doctor_notes: input.doctor_notes ?? null,
    }
    insertRow('condition_plans', created as unknown as Record<string, unknown>)
    return created
  },

  async getConditionMeasurements(): Promise<D.ConditionMeasurement[]> {
    return listRows<D.ConditionMeasurement>('condition_measurements', scope())
  },

  async addConditionMeasurement(input: ConditionMeasurementInput): Promise<D.ConditionMeasurement> {
    const now = new Date().toISOString()
    const created: D.ConditionMeasurement = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      condition_plan_id: input.condition_plan_id,
      type: input.type,
      value: input.value,
      unit: input.unit,
      measured_at: input.measured_at,
      note: input.note ?? null,
    }
    insertRow('condition_measurements', created as unknown as Record<string, unknown>)
    return created
  },

  // ---- Phase 6: Knowledge retrieval (chunks) ----
  async searchKnowledgeChunks(query: string): Promise<D.KnowledgeChunk[]> {
    const q = query.trim()
    if (!q) return []
    const s = scope()
    const all = listRows<D.KnowledgeChunk>('knowledge_chunks', s)
    // ponytail: LIKE đơn giản (SQLite không có FTS) — lọc theo content/citation
    // chứa từ khoá, order theo vị trí. Nếu nhiều chunks → 50 kết quả đầu.
    const needle = q.toLocaleLowerCase('vi')
    return all
      .filter(
        (c) =>
          c.content.toLocaleLowerCase('vi').includes(needle) ||
          c.citation.toLocaleLowerCase('vi').includes(needle),
      )
      .sort((a, b) => a.position - b.position)
      .slice(0, 50)
  },

  async saveKnowledgeChunks(sourceId: string, chunks: KnowledgeChunkInput[]): Promise<void> {
    const now = new Date().toISOString()
    for (const c of chunks) {
      insertRow('knowledge_chunks', {
        id: uid(),
        family_id: myFamilyId(),
        private_owner_id: null,
        created_at: now,
        updated_at: now,
        knowledge_source_id: sourceId,
        content: c.content,
        citation: c.citation,
        position: c.position,
        embedding: c.embedding ?? null,
      } as unknown as Record<string, unknown>)
    }
  },

  // ---- Phase 6: Content versions ----
  async getContentVersions(
    contentType: D.ContentVersion['content_type'],
    contentId: string,
  ): Promise<D.ContentVersion[]> {
    return listRows<D.ContentVersion>('content_versions', {
      ...scope(),
      where: { content_type: contentType, content_id: contentId },
    })
  },

  // ---- Phase 6J: Theo dõi dinh dưỡng hằng ngày ----
  async addDailyIntake(input: DailyIntakeInput): Promise<DailyIntakeLog> {
    const now = new Date().toISOString()
    const log: DailyIntakeLog = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: myOwnerId(), // per-user — chỉ chủ sở hữu thấy (Phase 4B)
      date: input.date,
      note: input.note ?? null,
      items: [],
      created_at: now,
      updated_at: now,
    }
    const { items: _omit, ...logMeta } = log
    insertRow('daily_intake_logs', logMeta as unknown as Record<string, unknown>)
    const items: DailyIntakeItem[] = input.items.map((it) => ({
      id: uid(),
      family_id: myFamilyId(),
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
      created_at: now,
    }))
    for (const item of items) insertRow('intake_items', item as unknown as Record<string, unknown>)
    return { ...log, items }
  },

  async getDailyIntake(id: string): Promise<DailyIntakeLog | null> {
    const log = findRow<DailyIntakeLog>('daily_intake_logs', id)
    if (!log) return null
    const au = getActiveUser()
    if (au && log.private_owner_id !== null && log.private_owner_id !== au.user_id) return null
    const items = listRows<DailyIntakeItem>('intake_items', { where: { log_id: id } })
    return { ...log, items }
  },

  async listIntakeHistory(limit = 30): Promise<DailyIntakeLog[]> {
    const s = scope()
    const logs = listRows<DailyIntakeLog>('daily_intake_logs', { ...s, orderBy: 'date', desc: true, limit })
    return logs.map((log) => ({
      ...log,
      items: listRows<DailyIntakeItem>('intake_items', { ...s, where: { log_id: log.id } }),
    }))
  },

  async getNutrientSummary(period: { from: string; to: string }): Promise<NutrientSummary> {
    const s = scope()
    const logs = listRows<DailyIntakeLog>('daily_intake_logs', s)
      .filter((l) => l.date >= period.from && l.date <= period.to)
      .sort((a, b) => a.date.localeCompare(b.date))
    const days = logs.map((log) => {
      const items = listRows<DailyIntakeItem>('intake_items', { ...s, where: { log_id: log.id } })
      return { date: log.date, nutrients: aggregateNutrients(items), itemCount: items.length }
    })
    const preg = listRows<D.Pregnancy>('pregnancies', s).find((p) => p.status === 'ongoing')
    const week = preg?.lmp ? weekFromLmp(preg.lmp) : null
    return buildNutrientSummary(period.from, period.to, days, week)
  },

  // ---- Phase 7: Hồ sơ khám (medical visits) — PER-USER ----
  async getMedicalVisits(): Promise<MedicalVisit[]> {
    return listRows<MedicalVisit>('medical_visits', { ...scope(), orderBy: 'visit_date', desc: true })
  },

  async addMedicalVisit(input: MedicalVisitInput): Promise<MedicalVisit> {
    const now = new Date().toISOString()
    const visit: MedicalVisit = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: myOwnerId(), // per-user — chỉ chủ sở hữu thấy (Phase 4B)
      visit_date: input.visit_date,
      clinic: input.clinic ?? null,
      reason: input.reason ?? null,
      notes: input.notes ?? null,
      child_id: input.child_id ?? null,
      pregnancy_id: input.pregnancy_id ?? null,
      created_at: now,
      updated_at: now,
    }
    insertRow('medical_visits', visit as unknown as Record<string, unknown>)
    return visit
  },

  async getVisitDocuments(visitId: string): Promise<VisitDocument[]> {
    return listRows<VisitDocument>('visit_documents', {
      ...scope(),
      where: { visit_id: visitId },
      orderBy: 'created_at',
    })
  },

  async addVisitDocument(visitId: string, input: VisitDocumentInput): Promise<VisitDocument> {
    const now = new Date().toISOString()
    const doc: VisitDocument = {
      id: uid(),
      family_id: myFamilyId(),
      visit_id: visitId,
      private_owner_id: myOwnerId(),
      filename: input.filename,
      mime: input.mime,
      image_data: input.imageDataUrl,
      ocr_text: input.ocrText ?? null,
      created_at: now,
    }
    insertRow('visit_documents', doc as unknown as Record<string, unknown>)
    return doc
  },

  // ---- Mutation ----
  async addMeal(entry: MealEntryInput): Promise<D.MealEntry> {
    const now = new Date().toISOString()
    const created: D.MealEntry = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      meal_type: entry.meal_type,
      name: entry.name,
      logged_at: entry.logged_at,
      calories: entry.calories ?? null,
      note: entry.note ?? null,
      source: 'manual',
    }
    insertRow('meal_entries', created as unknown as Record<string, unknown>)
    return created
  },

  async addMealPhoto(input: MealPhotoInput): Promise<D.MealPhoto> {
    const now = new Date().toISOString()
    const created: D.MealPhoto = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      meal_id: input.meal_id,
      file_url: input.storage_path
        ? `/${input.storage_path.replace(/^\/+/, '')}`
        : `/uploads/${input.file_name}`,
      ai_suggested_name: null,
      confirmed: true,
      confirmed_by: null,
    }
    insertRow('meal_photos', created as unknown as Record<string, unknown>)
    return created
  },

  async upsertHealthMetric(rows: HealthMetricInput[]): Promise<{ created: D.MaternalMeasurement[]; duplicates: number }> {
    const now = new Date().toISOString()
    const existingKeys = new Set(
      listRows<D.MaternalMeasurement>('maternal_measurements', scope())
        .filter((m) => m.source === 'healthkit')
        .map((m) => healthMetricKey(m)),
    )
    const { kept, duplicates } = dedupeHealthMetrics(rows, existingKeys)
    const created: D.MaternalMeasurement[] = kept.map((r) => ({
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      pregnancy_id: currentPregnancyId(),
      type: r.type,
      value: r.value,
      unit: r.unit,
      diastolic: r.diastolic ?? null,
      taken_at: r.taken_at,
      note: null,
      source: 'healthkit',
    }))
    for (const c of created) insertRow('maternal_measurements', c as unknown as Record<string, unknown>)
    return { created, duplicates }
  },

  async addMeasurement(m: MeasurementInput): Promise<D.MaternalMeasurement> {
    const now = new Date().toISOString()
    const created: D.MaternalMeasurement = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      pregnancy_id: currentPregnancyId(),
      type: m.type,
      value: m.value,
      unit: m.unit,
      diastolic: m.diastolic ?? null,
      taken_at: m.taken_at,
      note: m.note ?? null,
      source: 'manual',
    }
    insertRow('maternal_measurements', created as unknown as Record<string, unknown>)
    return created
  },

  async addSymptom(s: SymptomReportInput): Promise<D.SymptomReport> {
    const now = new Date().toISOString()
    const created: D.SymptomReport = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: s.private ? myOwnerId() : null,
      created_at: now,
      updated_at: now,
      pregnancy_id: currentPregnancyId(),
      symptom: s.symptom,
      severity: s.severity,
      started_at: s.started_at,
      ended_at: null,
      note: s.note ?? null,
      source: 'manual',
    }
    insertRow('symptom_reports', created as unknown as Record<string, unknown>)
    return created
  },

  async importSymptoms(items: SymptomReportInput[]): Promise<{ created: number }> {
    const now = new Date().toISOString()
    const ownerId = myOwnerId()
    for (const s of items) {
      insertRow('symptom_reports', {
        id: uid(),
        family_id: myFamilyId(),
        private_owner_id: ownerId,
        created_at: now,
        updated_at: now,
        pregnancy_id: currentPregnancyId(),
        symptom: s.symptom,
        severity: s.severity,
        started_at: s.started_at,
        ended_at: null,
        note: s.note ?? null,
        source: 'manual',
      })
    }
    return { created: items.length }
  },

  async addTask(t: TaskInput): Promise<D.Task> {
    const now = new Date().toISOString()
    const created: D.Task = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      title: t.title,
      description: null,
      status: 'todo',
      due_date: t.due_date ?? null,
      assignee_id: t.assignee_id ?? null,
      completed_at: null,
      reminder_id: null,
    }
    insertRow('tasks', created as unknown as Record<string, unknown>)
    return created
  },

  async toggleTask(id: string, done: boolean): Promise<void> {
    const task = findRow<D.Task>('tasks', id)
    if (!task) return
    const patch: Partial<D.Task> = {
      status: done ? 'done' : 'todo',
      completed_at: done ? new Date().toISOString() : null,
    }
    updateRow('tasks', id, patch)
  },

  async startPregnancy(input: { lmp: string; edd?: string | null; fetalCount?: number }): Promise<D.Pregnancy> {
    const now = new Date().toISOString()
    const created: D.Pregnancy = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      lmp: input.lmp,
      edd: input.edd ?? eddFromLmp(input.lmp),
      status: 'ongoing',
      notes: null,
      source: 'manual',
    }
    insertRow('pregnancies', created as unknown as Record<string, unknown>)
    // Đa thai: fetalCount 1–3 → tự tạo N fetus (birth_order 1..N, name A/B/C).
    const count = Math.min(3, Math.max(1, input.fetalCount ?? 1))
    for (let i = 1; i <= count; i++) {
      insertRow('fetuses', {
        id: uid(),
        family_id: created.family_id,
        private_owner_id: null,
        created_at: now,
        updated_at: now,
        pregnancy_id: created.id,
        name: count > 1 ? String.fromCharCode(64 + i) : null, // A, B, C…
        sex: 'unknown',
        birth_order: i,
        notes: null,
      } as unknown as Record<string, unknown>)
    }
    return created
  },

  async addFetus(input: FetusInput): Promise<D.Fetus> {
    const now = new Date().toISOString()
    const pregId = currentPregnancyId()
    // ponytail: lọc theo pregnancy_id trong memory (payload) — bảng fetuses chưa
    // có cột SQL pregnancy_id, không thêm column để tránh migration DB cũ.
    const existing = listRows<D.Fetus>('fetuses', scope()).filter((f) => f.pregnancy_id === pregId)
    const order = input.birth_order ?? Math.max(0, ...existing.map((f) => f.birth_order)) + 1
    const created: D.Fetus = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      pregnancy_id: pregId,
      name: input.name ?? (order > 1 ? String.fromCharCode(64 + order) : null),
      sex: input.sex ?? 'unknown',
      birth_order: order,
      notes: input.notes ?? null,
    }
    insertRow('fetuses', created as unknown as Record<string, unknown>)
    return created
  },

  async updatePregnancy(input: { lmp?: string; edd?: string; notes?: string }): Promise<D.Pregnancy> {
    const p = listRows<D.Pregnancy>('pregnancies', scope()).find((pr) => pr.status === 'ongoing')
    if (!p) throw new Error('Không tìm thấy thai kỳ hiện tại để cập nhật')
    if (input.lmp && input.edd && input.edd <= input.lmp) {
      throw new Error('Ngày dự sinh (EDD) phải sau ngày đầu kỳ kinh cuối (LMP)')
    }
    const patch: Partial<D.Pregnancy> = {}
    if (input.lmp) patch.lmp = input.lmp
    if (input.edd) patch.edd = input.edd
    if (input.lmp && !input.edd) patch.edd = eddFromLmp(input.lmp)
    if (input.edd && !input.lmp) patch.lmp = lmpFromEdd(input.edd)
    if (input.notes !== undefined) patch.notes = input.notes
    return updateRow('pregnancies', p.id, patch)!
  },

  async updateHealthProfile(input: {
    height_cm?: number
    pre_pregnancy_weight_kg?: number
    blood_type?: string
    allergies?: string[]
    preexisting_conditions?: string[]
    notes?: string
  }): Promise<D.HealthProfile> {
    const hp = findRow<D.HealthProfile>('health_profiles', HEALTH_ID)
    if (!hp) throw new Error('Không tìm thấy hồ sơ sức khỏe')
    const patch: Partial<D.HealthProfile> = {}
    if (input.height_cm !== undefined) patch.height_cm = input.height_cm
    if (input.pre_pregnancy_weight_kg !== undefined) patch.pre_pregnancy_weight_kg = input.pre_pregnancy_weight_kg
    if (input.blood_type !== undefined) patch.blood_type = input.blood_type as D.BloodType
    if (input.allergies !== undefined) patch.allergies = input.allergies
    if (input.preexisting_conditions !== undefined) patch.preexisting_conditions = input.preexisting_conditions
    if (input.notes !== undefined) patch.notes = input.notes
    return updateRow('health_profiles', HEALTH_ID, patch)!
  },

  async addFeeding(
    childId: string,
    input: {
      method: D.FeedingMethod
      amount_ml?: number | null
      started_at: string
      duration_min?: number | null
      side?: D.FeedingSide | null
      note?: string
    },
  ): Promise<D.FeedingLog> {
    const now = new Date().toISOString()
    const created: D.FeedingLog = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      child_id: childId,
      method: input.method,
      side: input.side ?? null,
      amount_ml: input.amount_ml ?? null,
      started_at: input.started_at,
      duration_min: input.duration_min ?? null,
      note: input.note ?? null,
      source: 'manual',
    }
    insertRow('feeding_logs', created as unknown as Record<string, unknown>)
    return created
  },

  async addSleep(
    childId: string,
    input: { started_at: string; ended_at?: string | null; place: D.SleepPlace; note?: string },
  ): Promise<D.SleepLog> {
    const now = new Date().toISOString()
    const created: D.SleepLog = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      child_id: childId,
      started_at: input.started_at,
      ended_at: input.ended_at ?? null,
      place: input.place,
      note: input.note ?? null,
    }
    insertRow('sleep_logs', created as unknown as Record<string, unknown>)
    return created
  },

  async addDiaper(
    childId: string,
    input: { changed_at: string; type: D.DiaperType; note?: string },
  ): Promise<D.DiaperLog> {
    const now = new Date().toISOString()
    const created: D.DiaperLog = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      child_id: childId,
      changed_at: input.changed_at,
      type: input.type,
      note: input.note ?? null,
    }
    insertRow('diaper_logs', created as unknown as Record<string, unknown>)
    return created
  },

  async addFetalMovement(
    input: { felt_at: string; feeling: D.FetalMovementFeeling; duration_min?: number | null; note?: string },
  ): Promise<D.FetalMovementLog> {
    const now = new Date().toISOString()
    const created: D.FetalMovementLog = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: myOwnerId(),
      created_at: now,
      updated_at: now,
      pregnancy_id: currentPregnancyId(),
      felt_at: input.felt_at,
      feeling: input.feeling,
      duration_min: input.duration_min ?? null,
      note: input.note ?? null,
    }
    insertRow('fetal_movement_logs', created as unknown as Record<string, unknown>)
    return created
  },

  async addWater(input: { logged_at: string; amount_ml: number }): Promise<void> {
    const now = new Date().toISOString()
    insertRow('hydration_logs', {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      logged_at: input.logged_at,
      amount_ml: input.amount_ml,
      source: 'manual',
    })
  },

  async addShoppingItem(
    input: { name: string; category?: string | null; quantity?: number | null; unit?: string | null; estimated_price?: number | null },
  ): Promise<D.ShoppingItem> {
    const now = new Date().toISOString()
    const created: D.ShoppingItem = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      name: input.name,
      category: input.category ?? null,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      estimated_price: input.estimated_price ?? null,
      actual_price: null,
      status: 'pending',
      note: null,
    }
    insertRow('shopping_items', created as unknown as Record<string, unknown>)
    return created
  },

  async toggleShopping(id: string, done: boolean): Promise<void> {
    const item = findRow<D.ShoppingItem>('shopping_items', id)
    if (!item) return
    updateRow('shopping_items', id, { status: done ? 'bought' : 'pending' })
  },

  async deleteShoppingItem(id: string): Promise<void> {
    const item = findRow<D.ShoppingItem>('shopping_items', id)
    if (!item) throw new Error('Không tìm thấy món cần mua')
    deleteRow('shopping_items', id)
  },

  async updateShoppingItem(id: string, input: ShoppingItemUpdateInput): Promise<D.ShoppingItem> {
    const existing = findRow<D.ShoppingItem>('shopping_items', id)
    if (!existing) throw new Error('Không tìm thấy món cần mua')
    if (input.name !== undefined && !input.name) throw new Error('name không được để trống')
    const patch: Partial<D.ShoppingItem> = {}
    if (input.name !== undefined) patch.name = input.name
    if (input.category !== undefined) patch.category = input.category
    if (input.estimated_price !== undefined) patch.estimated_price = input.estimated_price
    if (input.note !== undefined) patch.note = input.note
    if (input.done !== undefined) patch.status = input.done ? 'bought' : 'pending'
    return updateRow('shopping_items', id, patch)!
  },

  async addMealToShopping(meal: D.SavedMeal): Promise<D.ShoppingItem[]> {
    const now = new Date().toISOString()
    // ponytail: mỗi nguyên liệu 1 item, giá ước để null (chưa có cơ sở tham khảo);
    // UI agent 6D có thể gán estimated_price sau. KHÔNG liên kết meal_id (schema
    // shopping không có cột đó) — ghi tên món vào note để tra lại.
    const created: D.ShoppingItem[] = (meal.ingredients ?? []).map((ingredient) => ({
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      name: ingredient.trim(),
      category: 'Nguyên liệu',
      quantity: 1,
      unit: null,
      estimated_price: null,
      actual_price: null,
      status: 'pending',
      note: `Món: ${meal.name}`,
    }))
    for (const item of created) insertRow('shopping_items', item as unknown as Record<string, unknown>)
    return created
  },

  async addBudget(input: BudgetInput): Promise<D.BudgetEntry> {
    const now = new Date().toISOString()
    const created: D.BudgetEntry = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      title: input.title,
      amount: input.amount,
      type: input.type,
      category: input.category ?? null,
      occurred_at: input.occurred_at,
      note: input.note ?? null,
    }
    insertRow('budget_entries', created as unknown as Record<string, unknown>)
    return created
  },

  async updateBudget(id: string, input: BudgetUpdateInput): Promise<D.BudgetEntry> {
    const existing = findRow<D.BudgetEntry>('budget_entries', id)
    if (!existing) throw new Error('Không tìm thấy khoản thu/chi')
    const patch: Partial<D.BudgetEntry> = {}
    if (input.title !== undefined) patch.title = input.title
    if (input.amount !== undefined) patch.amount = input.amount
    if (input.type !== undefined) patch.type = input.type
    if (input.category !== undefined) patch.category = input.category
    if (input.occurred_at !== undefined) patch.occurred_at = input.occurred_at
    if (input.note !== undefined) patch.note = input.note
    return updateRow('budget_entries', id, patch)!
  },

  async addMilestone(
    childId: string,
    input: { name: string; stage?: string | null; status: D.MilestoneStatus; achieved_at?: string | null; note?: string },
  ): Promise<D.Milestone> {
    const now = new Date().toISOString()
    const created: D.Milestone = {
      id: uid(),
      family_id: myFamilyId(),
      private_owner_id: null,
      created_at: now,
      updated_at: now,
      child_id: childId,
      name: input.name,
      stage: input.stage ?? null,
      achieved_at: input.achieved_at ?? null,
      status: input.status,
      note: input.note ?? null,
    }
    insertRow('milestones', created as unknown as Record<string, unknown>)
    return created
  },

  async deleteFamilyData(): Promise<void> {
    // Guard: xoá dữ liệu gia đình phải có active user (route /api/v1/export trả
    // 401 khi chưa đăng nhập — bản sao phòng thủ ở method cho mọi caller khác).
    const au = getActiveUser()
    if (!au) throw new Error('Cần đăng nhập để xoá dữ liệu gia đình')
    // Xoá dữ liệu người dùng tạo (KHÔNG reset seed — giữ pregnancies + content để
    // UI không vỡ, đúng ngữ nghĩa mock Phase 3). children/birth_records giờ là dữ
    // liệu người dùng (mutation Phase 7) → xoá theo.
    const fam = au.family_id || undefined
    const tables = [
      'birth_records',
      'children',
      'maternal_measurements',
      'symptom_reports',
      'fetal_movement_logs',
      'appointments',
      'documents',
      'meal_entries',
      'supplement_plans',
      'saved_meals',
      'feeding_logs',
      'sleep_logs',
      'diaper_logs',
      'growth_points',
      'milestones',
      'vaccinations',
      'tasks',
      'shopping_items',
      'budget_entries',
      'reminders',
      'nutrition_profiles',
      'hydration_logs',
      'condition_plans',
      'condition_measurements',
      'knowledge_chunks',
      'knowledge_stage_tags',
      'content_versions',
      'daily_intake_logs',
      'intake_items',
      'medical_visits',
      'visit_documents',
    ]
    // KHÔNG bao giờ deleteRows không điều kiện — family_id rỗng (user đăng ký chưa
    // join family) sẽ xoá sạch toàn bảng mọi family. Chỉ xoá khi CÓ familyId để lọc;
    // không có family → bỏ qua toàn bộ + log cảnh báo (DeleteOpts không lọc theo
    // owner, và đa số bảng family-scoped không có cột private_owner_id).
    for (const t of tables) {
      if (fam) {
        deleteRows(t, { familyId: fam })
      } else {
        console.warn(`[local] deleteFamilyData: bỏ qua bảng ${t} — không có familyId để lọc (tránh xoá sạch).`)
      }
    }
  },
}

export const localApi: DataApi = localImpl
