module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    // project: './tsconfig.json', // 临时禁用，避免类型检查问题
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    // 'plugin:@typescript-eslint/recommended-requiring-type-checking', // 需要project配置，暂时禁用
  ],
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    jest: true,
    es2020: true,
  },
  rules: {
    // TypeScript 相关规则
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    
    // 通用规则
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
  },
  overrides: [
    {
      // 测试文件规则放宽
      files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist',
    'node_modules',
    'coverage',
    '*.js',
    '!.eslintrc.js',
  ],
};
