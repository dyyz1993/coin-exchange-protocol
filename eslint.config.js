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
      '@typescript-eslint/no-explicit-any': 'error', // 从 warn 改为 error，禁止 any 类型
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'warn', // 警告非空断言
      '@typescript-eslint/prefer-nullish-coalescing': 'warn', // 建议使用 ?? 运算符
      '@typescript-eslint/prefer-optional-chain': 'warn', // 建议使用可选链
      '@typescript-eslint/strict-boolean-expressions': 'off', // 严格布尔表达式（暂时关闭，避免大量修改）

      // 通用代码质量规则
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-debugger': 'error', // 禁止 debugger 语句
      'no-duplicate-imports': 'error', // 禁止重复导入
      'no-template-curly-in-string': 'warn', // 警告字符串中的模板字面量
      'no-unreachable': 'error', // 禁止不可达代码
      'no-unsafe-finally': 'error', // 禁止不安全的 finally
      'no-unsafe-negation': 'error', // 禁止对关系运算符的左操作数使用否定操作符
    },
  },
  {
    // 测试文件规则放宽
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
