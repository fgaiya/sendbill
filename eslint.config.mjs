import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      '**/node_modules/**',
      '**/.pnp/**',
      '**/.yarn/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/.next/**',
      '**/.open-next/**',
      '**/out/**',
      '**/build/**',
      '**/.DS_Store',
      '**/*.pem',
      '**/*.key',
      '**/*.cert',
      '**/*.crt',
      '**/*.tsbuildinfo',
      '**/next-env.d.ts',
      '**/.vercel/**',
      '**/.claude/**',
      '**/.memo/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  ...compat.extends('plugin:import/recommended'),
  {
    rules: {
      'import/no-named-as-default': 'off',
      // Import順序の統一ルール
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js組み込みモジュール
            'external', // 外部ライブラリ
            'internal', // 内部モジュール（@/パス）
            'parent', // 親ディレクトリ
            'sibling', // 同一ディレクトリ
            'index', // index.js
            'type', // 型のみのインポート
          ],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'next/**',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['react', 'next'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // 使用されていないimportを警告
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  ...compat.extends('prettier'),
];

export default eslintConfig;
