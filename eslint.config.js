import css from '@eslint/css'
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig } from 'eslint/config'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import pluginReact from 'eslint-plugin-react'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'], plugins: { js, 'simple-import-sort': simpleImportSort, "@typescript-eslint": tseslint.plugin }, extends: ['js/recommended'],
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/order': 'off',
      'import/prefer-default-export': 0,
      'import/no-unresolved': 0,
    } },
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  tseslint.config({
    rules: {
      '@typescript-eslint/no-require-imports': ['error', { allowAsImport: true }],
      '@typescript-eslint/no-var-requires': 'off'
    }
  }),
  jsxA11y.flatConfigs.recommended,
  pluginReact.configs.flat.recommended,
  stylistic.configs['disable-legacy'],
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: false,
    commaDangle: 'never',
    jsx: true
  }),
  { files: ['**/*.css'], plugins: { css }, language: 'css/css', extends: ['css/recommended'] },
  { rules: {
    'arrow-body-style': ['error', 'as-needed'],
    'camelcase': ['error', { properties: 'always', ignoreDestructuring: true }],
    'complexity': ['error', 6],
    'curly': 'error',
    'default-case': 'error',
    'default-case-last': 'error',
    'default-param-last': 'error',
    'dot-notation': 'error',
    'eqeqeq': 'error',
    'func-names': ['error', 'as-needed'],
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'guard-for-in': 'error',
    'id-denylist': ['error', 'callback'],
    'id-length': [
      'error', { min: 3, max: 40, properties: 'never', exceptions: [
        '_', '__', 'i', 'j', 'fs', 't', 'to'
      ] }
    ],
    'max-depth': ['error', 2],
    'max-nested-callbacks': ['error', 3],
    'max-params': ['error', 4],
    'max-statements': ['error', 7],
    'new-cap': ['error', { newIsCap: true, capIsNew: true }],
    'no-console': 'error',
    'no-empty': 'error',
    'no-empty-function': ['error', { allow: ['constructors'] }],
    'no-template-curly-in-string': 'error',
    'no-undef-init': 'error',
    'no-var': 'error',
    'one-var': ['error', 'never'],
    'vars-on-top': 'error',
    'yoda': 'error',
    'radix': 'error',
    'semi': ['error', 'never'],
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/prop-types': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.jsx', '.tsx'] }],
    'react/jsx-no-bind': ['error', { allowArrowFunctions: true, allowFunctions: true, ignoreRefs: true }],
    'react/jsx-no-duplicate-props': ['error', { ignoreCase: false }],
    'react/no-array-index-key': 'warn',
    'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
    'react/jsx-key': 'warn',

    'array-bracket-newline': ['error', { multiline: true, minItems: 4 }],
    'array-element-newline': ['error', 'consistent'],
    'arrow-parens': ['error', 'as-needed'],
    'arrow-spacing': 'error',
    'block-spacing': 'error',
    'brace-style': 'error',
    'comma-spacing': 'error',
    'computed-property-spacing': ['error', 'never'],
    'dot-location': ['error', 'property'],
    'eol-last': ['error', 'always'],
    'function-call-argument-newline': ['error', 'consistent'],
    'function-paren-newline': ['error', 'multiline'],
    'generator-star-spacing': ['error', 'after'],
    'implicit-arrow-linebreak': ['error', 'beside'],
    'key-spacing': [
      'error', {
        beforeColon: false,
        afterColon: true,
        mode: 'strict'
      }
    ],
    'keyword-spacing': ['error', { after: true, before: true }],
    'lines-around-comment': ['error', { beforeBlockComment: true }],
    'lines-between-class-members': ['error', 'always'],
    'max-len': ['error', { code: 80, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
    'template-tag-spacing': ['error', 'always']
  } }
])
