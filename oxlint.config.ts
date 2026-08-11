import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  env: {
    es2024: true,
    node: true,
  },
  plugins: ['typescript', 'unicorn'],
  rules: {
    'no-console': 'warn',
    'no-shadow': 'off',
    'typescript/consistent-type-imports': 'error',
    'unicorn/consistent-function-scoping': 'off',
  },
});
