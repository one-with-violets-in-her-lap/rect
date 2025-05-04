import './global.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/App.tsx'
import { extend } from '@pixi/react'
import { Application, Sprite } from 'pixi.js'

extend({ Sprite, Application })

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
