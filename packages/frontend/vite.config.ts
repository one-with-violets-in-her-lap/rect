import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@frontend': fileURLToPath(new URL('./src', import.meta.url)),
            '@core': fileURLToPath(new URL('../core/src', import.meta.url)),
        },
    },
})
