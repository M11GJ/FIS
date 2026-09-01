import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const commonRules = {
  'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
}

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      ...commonRules,
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    files: ['shared/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: { sourceType: 'module' },
    },
    rules: commonRules,
  },
  {
    files: ['admin-api/**/*.js', 'scripts/**/*.{js,cjs}', 'src/scripts/**/*.{js,cjs}', '*.{js,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: { sourceType: 'module' },
    },
    rules: commonRules,
  },
]
