import { defineConfig, mergeConfig } from 'vite'
import { fileURLToPath } from 'url'
import { baseViteConfig } from '../shared/src/vite.config'

export default defineConfig(mergeConfig(baseViteConfig, {
    resolve: {
        alias: {
            '@core': fileURLToPath(new URL('./src', import.meta.url)),
            '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
        },
    },

    optimizeDeps: {
        include: ['pixi.js'],
    },
}))
