import { useEffect, useRef } from 'react'
import { createGame } from 'rect'
import type { MultiPlayerSession } from '@core/lib/utils/webrtc-multiplayer'
import type { Game } from '@core/lib/game'

export function GameContainer({
    multiPlayerSession,
}: {
    multiPlayerSession: MultiPlayerSession
}) {
    const gameCanvas = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        let destroyed = false
        let game: Game | undefined = undefined

        async function initializeGame() {
            if (!gameCanvas.current) {
                throw new Error(
                    'Canvas element with ref `gameCanvas` is not initialized',
                )
            }

            game = await createGame(multiPlayerSession)

            if (destroyed) {
                console.log('Component is destroyed, game init cancelled')
                return
            }

            await game.initialize(gameCanvas.current)

            if (destroyed) {
                console.log('Component is destroyed, destroying the game')
                await game.destroy()
            }
        }

        initializeGame()

        return () => {
            destroyed = true

            if (game) {
                console.log('Component is destroyed, destroying the game')
                game.destroy()
            }
        }
    }, [])

    return (
        <div className="w-ful mx-auto min-h-96">
            <canvas ref={gameCanvas}></canvas>
        </div>
    )
}
