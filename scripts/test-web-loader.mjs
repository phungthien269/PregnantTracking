// ===========================================================================
// test-web-loader.mjs — loader riêng cho `scripts/test-web.sh` (KHÔNG đụng
// `apps/web/lib/library/node-loader.mjs` của agent 6). Chạy check/test .ts
// của apps/web với import không đuôi, kèm:
//   - `next/server`  → `next/server.js` (api-utils.ts import bare `next/server`,
//     Node ESM không cho không đuôi → thêm `.js`).
//   - import directory (`./family`, `../pregnancy`) → `/index.ts` — để test
//     có thể import `@mevabe/domain` thật (domain index dùng directory import).
// Dùng chung cho mọi file: `node --experimental-strip-types --import test-web-loader.mjs <file>`.
// ===========================================================================

import { existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { registerHooks } from 'node:module'

registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL ?? ''
    // Không đụng node_modules (CJS bên trong supabase-js dùng specifier
    // không đuôi là hợp lệ).
    if (parent.includes('/node_modules/')) return nextResolve(specifier, context)

    if (specifier === 'next/server') return nextResolve('next/server.js', context)

    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      // Đã có đuôi → giữ nguyên.
      if (/\.(ts|mjs|cjs|js|json)$/.test(specifier)) return nextResolve(specifier, context)
      // Directory import → `./<dir>/index.ts`.
      const base = new URL(specifier, parent)
      const p = fileURLToPath(base)
      if (existsSync(p) && statSync(p).isDirectory()) {
        return nextResolve(specifier + '/index.ts', context)
      }
      return nextResolve(specifier + '.ts', context)
    }

    // `@/` → apps/web/ (tsconfig paths). Cho phép check import route handler / file
    // dùng alias `@/lib/...` (route /api/v1 đều import `@/lib/api-utils`).
    if (specifier.startsWith('@/')) {
      const webRoot = new URL('../apps/web/', import.meta.url)
      const rel = specifier.slice(2) // bỏ `@/` → `lib/...`
      const base = new URL(rel, webRoot)
      const p = fileURLToPath(base)
      const withDot = './' + rel
      if (existsSync(p) && statSync(p).isDirectory()) {
        return nextResolve(withDot + '/index.ts', { ...context, parentURL: webRoot.href })
      }
      return nextResolve(withDot + '.ts', { ...context, parentURL: webRoot.href })
    }
    return nextResolve(specifier, context)
  },
})
