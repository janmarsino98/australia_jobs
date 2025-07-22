module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true, jest: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: { 
    ecmaVersion: 'latest', 
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/prop-types': 'off', // We use TypeScript for prop validation
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'no-unused-vars': 'off', // Use TypeScript version instead
    '@typescript-eslint/no-explicit-any': 'off', // Allow any for now during migration
    'react/no-unescaped-entities': 'off', // Allow quotes in JSX text
    'react-hooks/exhaustive-deps': 'warn', // Warn instead of error for hooks deps
    'react-hooks/rules-of-hooks': 'error', // Keep this as error - it's important
    '@typescript-eslint/no-require-imports': 'off', // Allow require() in config files
  },
}
