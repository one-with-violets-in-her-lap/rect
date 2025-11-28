import type { UserConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export const baseViteConfig: UserConfig = {
    plugins: [
        tailwindcss(),
        process.env.VITE_ENABLE_DEV_SSL
            ? basicSsl({ name: 'rect-testing' })
            : [],
    ],

    envDir: '../../',
}
