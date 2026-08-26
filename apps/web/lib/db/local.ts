// ===========================================================================
// DB local — SQLite file (node:sqlite, module built-in Node 24). SERVER-ONLY.
//
// - Singleton kết nối `DatabaseSync` (globalThis-cached → chống Next hot-reload
//   mở DB nhiều lần). journal_mode=WAL + foreign_keys=ON.
// - Mỗi entity một bảng: cột `id` + các cột lọc `family_id`/`private_owner_id`/
//   `created_at`/`updated_at` + cột query-critical (logged_at, child_id…) +
//   cột `payload` TEXT chứa JSON đầy đủ entity.
// - Seed: khi DB rỗng → chèn seed Y HỆT mock.ts (dùng lại mảng seed đã export).
// - KHÔNG import vào client component (node:sqlite chỉ chạy server-side).
//
// Self-check: node --experimental-strip-types --import ./lib/library/node-loader.mjs lib/db/local.ts
// ===========================================================================

import { createRequire } from 'node:module'
import type { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'

// Lazy-load node:sqlite — KHÔNG require ở top-level. Chỉ khi thực sự mở DB (chế
// độ local) mới nạp module. Ở production (Supabase mode) module này vẫn có thể
// được import (auth routes) nhưng node:sqlite không bị evaluate → không crash
// runtime serverless và không vỡ build nếu bundler tĩnh hoá import.
const require = createRequire(import.meta.url)
import {
  sha256Hex,
  DAD_EMAIL,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DEMO_FAMILY_ID,
  DEMO_FAMILY_CODE,
  DEMO_MOM_ID,
  DEMO_DAD_ID,
} from '../auth/core'
import {
  FAMILY_ID,
  MOM_ID,
  DAD_ID,
  pregnancies,
  fetuses,
  healthProfiles,
  nutritionProfiles,
  measurements,
  symptoms,
  fetalMovementLogs,
  appointments,
  documents,
  meals,
  supplements,
  savedMeals,
  birthRecord,
  children,
  feedings,
  sleeps,
  diapers,
  growthByChild,
  milestones,
  vaccinations,
  tasks,
  shopping,
  budget,
  reminders,
  notificationPrefs,
  weeklyGuides,
  articles,
  quizSets,
  quizQuestions,
  chatSession,
  chatMessages,
  knowledgeSources,
  medicalVisits,
  visitDocuments,
  TODAY,
} from '../data/mock'

// ---------------------------------------------------------------------------
// Registry bảng: extra = cột typed ngoài payload (dùng để lọc/order trong SQL).
// ---------------------------------------------------------------------------

const TABLES: Record<string, { extra?: string[] }> = {
  pregnancies: {},
  fetuses: {},
  health_profiles: {},
  nutrition_profiles: {},
  maternal_measurements: { extra: ['taken_at', 'type'] },
  symptom_reports: { extra: ['started_at'] },
  fetal_movement_logs: { extra: ['felt_at'] },
  appointments: { extra: ['scheduled_at'] },
  documents: {},
  meal_entries: { extra: ['logged_at'] },
  meal_photos: {},
  supplement_plans: {},
  saved_meals: {},
  birth_records: {},
  children: {},
  feeding_logs: { extra: ['started_at', 'child_id'] },
  sleep_logs: { extra: ['started_at', 'child_id'] },
  diaper_logs: { extra: ['changed_at', 'child_id'] },
  growth_points: { extra: ['date', 'child_id'] },
  milestones: { extra: ['child_id'] },
  vaccinations: { extra: ['child_id'] },
  tasks: { extra: ['status', 'due_date'] },
  shopping_items: {},
  budget_entries: { extra: ['occurred_at'] },
  reminders: { extra: ['scheduled_at'] },
  notification_preferences: {},
  weekly_guides: {},
  articles: {},
  quiz_sets: {},
  quiz_questions: { extra: ['quiz_set_id'] },
  knowledge_sources: {},
  knowledge_chunks: { extra: ['knowledge_source_id'] },
  knowledge_stage_tags: { extra: ['knowledge_source_id'] },
  condition_plans: { extra: ['condition_type'] },
  condition_measurements: { extra: ['condition_plan_id', 'measured_at'] },
  content_versions: { extra: ['content_type', 'content_id'] },
  daily_intake_logs: { extra: ['date'] },
  intake_items: { extra: ['log_id'] },
  medical_visits: { extra: ['visit_date'] },
  visit_documents: { extra: ['visit_id'] },
  chat_sessions: {},
  chat_messages: { extra: ['session_id'] },
  hydration_logs: { extra: ['logged_at', 'amount_ml'] },
  caffeine_logs: { extra: ['logged_at'] },
  // Auth (server-side persist)
  users: { extra: ['email'] },
  families: { extra: ['code'] },
  family_members: { extra: ['user_id'] },
  sessions: { extra: ['user_id'] },
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

const DB_FILE =
  process.env.MEVABE_DB_PATH ??
  join(process.cwd(), '.data', 'mevabe.db')

function createDb(): DatabaseSync {
  // Lazy require node:sqlite bên trong hàm khởi tạo singleton (chỉ chạy khi
  // app ở chế độ local, có DB_PATH hoặc khi route auth local được gọi).
  const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite')
  mkdirSync(dirname(DB_FILE), { recursive: true })
  const db = new DatabaseSync(DB_FILE)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  return db
}

function getDbGlobal(): DatabaseSync {
  const g = globalThis as { __mevabeDb?: DatabaseSync }
  if (!g.__mevabeDb) {
    g.__mevabeDb = createDb()
    initSchema(g.__mevabeDb)
    seedIfEmpty(g.__mevabeDb)
  }
  return g.__mevabeDb
}

let dbSingleton: DatabaseSync | null = null

/** Lấy kết nối singleton (init + seed dữ liệu nếu DB rỗng). */
export function getDb(): DatabaseSync {
  if (!dbSingleton) dbSingleton = getDbGlobal()
  return dbSingleton
}

export function dbFilePath(): string {
  return DB_FILE
}

// ---------------------------------------------------------------------------
// Schema (idempotent)
// ---------------------------------------------------------------------------

function initSchema(db: DatabaseSync): void {
  for (const [name, def] of Object.entries(TABLES)) {
    const extras = (def.extra ?? []).map((c) => `\`${c}\` TEXT`).join(', ')
    db.exec(
      `CREATE TABLE IF NOT EXISTS \`${name}\` (
        id TEXT PRIMARY KEY,
        family_id TEXT,
        private_owner_id TEXT,
        created_at TEXT,
        updated_at TEXT
        ${extras ? ',' + extras : ''},
        payload TEXT
      )`,
    )
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_scope ON maternal_measurements (family_id, private_owner_id)')
}

// ---------------------------------------------------------------------------
// Seed — dùng lại mảng seed mock.ts (cùng hành vi, cùng nội dung tiếng Việt)
// ---------------------------------------------------------------------------

function seedIfEmpty(db: DatabaseSync): void {
  if (countRows('pregnancies') > 0) return
  const now = new Date().toISOString()
  for (const p of pregnancies) insertRow('pregnancies', p as unknown as Row)
  for (const f of fetuses) insertRow('fetuses', f as unknown as Row)
  for (const h of healthProfiles) insertRow('health_profiles', h as unknown as Row)
  for (const n of nutritionProfiles) insertRow('nutrition_profiles', n as unknown as Row)
  for (const m of measurements) insertRow('maternal_measurements', m as unknown as Row)
  for (const s of symptoms) insertRow('symptom_reports', s as unknown as Row)
  for (const f of fetalMovementLogs) insertRow('fetal_movement_logs', f as unknown as Row)
  for (const a of appointments) insertRow('appointments', a as unknown as Row)
  for (const d of documents) insertRow('documents', d as unknown as Row)
  for (const m of meals) insertRow('meal_entries', m as unknown as Row)
  for (const s of supplements) insertRow('supplement_plans', s as unknown as Row)
  for (const s of savedMeals) insertRow('saved_meals', s as unknown as Row)
  if (birthRecord) insertRow('birth_records', birthRecord as unknown as Row)
  for (const c of children) insertRow('children', c as unknown as Row)
  for (const f of feedings) insertRow('feeding_logs', f as unknown as Row)
  for (const s of sleeps) insertRow('sleep_logs', s as unknown as Row)
  for (const d of diapers) insertRow('diaper_logs', d as unknown as Row)
  for (const [childId, points] of Object.entries(growthByChild)) {
    for (const pt of points) {
      insertRow('growth_points', {
        ...(pt as unknown as Row),
        id: `${childId}::${pt.date}`,
        family_id: FAMILY_ID,
        private_owner_id: null,
        child_id: childId,
        date: pt.date,
        created_at: now,
        updated_at: now,
      })
    }
  }
  for (const m of milestones) insertRow('milestones', m as unknown as Row)
  for (const v of vaccinations) insertRow('vaccinations', v as unknown as Row)
  for (const t of tasks) insertRow('tasks', t as unknown as Row)
  for (const s of shopping) insertRow('shopping_items', s as unknown as Row)
  for (const b of budget) insertRow('budget_entries', b as unknown as Row)
  for (const r of reminders) insertRow('reminders', r as unknown as Row)
  for (const np of notificationPrefs) insertRow('notification_preferences', np as unknown as Row)
  for (const g of weeklyGuides) insertRow('weekly_guides', g as unknown as Row)
  for (const a of articles) insertRow('articles', a as unknown as Row)
  for (const q of quizSets) insertRow('quiz_sets', q as unknown as Row)
  for (const q of quizQuestions) insertRow('quiz_questions', q as unknown as Row)
  if (chatSession) insertRow('chat_sessions', chatSession as unknown as Row)
  for (const c of chatMessages) insertRow('chat_messages', c as unknown as Row)
  for (const k of knowledgeSources) insertRow('knowledge_sources', k as unknown as Row)
  for (const v of medicalVisits) insertRow('medical_visits', v as unknown as Row)
  for (const d of visitDocuments) insertRow('visit_documents', d as unknown as Row)
  // Nước: mock khởi đầu waterLoggedMl = 1400 → 1 dòng hydration seed tổng 1400.
  insertRow('hydration_logs', {
    id: 'seed-water-1400',
    family_id: FAMILY_ID,
    private_owner_id: null,
    created_at: `${TODAY}T00:00:00+07:00`,
    updated_at: `${TODAY}T00:00:00+07:00`,
    logged_at: `${TODAY}T00:00:00+07:00`,
    amount_ml: 1400,
    source: 'seed',
  })
}

// ---------------------------------------------------------------------------
// Row helpers
// ---------------------------------------------------------------------------

export type Row = Record<string, unknown>

export function countRows(table: string): number {
  const r = getDb().prepare(`SELECT COUNT(*) AS c FROM \`${table}\``).get() as { c: number }
  return Number(r?.c ?? 0)
}

function tableExtras(table: string): string[] {
  return TABLES[table]?.extra ?? []
}

/** Chèn/ghi đè 1 dòng. `obj` = entity đầy đủ (id bắt buộc). */
export function insertRow(table: string, obj: Row): void {
  const now = new Date().toISOString()
  const id = String(obj.id ?? crypto.randomUUID())
  const cols = ['id', 'family_id', 'private_owner_id', 'created_at', 'updated_at', ...tableExtras(table), 'payload']
  const ph = cols.map(() => '?').join(', ')
  const vals: (string | number | null)[] = [
    id,
    (obj.family_id as string) ?? null,
    (obj.private_owner_id as string) ?? null,
    (obj.created_at as string) ?? now,
    (obj.updated_at as string) ?? now,
    ...tableExtras(table).map((c) => (obj[c] as string | number | undefined) ?? null),
    JSON.stringify({ ...obj, id }),
  ]
  getDb().prepare(`INSERT OR REPLACE INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${ph})`).run(...vals)
}

/** Đọc 1 dòng theo id (parse payload). */
export function findRow<T = Row>(table: string, id: string): T | null {
  const r = getDb().prepare(`SELECT payload FROM \`${table}\` WHERE id = ?`).get(id) as { payload?: string } | undefined
  return r?.payload ? (JSON.parse(r.payload) as T) : null
}

export interface ListOpts {
  /** Lọc theo family_id (chỉ khi truyền). */
  familyId?: string | null
  /** Lọc privacy: private_owner_id IS NULL OR = privateId (chỉ khi truyền). */
  privateId?: string | null
  /** Lọc cột typed (vd { child_id: 'x' }). */
  where?: Record<string, unknown>
  /** Lọc cột typed theo prefix (LIKE 'v%'), vd { logged_at: '2026-08-03' }. */
  prefix?: Record<string, string>
  orderBy?: string
  desc?: boolean
  limit?: number
}

/** Đọc danh sách dòng theo scope/lọc — parse payload từng dòng. */
export function listRows<T = Row>(table: string, opts: ListOpts = {}): T[] {
  const conds: string[] = []
  const params: (string | number | null)[] = []
  if (opts.familyId) {
    conds.push('family_id = ?')
    params.push(opts.familyId)
  }
  if (opts.privateId) {
    conds.push('(private_owner_id IS NULL OR private_owner_id = ?)')
    params.push(opts.privateId)
  }
  if (opts.where) {
    for (const [k, v] of Object.entries(opts.where)) {
      conds.push(`\`${k}\` = ?`)
      params.push(v as string)
    }
  }
  if (opts.prefix) {
    for (const [k, v] of Object.entries(opts.prefix)) {
      conds.push(`\`${k}\` LIKE ?`)
      params.push(`${v}%`)
    }
  }
  const whereSql = conds.length ? ` WHERE ${conds.join(' AND ')}` : ''
  const orderSql = opts.orderBy ? ` ORDER BY \`${opts.orderBy}\`${opts.desc ? ' DESC' : ' ASC'}` : ''
  const limitSql = opts.limit ? ` LIMIT ${opts.limit}` : ''
  const rows = getDb()
    .prepare(`SELECT payload FROM \`${table}\`${whereSql}${orderSql}${limitSql}`)
    .all(...params) as { payload: string }[]
  return rows.map((r) => JSON.parse(r.payload) as T)
}

/** Merge patch vào dòng hiện có, cập nhật updated_at. Trả entity mới hoặc null. */
export function updateRow<T = Row>(table: string, id: string, patch: Partial<T>): T | null {
  const existing = findRow<Row>(table, id)
  if (!existing) return null
  const merged: Row = { ...existing, ...(patch as Row), updated_at: new Date().toISOString() }
  insertRow(table, merged)
  return merged as T
}

export function deleteRow(table: string, id: string): void {
  getDb().prepare(`DELETE FROM \`${table}\` WHERE id = ?`).run(id)
}

export interface DeleteOpts {
  familyId?: string | null
  childId?: string | null
}

/** Xoá nhiều dòng (theo family/child). Không truyền gì → xoá toàn bộ. */
export function deleteRows(table: string, opts: DeleteOpts = {}): number {
  const conds: string[] = []
  const params: (string | number | null)[] = []
  if (opts.familyId) {
    conds.push('family_id = ?')
    params.push(opts.familyId)
  }
  if (opts.childId) {
    conds.push('child_id = ?')
    params.push(opts.childId)
  }
  const whereSql = conds.length ? ` WHERE ${conds.join(' AND ')}` : ''
  const r = getDb().prepare(`DELETE FROM \`${table}\`${whereSql}`).run(...params)
  return Number(r.changes ?? 0)
}

/** Tổng cột số (vd amount_ml). */
export function sumColumn(table: string, col: string, opts: ListOpts = {}): number {
  const conds: string[] = []
  const params: (string | number | null)[] = []
  if (opts.familyId) {
    conds.push('family_id = ?')
    params.push(opts.familyId)
  }
  if (opts.privateId) {
    conds.push('(private_owner_id IS NULL OR private_owner_id = ?)')
    params.push(opts.privateId)
  }
  const whereSql = conds.length ? ` WHERE ${conds.join(' AND ')}` : ''
  const r = getDb()
    .prepare(`SELECT COALESCE(SUM(\`${col}\`), 0) AS s FROM \`${table}\`${whereSql}`)
    .get(...params) as { s: number }
  return Number(r?.s ?? 0)
}

// ---------------------------------------------------------------------------
// Auth — users / families / family_members / sessions (server-side persist)
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString()
}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString('hex')
}

export interface DbUser {
  id: string
  email: string
  name: string | null
  salt: string
  hash: string
  created_at: string
  family_id: string
}

export interface DbFamily {
  id: string
  name: string
  code: string
  created_at: string
}

export interface DbFamilyMember {
  id: string
  family_id: string
  user_id: string
  role: 'owner' | 'member'
  created_at: string
}

export interface DbSession {
  token: string
  user_id: string
  expires_at: number
  created_at: string
}

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Seed auth demo (idempotent): family MEVABE + mẹ (owner) + bố (member). */
export async function ensureAuthSeed(): Promise<void> {
  getDb()
  if (!findRow('families', DEMO_FAMILY_ID)) {
    insertRow('families', { id: DEMO_FAMILY_ID, name: 'Gia đình Mẹ & Bé', code: DEMO_FAMILY_CODE, created_at: now() })
  }
  for (const [id, email, name, role] of [
    [DEMO_MOM_ID, DEMO_EMAIL, 'Mẹ demo', 'owner'],
    [DEMO_DAD_ID, DAD_EMAIL, 'Bố demo', 'member'],
  ] as const) {
    if (!findRow('users', id)) {
      const salt = randomHex(16)
      const hash = await sha256Hex(salt + DEMO_PASSWORD)
      insertRow('users', { id, email, name, salt, hash, created_at: now(), family_id: DEMO_FAMILY_ID })
    }
    if (!findRow('family_members', `${DEMO_FAMILY_ID}::${id}`)) {
      insertRow('family_members', {
        id: `${DEMO_FAMILY_ID}::${id}`,
        family_id: DEMO_FAMILY_ID,
        user_id: id,
        role,
        created_at: now(),
      })
    }
  }
}

export function dbUserByEmail(email: string): DbUser | null {
  const rows = listRows<DbUser>('users', { where: { email } })
  return rows[0] ?? null
}

export function dbUserById(id: string): DbUser | null {
  return findRow<DbUser>('users', id)
}

export function dbFamilyById(id: string): DbFamily | null {
  return findRow<DbFamily>('families', id)
}

export function dbFamilyByCode(code: string): DbFamily | null {
  const rows = listRows<DbFamily>('families', { where: { code: code.toUpperCase() } })
  return rows[0] ?? null
}

export function dbMembersForFamily(familyId: string): DbFamilyMember[] {
  return listRows<DbFamilyMember>('family_members', { where: { family_id: familyId } })
}

export function dbCreateFamily(name: string): DbFamily {
  const id = crypto.randomUUID()
  const family: DbFamily = { id, name, code: generateFamilyCodeLocal(), created_at: now() }
  insertRow('families', family as unknown as Row)
  return family
}

export function dbCreateMember(familyId: string, userId: string, role: 'owner' | 'member'): void {
  insertRow('family_members', {
    id: `${familyId}::${userId}`,
    family_id: familyId,
    user_id: userId,
    role,
    created_at: now(),
  })
}

export async function dbCreateUser(email: string, password: string, name: string | null, familyId: string): Promise<DbUser> {
  const salt = randomHex(16)
  const hash = await sha256Hex(salt + password)
  const user: DbUser = { id: crypto.randomUUID(), email, name, salt, hash, created_at: now(), family_id: familyId }
  insertRow('users', user as unknown as Row)
  return user
}

export function dbCreateSession(userId: string): DbSession {
  const token = randomHex(24)
  const session: DbSession = { token, user_id: userId, expires_at: Date.now() + SESSION_TTL_MS, created_at: now() }
  // sessions: token là khoá chính (id) → findRow('sessions', token) được.
  insertRow('sessions', { ...session, id: token } as unknown as Row)
  return session
}

export function dbFindSession(token: string): DbSession | null {
  return findRow<DbSession>('sessions', token)
}

export function dbDeleteSession(token: string): void {
  deleteRow('sessions', token)
}

/** Mã gia đình 6 ký tự — bảng chữ không nhập nhằng (khớp core.generateFamilyCode). */
function generateFamilyCodeLocal(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

// ---------------------------------------------------------------------------
// Self-check
// ---------------------------------------------------------------------------

export function __selfcheck(): string[] {
  const errors: string[] = []
  const db = getDb()
  if (countRows('pregnancies') < 1) errors.push('seed pregnancies trống')
  if (countRows('maternal_measurements') < 10) errors.push('seed measurements < 10')
  if (countRows('meal_entries') < 5) errors.push('seed meals < 5')
  if (countRows('hydration_logs') < 1) errors.push('seed hydration trống')
  // lọc SQL privacy: seed symptoms đều private_owner_id=MOM_ID → với privateId=DAD,
  // SQL phải KHÔNG trả mục private của MOM (dùng chung NULL vẫn hiện).
  const familyOnly = listRows('symptom_reports', { familyId: FAMILY_ID })
  const scoped = listRows('symptom_reports', { familyId: FAMILY_ID, privateId: DAD_ID })
  if (familyOnly.length !== 4) errors.push(`seed symptoms lẽ ra 4, hiện ${familyOnly.length}`)
  if (scoped.some((s) => (s as Row).private_owner_id !== null && (s as Row).private_owner_id !== DAD_ID)) {
    errors.push('lọc privacy SQL sai (thấy mục private của người khác)')
  }
  return errors
}

async function main(): Promise<void> {
  const errors = __selfcheck()
  if (errors.length) {
    console.error('❌ db.local self-check FAIL:')
    for (const e of errors) console.error('  -', e)
    process.exit(1)
  }
  console.log('✅ db.local self-check PASS —', DB_FILE)
}

const isMain = (): boolean =>
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1]

if (isMain()) {
  void main()
}
