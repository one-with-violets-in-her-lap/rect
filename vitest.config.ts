import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig({
    ...viteConfig,
    test: {
        environment: 'happy-dom',
        server: {
            deps: {
                inline: ['vitest-canvas-mock'],
            },
        },
    },
})
