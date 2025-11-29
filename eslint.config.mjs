import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import node from 'eslint-plugin-n';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.ts', 'eslint.config.*'],
  },
  {
    ignores: [
      'node_modules/*',
      'dist/*',
      '**/*.test.ts.snap',
      '**/*.js',
      '!eslint.config.*',
    ],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.ts', 'eslint.config.*'],
  },
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
      prettier: eslintPluginPrettier,
      '@stylistic': stylistic,
      node,
    },
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },

    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'es5',
        },
      ],
      'node/no-process-env': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none',
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      curly: 'error',
      eqeqeq: 'error',
      'no-console': 'off',
      'no-eval': 'error',
      radix: 'error',
      'spaced-comment': 'error',
      'array-bracket-spacing': ['error', 'never'],
      'no-control-regex': 'off',

      'arrow-spacing': [
        'error',
        {
          before: true,
          after: true,
        },
      ],

      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],

      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['sibling', 'parent'],
            'index',
            'object',
            'type',
          ],

          pathGroups: [
            {
              pattern: 'src/configs',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: 'src/configs/*',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: 'src/**',
              group: 'internal',
              position: 'after',
            },
          ],

          pathGroupsExcludedImportTypes: ['type'],
          'newlines-between': 'always',

          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      /** `comma-dangle` 已被棄用，該設定移至 `@stylistic/comma-dangle` */
      '@stylistic/comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          tuples: 'always-multiline',
          functions: 'never',
        },
      ],
      /** `comma-spacing` 已被棄用，該設定移至 `@stylistic/comma-spacing` */
      '@stylistic/comma-spacing': [
        'error',
        {
          before: false,
          after: true,
        },
      ],

      'import/no-duplicates': [
        'error',
        {
          considerQueryString: true,
        },
      ],

      'key-spacing': [
        'error',
        {
          beforeColon: false,
          afterColon: true,
        },
      ],

      'keyword-spacing': [
        'error',
        {
          before: true,
          after: true,
        },
      ],

      'max-len': [
        'error',
        {
          code: 100,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],

      'no-multi-spaces': 'error',

      'no-irregular-whitespace': [
        'error',
        { skipStrings: true, skipTemplates: true },
      ],

      'no-multiple-empty-lines': [
        'error',
        {
          max: 1,
        },
      ],

      'no-trailing-spaces': 'error',

      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          ignoreIIFE: true,
          ignoreVoid: true,
        },
      ],

      'object-curly-spacing': ['error', 'always'],
      quotes: ['error', 'single'],
      semi: 'off',
      'semi-spacing': 'error',

      'space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],

      '@typescript-eslint/no-explicit-any': 'error',
      /** `@typescript-eslint/semi` 已被棄用，該設定移至 `@stylistic/semi` */
      '@stylistic/semi': ['error', 'always'],
      /** `@typescript-eslint/space-infix-ops` 已被棄用，該設定移至 `@stylistic/space-infix-ops` */
      '@stylistic/space-infix-ops': 'error',

      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public',
        },
      ],

      '@typescript-eslint/member-ordering': ['error'],
    },
  },
];
