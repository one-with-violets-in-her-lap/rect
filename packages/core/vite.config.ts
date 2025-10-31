import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [tailwindcss()],

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
