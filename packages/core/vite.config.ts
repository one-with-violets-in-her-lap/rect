import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
})
