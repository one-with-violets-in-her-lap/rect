import { Application } from '@pixi/react'
import { Character } from '@/Character'

export function App() {
    return (
        <>
            <Application resizeTo={window} backgroundColor="white">
                <Character />
            </Application>
        </>
    )
}
