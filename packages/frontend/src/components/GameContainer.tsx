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
                console.log('Game was already initialized. Skipping init')
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
        <div className="w-ful mx-auto min-h-96">
            <canvas ref={gameCanvas}></canvas>
        </div>
    )
}
