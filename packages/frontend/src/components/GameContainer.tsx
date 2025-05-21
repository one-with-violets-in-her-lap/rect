import { useEffect, useRef } from 'react'
import { createGame } from 'rect'
import type { MultiPlayerSession } from '@core/lib/utils/webrtc-multiplayer'

export function GameContainer({
    multiPlayerSession,
}: {
    multiPlayerSession: MultiPlayerSession
}) {
    const gameCanvas = useRef<HTMLCanvasElement>(null)
    const isGameInitialized = useRef(false)

    useEffect(() => {
        async function initializeGame() {
            if (isGameInitialized.current) {
                console.log('Game is already being initialized. Skipping init')
                return
            }

            isGameInitialized.current = true

            if (!gameCanvas.current) {
                throw new Error(
                    'Canvas element with ref `gameCanvas` is not initialized',
                )
            }

            const game = await createGame(multiPlayerSession)
            await game.initialize(gameCanvas.current)
        }

        initializeGame()
    }, [])

    return (
        <div className="w-full h-screen flex items-center justify-center">
            <canvas ref={gameCanvas} className="border border-stroke-tertiary"></canvas>
        </div>
    )
}
