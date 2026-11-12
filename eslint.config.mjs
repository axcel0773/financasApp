import { FlatCompat } from '@eslint/eslintrc';
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // Clean Architecture: core não importa infra/ui/app
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@/infra/*', '@/ui/*', '@/app/*', 'next/*', 'react', '@supabase/*'] }],
    },
  },
];
