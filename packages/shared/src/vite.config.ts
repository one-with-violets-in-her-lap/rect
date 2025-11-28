import type { UserConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export const baseViteConfig: UserConfig = {
    plugins: [tailwindcss(), basicSsl({ name: 'rect-testing' })],

    envDir: '../../',
}
