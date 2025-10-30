import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'

export default defineConfig({
    resolve: {
        alias: {
            '@core': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },

    optimizeDeps: {
        include: ['pixi.js'],
    },

    envDir: '../../',
})
