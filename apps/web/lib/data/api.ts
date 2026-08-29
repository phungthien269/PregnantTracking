import type * as D from '@mevabe/domain'

// ===========================================================================
// DataApi — khế ước dữ liệu (seam) giữa Backend (Agent 3) và Frontend (Agent 1).
// - Agent 3 implement file này trong mock.ts / supabase.ts.
// - Agent 1 CHỈ dùng các hàm này cho mọi trang, không tự truy vấn dữ liệu.
// - Trạng thái demo: nếu chưa cấu hình Supabase → dùng mock.
// ===========================================================================

// ---- View models (do Agent 3 định nghĩa chi tiết) ----

export interface WeekInfo {
  week: number
  trimester: D.Trimester
  /** Ví dụ "quả kiwi" */
  fetalSize: string
  fetalLengthCm?: number
  fetalWeightG?: number
  momChanges: string[]
  nutritionFocus: string[]
  /** Lịch khám/xét nghiệm gợi ý trong tuần */
  appointmentsDue: string[]
  todo: string[]
}

export interface NutrientFocus {
  name: string
  role: string
  foods: string[]
  substitutes: string[]
  safetyNotes?: string[]
}

export interface NutritionFocus {
  week: number
  nutrients: NutrientFocus[]
}

export interface WaterCaffeine {
  waterGoalMl: number
  waterLoggedMl: number
  caffeineLimitMg: number
  caffeineLoggedMg: number
}

export interface GrowthPoint {
  date: string
  weightKg?: number | null
  heightCm?: number | null
  headCm?: number | null
}

export interface DashboardSummary {
  week: number
  trimester: D.Trimester
  dueDate: string
  daysLeft: number
  taskCount: number
  tasksDone: number
  mealCountToday: number
  waterLoggedMl: number
  waterGoalMl: number
  upcomingAppointments: D.Appointment[]
  latestMeasurements: D.MaternalMeasurement[]
  recentSymptoms: D.SymptomReport[]
  dailyInsight: string
}

// ---- Input types cho mutation (Agent 3 định nghĩa) ----

export interface MealEntryInput {
  meal_type: D.MealType
  name: string
  logged_at: string
  /** Năng lượng ước tính (kcal) — advisory từ nhận diện ảnh bữa ăn, không bắt buộc. */
  calories?: number
  note?: string
}

/** Input ghi bản ghi ảnh bữa ăn (bảng meal_photos) — gọi sau khi lưu ảnh vào storage. */
export interface MealPhotoInput {
  /** ID bữa ăn đã lưu (data.addMeal trả về). */
  meal_id: string
  /** Tên file gốc người dùng tải lên (vd "pho-bo.jpg"). */
  file_name: string
  /** MIME type (vd "image/jpeg"). */
  mime: string
  size_bytes: number
  /** Đường dẫn trong storage (mock: "uploads/x.jpg"; supabase: "meals/x.jpg"). */
  storage_path?: string
}

export interface MeasurementInput {
  type: D.MeasurementType
  value: number
  unit: string
  /** Huyết áp tâm trương (mmHg) — chỉ dùng khi type = 'blood_pressure'. */
  diastolic?: number
  taken_at: string
  note?: string
}

export interface SymptomReportInput {
  symptom: string
  severity: D.SymptomSeverity
  started_at: string
  note?: string
  /** Bật "Chỉ mình tôi" → private_owner_id = người tạo; mặc định false = dùng chung. */
  private?: boolean
}

/** Cập nhật thai kỳ hiện tại (chọn tuần thai = đổi LMP/EDD). Thiếu một trong hai → tái tính theo Naegele. */
export interface PregnancyUpdateInput {
  lmp?: string
  edd?: string
  notes?: string
}

/** Cập nhật hồ sơ sức khỏe cá nhân (health_profiles). */
export interface HealthProfileUpdateInput {
  height_cm?: number
  pre_pregnancy_weight_kg?: number
  blood_type?: string
  allergies?: string[]
  preexisting_conditions?: string[]
  notes?: string
}

export interface TaskInput {
  title: string
  due_date?: string | null
  assignee_id?: D.Id | null
}

/** Khai báo tình trạng đặc biệt thai kỳ (lưu typed vào nutrition_profiles.conditions). */
export interface NutritionProfileInput {
  conditions?: D.ConditionType[]
  /** Ghi chú chỉ định của bác sĩ (VD tần suất đo, mốc cần lưu ý). */
  doctor_instructions?: string | null
}

/** Nhắc nhở đo theo lịch chỉ định (nối vào hệ reminder hiện có → /thong-bao). */
export interface ReminderInput {
  title: string
  scheduled_at: string
  frequency: D.ReminderFrequency
  channels?: D.NotificationChannel[]
  /** JSON nhỏ liên kết tình trạng/chỉ số (VD { v:1, conditionType, measurementType }) — max 1000 ký tự. */
  payload?: string | null
}

/** Thành viên gia đình (view model — name/email đã join từ profiles/users). */
export interface FamilyMemberView {
  user_id: string
  name: string | null
  email: string
  role: 'owner' | 'member'
}

// ===========================================================================
// Input types Phase 6 — mở rộng DataApi cho các mô-đun song song
// (lịch khám, món→mua sắm, ngân sách, đa thai, condition plans/measurements,
// knowledge chunks, content versions). KHÔNG đụng core.ts.
// ===========================================================================

/** Tạo lịch khám mới. `prescription`/`tasks_after` ghi sau buổi khám. */
export interface AppointmentInput {
  type: D.AppointmentType
  scheduled_at: string
  location?: string | null
  doctor?: string | null
  summary_before?: string | null
  outcome?: string | null
  followup_at?: string | null
  notes?: string | null
  prescription?: string | null
  tasks_after?: string[] | null
}

/** Cập nhật lịch khám — mọi trường tuỳ chọn; null để xoá, undefined để giữ nguyên. */
export interface AppointmentUpdateInput {
  type?: D.AppointmentType
  scheduled_at?: string
  location?: string | null
  doctor?: string | null
  summary_before?: string | null
  outcome?: string | null
  followup_at?: string | null
  notes?: string | null
  prescription?: string | null
  tasks_after?: string[] | null
}

/** Thêm khoản thu/chi (budget_entries). */
export interface BudgetInput {
  title: string
  amount: number
  type: D.BudgetType
  category?: string | null
  occurred_at: string
  note?: string | null
}

/** Cập nhật khoản thu/chi — mọi trường tuỳ chọn. */
export interface BudgetUpdateInput {
  title?: string
  amount?: number
  type?: D.BudgetType
  category?: string | null
  occurred_at?: string
  note?: string | null
}

/** Thêm thai nhi (đa thai). `birth_order` mặc định = số thai hiện có + 1. */
export interface FetusInput {
  name?: string | null
  sex?: D.Gender
  birth_order?: number | null
  notes?: string | null
}

/** Tạo kế hoạch theo dõi cho một tình trạng đặc biệt (condition_plans). */
export interface ConditionPlanInput {
  condition_type: D.ConditionType
  plan_text: string
  start_date?: string | null
  end_date?: string | null
  doctor_notes?: string | null
}

/** Ghi một chỉ số đo của kế hoạch tình trạng (condition_measurements). */
export interface ConditionMeasurementInput {
  condition_plan_id: string
  type: string
  value: number
  unit: string
  measured_at: string
  note?: string | null
}

/** Một chunk tri thức để lưu (khớp StoredChunk của library/store). */
export interface KnowledgeChunkInput {
  content: string
  citation: string
  position: number
  embedding?: number[] | null
}

// ===========================================================================
// Phase 7 — Sau sinh: input types cho mutation
// (birth record, hồ sơ bé, tăng trưởng, tiêm chủng).
// Dữ liệu GIA ĐÌNH (shared, private_owner_id = null) — theo seed hiện có.
// ===========================================================================

/** Ghi bản ghi sinh (birth_records). `pregnancy_id` bỏ trống → thai kỳ hiện tại. */
export interface BirthRecordInput {
  pregnancy_id?: string
  birth_date: string
  birth_type: D.BirthType
  hospital?: string
  duration_hours?: number
  complications?: string[]
  notes?: string
}

/** Thêm hồ sơ bé (children). `birth_record_id` bỏ trống → null. */
export interface ChildInput {
  birth_record_id?: string
  name: string
  sex: D.Gender
  birth_date: string
  birth_weight_kg?: number
  birth_length_cm?: number
  head_circumference_cm?: number
  blood_type?: string
  allergies?: string[]
}

/** Thêm 1 điểm tăng trưởng (growth_points). Chỉ số nào không có → null. */
export interface GrowthPointInput {
  date: string
  weightKg?: number
  heightCm?: number
  headCm?: number
}

/** Thêm 1 mũi tiêm chủng (vaccinations). `scheduled_date` bỏ trống → hôm nay. */
export interface VaccinationInput {
  vaccine_name: string
  dose_number?: number
  scheduled_date?: string
  administered_date?: string
  location?: string
  notes?: string
}

/** Cập nhật món cần mua — mọi trường tuỳ chọn; `done` đổi trạng thái mua (null/không gửi → giữ nguyên). */
export interface ShoppingItemUpdateInput {
  name?: string
  category?: string | null
  estimated_price?: number | null
  note?: string | null
  done?: boolean
}

// ===========================================================================
// Phase 6J — Theo dõi dinh dưỡng hằng ngày (Daily Nutrition Tracking)
// ===========================================================================

export type IntakeItemKind = 'meal' | 'food' | 'custom' | 'supplement'

/** id vi chất — KHỚP nutrient-reference-data.ts (folate, iron, calcium, vitamin_d, dha...). */
export type NutrientId =
  | 'energy'
  | 'protein'
  | 'folate'
  | 'iron'
  | 'calcium'
  | 'vitamin_d'
  | 'dha'
  | 'iodine'
  | 'zinc'
  | 'vitamin_b12'
  | 'choline'
  | 'vitamin_c'
  | 'fiber'
  | 'water'
  | 'vitamin_a'

/** Map vi chất → giá trị (đơn vị theo nutrient-reference-data.ts). */
export type NutrientValueMap = Partial<Record<NutrientId, number>>

/**
 * Input một item nhập (món/TPCN) — `nutrients`/`estimated` do SERVER route tính
 * trước khi persist (số liệu thật từ MEALS/FOODS, hoặc AI ước tính cho món không rõ).
 */
export interface IntakeItemInput {
  kind: IntakeItemKind
  name: string
  /** id món (MEALS) hoặc thực phẩm (FOODS) nếu chọn từ DB. */
  ref_id?: string | null
  /** Khối lượng (g) — dùng cho food/custom. */
  amount_g?: number | null
  /** Số phần ăn — dùng cho meal (mặc định 1). */
  qty?: number | null
  /** Hàm lượng mỗi viên (theo đơn vị của vi chất đó, VD sắt 27 mg / folate 400 mcg / vitD 400 IU). */
  dose_mg?: number | null
  /** Số viên/ngày (supplement). */
  pills?: number | null
  /** Vi chất đã tính (route điền trước khi gọi addDailyIntake). */
  nutrients?: NutrientValueMap | null
  /** true = "ước tính" (món không có số liệu chính xác → AI hoặc để trống). */
  estimated?: boolean
  note?: string | null
}

/** Item đã lưu trong nhật ký. */
export interface DailyIntakeItem {
  id: string
  family_id: string
  log_id: string
  kind: IntakeItemKind
  name: string
  ref_id: string | null
  amount_g: number | null
  qty: number | null
  dose_mg: number | null
  pills: number | null
  nutrients: NutrientValueMap
  estimated: boolean
  note: string | null
  created_at: string
}

/** Nhật ký 1 ngày (1 log = 1 ngày) — `items` luôn đầy đủ khi đọc. */
export interface DailyIntakeLog {
  id: string
  family_id: string
  private_owner_id: string | null
  /** YYYY-MM-DD */
  date: string
  note: string | null
  items: DailyIntakeItem[]
  created_at: string
  updated_at: string
}

export interface DailyIntakeInput {
  date: string
  items: IntakeItemInput[]
  note?: string | null
}

/** Một vi chất trong tổng kết: số nạp + nhu cầu tuần thai + % đủ. */
export interface NutrientTotal {
  id: NutrientId
  name: string
  unit: string
  amount: number
  /** nhu cầu/ngày theo tam cá nguyệt tuần thai hiện tại (null nếu chưa có thai kỳ). */
  need: number | null
  /** % đủ nhu cầu (round); null nếu chưa có nhu cầu. */
  pct: number | null
}

/** Tổng kết vi chất theo kỳ (VD 1 ngày / 1 tuần / 3 tháng). */
export interface NutrientSummary {
  from: string
  to: string
  /** tổng theo từng ngày. */
  days: { date: string; nutrients: NutrientValueMap; itemCount: number }[]
  /** tổng gộp cả kỳ theo 15 vi chất + so nhu cầu. */
  totals: NutrientTotal[]
  /** tuần thai dùng để so nhu cầu (null nếu chưa có thai kỳ). */
  week: number | null
}

// ===========================================================================
// Phase 7 — Hồ sơ khám (medical visits + ảnh tài liệu)
// Lưu các lần đi khám theo thời gian kèm ảnh giấy khám/đơn thuốc/kết quả xét
// nghiệm + nội dung AI đọc được. Dữ liệu PER-USER (private_owner_id = người tạo).
// ===========================================================================

/** Một lần đi khám. `private_owner_id` = user tạo (Mẹ demo seed MOM_ID). */
export interface MedicalVisit {
  id: string
  family_id: string
  private_owner_id: string | null
  /** YYYY-MM-DD — sắp xếp desc (mới nhất trước). */
  visit_date: string
  clinic?: string | null
  reason?: string | null
  notes?: string | null
  child_id?: string | null
  pregnancy_id?: string | null
  created_at: string
  updated_at: string
}

/** Ảnh tài liệu của một lần khám (giấy khám/đơn thuốc/kết quả). */
export interface VisitDocument {
  id: string
  family_id: string
  visit_id: string
  private_owner_id: string | null
  filename: string
  mime: string
  /** Data URL base64 (VD "data:image/jpeg;base64,..."). Giới hạn kích thước phía client (UI nén). */
  image_data: string
  /** Nội dung AI đọc được từ ảnh (OCR). */
  ocr_text?: string | null
  created_at: string
}

/** Input tạo một lần khám. */
export interface MedicalVisitInput {
  visit_date: string
  clinic?: string | null
  reason?: string | null
  notes?: string | null
  child_id?: string | null
  pregnancy_id?: string | null
}

/** Input đính 1 ảnh tài liệu vào lần khám. */
export interface VisitDocumentInput {
  filename: string
  mime: string
  imageDataUrl: string
  ocrText?: string | null
}

// ===========================================================================
// DataApi interface
// ===========================================================================

export interface HomeBundle {
  pregnancy: D.Pregnancy | null
  dashboard: DashboardSummary
  mealsToday: D.MealEntry[]
  water: WaterCaffeine
  fetuses: D.Fetus[]
  birthRecord: D.BirthRecord | null
}

export interface DataApi {
  /** A2 (perf, đã duyệt): gói dữ liệu trang chủ — 1 lượt gọi thay 5. Optional:
   *  local implement trực tiếp; tầng chưa có sẽ fallback Promise.all ở page. */
  getHomeBundle?(): Promise<HomeBundle>
  // ---- Thai kỳ & sức khỏe ----
  getPregnancy(): Promise<D.Pregnancy | null>
  getFetuses(): Promise<D.Fetus[]>
  getWeekInfo(week: number): Promise<WeekInfo>
  getDashboard(): Promise<DashboardSummary>
  getMeasurements(): Promise<D.MaternalMeasurement[]>
  getSymptoms(): Promise<D.SymptomReport[]>
  getFetalMovementLogs(): Promise<D.FetalMovementLog[]>
  getAppointments(): Promise<D.Appointment[]>
  getDocuments(): Promise<D.DocumentRecord[]>

  // ---- Dinh dưỡng ----
  getMeals(): Promise<D.MealEntry[]>
  getMealsByDate(date: string): Promise<D.MealEntry[]>
  getNutritionFocus(week: number): Promise<NutritionFocus>
  getWaterCaffeine(): Promise<WaterCaffeine>
  getSupplements(): Promise<D.SupplementPlan[]>
  getSavedMeals(): Promise<D.SavedMeal[]>
  /** Hồ sơ dinh dưỡng (chứa `conditions` typed + `doctor_instructions`) — dùng cho mô-đun Tình trạng. */
  getNutritionProfile(): Promise<D.NutritionProfile | null>
  /** Khai báo/bỏ tình trạng + ghi chú bác sĩ (tạo hồ sơ nếu chưa có). */
  updateNutritionProfile(input: NutritionProfileInput): Promise<D.NutritionProfile>

  // ---- Sau sinh & bé ----
  getBirthRecord(): Promise<D.BirthRecord | null>
  getChildren(): Promise<D.Child[]>
  getFeedings(childId: string): Promise<D.FeedingLog[]>
  getSleeps(childId: string): Promise<D.SleepLog[]>
  getDiapers(childId: string): Promise<D.DiaperLog[]>
  getGrowth(childId: string): Promise<GrowthPoint[]>
  getMilestones(childId: string): Promise<D.Milestone[]>
  getVaccinations(childId: string): Promise<D.Vaccination[]>

  // ---- Phase 7: Sau sinh — mutation (dữ liệu gia đình, shared) ----
  /** Ghi bản ghi sinh mới. Trả D.BirthRecord đã lưu. */
  addBirthRecord(input: BirthRecordInput): Promise<D.BirthRecord>
  /** Sửa bản ghi sinh (mọi trường tuỳ chọn — KHÔNG để trống birth_date/birth_type). Trả D.BirthRecord đã lưu. */
  updateBirthRecord(id: string, input: Partial<BirthRecordInput>): Promise<D.BirthRecord>
  /** Thêm hồ sơ bé mới. Trả D.Child đã lưu. */
  addChild(input: ChildInput): Promise<D.Child>
  /** Thêm 1 điểm tăng trưởng cho bé. Trả GrowthPoint (view model) đã lưu. */
  addGrowthPoint(childId: string, input: GrowthPointInput): Promise<GrowthPoint>
  /** Thêm 1 mũi tiêm chủng cho bé. Trả D.Vaccination đã lưu. */
  addVaccination(childId: string, input: VaccinationInput): Promise<D.Vaccination>

  // ---- Phase 7: Hồ sơ khám (medical visits) — dữ liệu PER-USER ----
  /** Danh sách hồ sơ khám của user (private_owner_id), sắp visit_date desc. */
  getMedicalVisits(): Promise<MedicalVisit[]>
  /** Thêm 1 lần khám. Trả MedicalVisit đã lưu (private_owner_id = người tạo). */
  addMedicalVisit(input: MedicalVisitInput): Promise<MedicalVisit>
  /** Ảnh tài liệu của 1 lần khám (giấy khám/đơn thuốc/kết quả + ocr_text). */
  getVisitDocuments(visitId: string): Promise<VisitDocument[]>
  /** Đính 1 ảnh tài liệu vào lần khám. Trả VisitDocument đã lưu. */
  addVisitDocument(visitId: string, input: VisitDocumentInput): Promise<VisitDocument>

  // ---- Điều phối gia đình ----
  getTasks(): Promise<D.Task[]>
  getShopping(): Promise<D.ShoppingItem[]>
  getBudget(): Promise<D.BudgetEntry[]>
  getReminders(): Promise<D.Reminder[]>
  /** Tạo nhắc nhở đo theo lịch bác sĩ chỉ định (mock + supabase reminders). */
  addReminder(input: ReminderInput): Promise<D.Reminder>
  /** Cập nhật nhắc nhở (VD tắt/bật `active` khi ngừng theo dõi tình trạng). */
  updateReminder(id: string, input: { active?: boolean }): Promise<D.Reminder>
  /** Thành viên gia đình của active user (mock: sync từ client; supabase: join family_members). */
  getFamilyMembers(): Promise<FamilyMemberView[]>
  /** Mã mời gia đình của active user (mock: sync từ client; supabase: chưa có cột → todo). */
  getFamilyCode(): Promise<string | null>
  getNotificationPreferences(): Promise<D.NotificationPreference[]>
  setNotificationPreference(input: {
    group: D.NotificationGroup
    channel: D.NotificationChannel
    enabled: boolean
  }): Promise<void>

  // ---- Nội dung & học cùng con ----
  getWeeklyGuides(): Promise<D.WeeklyGuide[]>
  getArticles(): Promise<D.Article[]>
  getQuizSets(): Promise<D.QuizSet[]>
  getQuizQuestions(quizSetId: string): Promise<D.QuizQuestion[]>
  getKnowledgeSources(): Promise<D.KnowledgeSource[]>
  getChatMessages(sessionId: string): Promise<D.ChatMessage[]>

  // ---- Mutation (mock OK; supabase cần auth) ----
  addMeal(entry: MealEntryInput): Promise<D.MealEntry>
  /** Ghi bản ghi ảnh bữa ăn (bảng meal_photos) — ảnh đã lưu storage trước, truyền storage_path vào. */
  addMealPhoto(input: MealPhotoInput): Promise<D.MealPhoto>
  addMeasurement(m: MeasurementInput): Promise<D.MaternalMeasurement>
  addSymptom(s: SymptomReportInput): Promise<D.SymptomReport>
  /** Import hàng loạt triệu chứng (tối đa 100, source 'manual') — cùng store addSymptom dùng. */
  importSymptoms(items: SymptomReportInput[]): Promise<{ created: number }>
  addTask(t: TaskInput): Promise<D.Task>
  toggleTask(id: string, done: boolean): Promise<void>
  // ---- Mutation mở rộng (đa thai, bé, nước, mua sắm, mốc, quiz) ----
  /** Tạo thai kỳ mới. `fetalCount` 1–3: >1 → tự tạo N fetus (birth_order 1..N, name A/B/C). Mặc định 1. */
  startPregnancy(input: { lmp: string; edd?: string | null; fetalCount?: number }): Promise<D.Pregnancy>
  /** Cập nhật thai kỳ hiện tại (chọn tuần thai): đổi LMP/EDD, tái tính Naegele nếu chỉ nhập một trong hai. */
  updatePregnancy(input: PregnancyUpdateInput): Promise<D.Pregnancy>
  /** Cập nhật hồ sơ sức khỏe cá nhân (health_profiles). */
  updateHealthProfile(input: HealthProfileUpdateInput): Promise<D.HealthProfile>
  addFeeding(
    childId: string,
    input: {
      method: D.FeedingMethod
      amount_ml?: number | null
      started_at: string
      duration_min?: number | null
      side?: D.FeedingSide | null
      note?: string
    },
  ): Promise<D.FeedingLog>
  addSleep(
    childId: string,
    input: { started_at: string; ended_at?: string | null; place: D.SleepPlace; note?: string },
  ): Promise<D.SleepLog>
  addDiaper(
    childId: string,
    input: { changed_at: string; type: D.DiaperType; note?: string },
  ): Promise<D.DiaperLog>
  addFetalMovement(
    input: { felt_at: string; feeling: D.FetalMovementFeeling; duration_min?: number | null; note?: string },
  ): Promise<D.FetalMovementLog>
  addWater(input: { logged_at: string; amount_ml: number }): Promise<void>
  addShoppingItem(
    input: {
      name: string
      category?: string | null
      quantity?: number | null
      unit?: string | null
      estimated_price?: number | null
    },
  ): Promise<D.ShoppingItem>
  toggleShopping(id: string, done: boolean): Promise<void>
  /** Xoá món cần mua. */
  deleteShoppingItem(id: string): Promise<void>
  /** Sửa món cần mua (tên/hạng mục/giá dự kiến/ghi chú/trạng thái done). Trả D.ShoppingItem đã lưu. */
  updateShoppingItem(id: string, input: ShoppingItemUpdateInput): Promise<D.ShoppingItem>
  addMilestone(
    childId: string,
    input: {
      name: string
      stage?: string | null
      status: D.MilestoneStatus
      achieved_at?: string | null
      note?: string
    },
  ): Promise<D.Milestone>

  // ---- Phase 6: Lịch khám (CRUD) ----
  addAppointment(input: AppointmentInput): Promise<D.Appointment>
  updateAppointment(id: string, input: AppointmentUpdateInput): Promise<D.Appointment>

  // ---- Phase 6: Món → mua sắm ----
  /** Tạo 1 shopping item cho mỗi nguyên liệu của món; trả các item đã tạo. */
  addMealToShopping(meal: D.SavedMeal): Promise<D.ShoppingItem[]>

  // ---- Phase 6: Ngân sách (budget_entries) ----
  addBudget(input: BudgetInput): Promise<D.BudgetEntry>
  updateBudget(id: string, input: BudgetUpdateInput): Promise<D.BudgetEntry>

  // ---- Phase 6: Đa thai ----
  /** Thêm thai nhi vào thai kỳ hiện tại (pregnancy_id tự lấy). */
  addFetus(input: FetusInput): Promise<D.Fetus>

  // ---- Phase 6: Condition plans / measurements (persist bảng riêng) ----
  getConditionPlans(): Promise<D.ConditionPlan[]>
  addConditionPlan(input: ConditionPlanInput): Promise<D.ConditionPlan>
  getConditionMeasurements(): Promise<D.ConditionMeasurement[]>
  addConditionMeasurement(input: ConditionMeasurementInput): Promise<D.ConditionMeasurement>

  // ---- Phase 6: Knowledge retrieval (chunks) ----
  /** Tìm chunk theo query (LIKE đơn giản trên content/citation). */
  searchKnowledgeChunks(query: string): Promise<D.KnowledgeChunk[]>
  /** Persist chunks của một nguồn (thư viện import → SQLite). */
  saveKnowledgeChunks(sourceId: string, chunks: KnowledgeChunkInput[]): Promise<void>

  // ---- Phase 6: Content versions ----
  getContentVersions(
    contentType: D.ContentVersion['content_type'],
    contentId: string,
  ): Promise<D.ContentVersion[]>

  // ---- Phase 6J: Theo dõi dinh dưỡng hằng ngày ----
  /** Tạo nhật ký dinh dưỡng 1 ngày (items đã tính vi chất). Lưu per-user: private_owner_id = người tạo. */
  addDailyIntake(input: DailyIntakeInput): Promise<DailyIntakeLog>
  /** Lấy 1 nhật ký theo id — chỉ chủ sở hữu (hoặc dùng chung) thấy. */
  getDailyIntake(id: string): Promise<DailyIntakeLog | null>
  /** Danh sách nhật ký mới nhất trước (mặc định 30). */
  listIntakeHistory(limit?: number): Promise<DailyIntakeLog[]>
  /** Tổng vi chất theo kỳ (`from`→`to`, YYYY-MM-DD) + so nhu cầu tuần thai. */
  getNutrientSummary(period: { from: string; to: string }): Promise<NutrientSummary>

  // ---- Quyền riêng tư / export (Agent 7, task C.5) ----
  /** Xóa toàn bộ dữ liệu gia đình. Mock: reset bộ nhớ; Supabase: xóa family (cascade, RLS owner). */
  deleteFamilyData(): Promise<void>
}
