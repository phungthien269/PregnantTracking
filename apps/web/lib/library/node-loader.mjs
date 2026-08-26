// ===========================================================================
// node-loader.mjs — để `node --experimental-strip-types` chạy self-check .ts
// với import tương đối KHÔNG có extension (Next/bundler cho phép, Node ESM thì
// không). Dùng chung cho check.ts và mock.ts.
//   cd apps/web && node --experimental-strip-types --import ./lib/library/node-loader.mjs lib/library/check.ts
// ===========================================================================

import { registerHooks } from 'node:module'

registerHooks({
  resolve(specifier, context, nextResolve) {
    // Chỉ rewrite import tương đối của source app — không đụng node_modules
    // (CJS bên trong supabase-js dùng specifier không extension là hợp lệ).
    const parent = context.parentURL ?? ''
    if (parent.includes('/node_modules/')) return nextResolve(specifier, context)
    if (
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      !/\.(ts|mjs|cjs|js|json)$/.test(specifier)
    ) {
      return nextResolve(`${specifier}.ts`, context)
    }
    return nextResolve(specifier, context)
  },
})
