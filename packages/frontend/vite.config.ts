import { defineConfig, mergeConfig } from 'vite'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { baseViteConfig } from '../shared/src/vite.config'

// https://vite.dev/config/
export default defineConfig(mergeConfig(baseViteConfig, {
    plugins: [react()],
    resolve: {
        alias: {
            '@frontend': fileURLToPath(new URL('./src', import.meta.url)),
            '@core': fileURLToPath(new URL('../core/src', import.meta.url)),
            '@shared': fileURLToPath(new URL('../shared/src', import.meta.url)),
        },
    },
}))
