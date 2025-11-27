import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import markdown from '@eslint/markdown'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
    globalIgnores(['./dist/']),

    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        plugins: { js },
        extends: ['js/recommended'],
    },

    {
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    caughtErrors: 'none',
                },
            ],
        },
    },

    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        languageOptions: { globals: globals.browser },
    },

    tseslint.configs.recommended,

    {
        files: ['**/*.md'],
        plugins: { markdown },
        language: 'markdown/commonmark',
        extends: ['markdown/recommended'],
    },
])
