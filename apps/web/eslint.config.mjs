import { FlatCompat } from '@eslint/eslintrc'

// ===========================================================================
// ESLint flat config (Next.js 15 khuyến nghị — `next lint` deprecated).
// Dùng FlatCompat để tái dùng eslint-config-next (còn dạng legacy config).
// ===========================================================================

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Dự án dùng `_` prefix cho biến không dùng — tôn trọng quy ước đó.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
]

export default eslintConfig
