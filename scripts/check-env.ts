#!/usr/bin/env node
// =============================================================================
// Mẹ & Bé — check-env: kiểm tra key-in-ready cho kết nối thật (PHASE 3).
//
// Chạy (không cần cài gì thêm — Node ≥ 22.6 hỗ trợ type-stripping):
//   node scripts/check-env.ts            # từ thư mục code/
//
// Script ĐỌC (theo thứ tự ưu tiên, giống runtime Next.js):
//   process.env  >  apps/web/.env.local  >  apps/web/.env
// Rồi in bảng: biến nào OK, biến nào THIẾU, và app sẽ chạy mock hay thật.
// KHÔNG crash khi thiếu key — chỉ báo rõ. Exit code luôn 0.
//
// Lưu ý: viết theo CommonJS (require) để node chạy .ts không cần "type":"module"
// trong package.json (file này đứng độc lập, không nằm trong build của Next).
// =============================================================================

const fs = require('node:fs')
const path = require('node:path')

// ---- tìm thư mục gốc (code/) — ưu tiên chỗ đặt script, fallback cwd ---------
const rootDir = fs.existsSync(path.join(__dirname, 'apps', 'web'))
  ? __dirname
  : process.cwd()

// ---- đọc file .env đơn giản (KEY=VALUE, bỏ comment, bỏ nháy) ----------------
function parseEnvFile(file: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!fs.existsSync(file)) return out
  for (const rawLine of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
    if (!m) continue
    let val = (m[2] as string).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[m[1] as string] = val
  }
  return out
}

// ---- gộp: process.env thắng, rồi .env.local, rồi .env -----------------------
const dotEnv = parseEnvFile(path.join(rootDir, 'apps', 'web', '.env'))
const dotEnvLocal = parseEnvFile(path.join(rootDir, 'apps', 'web', '.env.local'))

function valueOf(key: string): string | undefined {
  return process.env[key] ?? dotEnvLocal[key] ?? dotEnv[key]
}

// ---- định nghĩa các biến cần kiểm tra ---------------------------------------
interface VarDef {
  key: string
  group: 'supabase' | 'ai' | 'notify' | 'server'
  note: string
}

const VARS: VarDef[] = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    group: 'supabase',
    note: 'URL Supabase (Settings → API)',
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    group: 'supabase',
    note: 'Anon public key (Settings → API)',
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    group: 'server',
    note: 'Service role (server-only, bypass RLS) — cần cho seed/admin',
  },
  {
    key: 'OPENROUTER_API_KEY',
    group: 'ai',
    note: 'Gateway AI (chat, insight, quiz, OCR)',
  },
  {
    key: 'VAPID_PUBLIC_KEY',
    group: 'notify',
    note: 'Web Push public (đẩy hệ điều hành)',
  },
  {
    key: 'VAPID_PRIVATE_KEY',
    group: 'notify',
    note: 'Web Push private (server-only)',
  },
  {
    key: 'RESEND_API_KEY',
    group: 'notify',
    note: 'Gửi email thật (kênh email) — thiếu → fallback in-app',
  },
  {
    key: 'INGEST_KEY',
    group: 'notify',
    note: 'Inngest signing key',
  },
  {
    key: 'INGEST_URL',
    group: 'notify',
    note: 'Inngest SDK URL (vd https://<env-id>.inngest.ai)',
  },
  {
    key: 'LIBRARY_AI_BASE_URL',
    group: 'server',
    note: 'Thư viện AI (embed/suggest-stage/quiz-gen) — thiếu → fallback local',
  },
]

// ---- màu ANSI (chỉ khi chạy ở terminal) -------------------------------------
const tty = Boolean(process.stdout.isTTY)
const paint = (code: string, s: string): string => (tty ? `[${code}m${s}[0m` : s)
const green = (s: string): string => paint('32', s)
const red = (s: string): string => paint('31', s)
const yellow = (s: string): string => paint('33', s)
const dim = (s: string): string => paint('2', s)

// ---- in ---------------------------------------------------------------------
const groups = {
  supabase: { label: 'Backend dữ liệu', real: 'SUPABASE THẬT', mock: 'MOCK (demo)' },
  ai: { label: 'AI (chat/insight/quiz)', real: 'OPENROUTER THẬT', mock: 'MOCK/fallback' },
  notify: { label: 'Notification (Inngest)', real: 'INGEST THẬT', mock: 'MOCK (in-app)' },
}

const present = new Map<string, string>()
for (const v of VARS) {
  const val = valueOf(v.key)
  present.set(v.key, val && val.trim() ? val.trim() : '')
}

console.log('Cấu hình môi trường — Mẹ & Bé (key-in-ready)')
console.log(dim(`  root: ${rootDir}`))
const localPath = path.join(rootDir, 'apps', 'web', '.env.local')
const envPath = path.join(rootDir, 'apps', 'web', '.env')
console.log(
  dim(
    `  đã đọc: ${fs.existsSync(localPath) ? '.env.local' : '(không có .env.local)'}, ${fs.existsSync(envPath) ? '.env' : '(không có .env)'} + process.env`,
  ),
)
console.log('')

const pad = (s: string, n: number): string => s.padEnd(n)
console.log(`  ${pad('BIẾN', 34)} ${pad('TT', 9)} GHI CHÚ`)
console.log(`  ${'-'.repeat(72)}`)
for (const v of VARS) {
  const val = present.get(v.key) as string
  const isOk = val !== ''
  const status = isOk ? green('OK') : red('THIẾU')
  const src = isOk
    ? process.env[v.key]
      ? 'process.env'
      : dotEnvLocal[v.key]
        ? '.env.local'
        : '.env'
    : '-'
  console.log(`  ${pad(v.key, 34)} ${pad(status, 9)} ${dim(src.padEnd(11))}${v.note}`)
}
console.log('')

console.log('TÓM TẮT — app sẽ chạy:')
for (const g of ['supabase', 'ai', 'notify'] as const) {
  const vars = VARS.filter((v) => v.group === g)
  const missing = vars.filter((v) => !(present.get(v.key) as string))
  const okAll = missing.length === 0
  const partial = missing.length > 0 && missing.length < vars.length
  const missingTxt = ` (thiếu ${missing.map((m) => m.key).join(', ')})`
  let mode: string
  if (okAll) mode = green(groups[g].real)
  else if (partial) mode = yellow(groups[g].mock) + missingTxt
  else mode = red(groups[g].mock) + missingTxt
  console.log(`  • ${pad(groups[g].label + ':', 28)} ${mode}`)
}

const sr = present.get('SUPABASE_SERVICE_ROLE_KEY')
console.log(
  `  • ${pad('Service role:', 28)} ${sr ? green('OK') : yellow('KHÔNG CÓ (tùy chọn — chỉ cần cho seed/admin)')}`,
)

console.log('')
console.log(
  dim(
    'Ghi chú: còn thiếu key → app vẫn chạy ở chế độ mock/fallback, không lỗi. Chỉ cần điền vào apps/web/.env.local là chuyển sang backend thật.',
  ),
)
