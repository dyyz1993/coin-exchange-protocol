const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      '!.eslintrc.js',
      'docs/**',
      'public/**',
      'histories/**',
      '*.json',
      '*.md',
      '*.html',
      '*.css',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        // Bun globals
        Bun: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        // Timer globals
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,

      // TypeScript 严格规则
      '@typescript-eslint/no-explicit-any': 'error', // 改为 error
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error', // 新增：Promise 必须处理
      '@typescript-eslint/no-misused-promises': 'error', // 新增：禁止在条件中使用 Promise
      '@typescript-eslint/strict-boolean-expressions': ['error', { // 新增：严格布尔表达式
        allowString: true,
        allowNumber: true,
        allowNullableObject: true,
      }],
      '@typescript-eslint/no-unnecessary-type-assertion': 'error', // 新增：禁止不必要的类型断言
      '@typescript-eslint/prefer-nullish-coalescing': 'error', // 新增：优先使用 ?? 而不是 ||
      '@typescript-eslint/prefer-optional-chain': 'error', // 新增：优先使用可选链

      // 通用规则
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
    },
  },
  {
    // 测试文件规则放宽
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'off', // 测试中允许未处理的 Promise
      '@typescript-eslint/no-misused-promises': 'off', // 测试中允许
      '@typescript-eslint/strict-boolean-expressions': 'off', // 测试中放宽
    },
  },
];
