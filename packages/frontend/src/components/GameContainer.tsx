import { useEffect, useRef, useState } from 'react'
import { createGame } from 'rect'
import type { MultiPlayerSession } from '@core/lib/utils/webrtc-multiplayer'
import { buildClassName } from '@frontend/utils/class-names'
import { AppButton } from '@frontend/components/ui/AppButton'

export function GameContainer({
    multiPlayerSession,
}: {
    multiPlayerSession: MultiPlayerSession
}) {
    const gameCanvas = useRef<HTMLCanvasElement>(null)
    const isGameInitialized = useRef(false)

    const [gameStatus, setGameStatus] = useState<
        'in-progress' | 'lost' | 'won'
    >('in-progress')

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

            game.doOnEnd = (isWinner) => {
                setGameStatus(isWinner ? 'won' : 'lost')
            }

            await game.initialize(gameCanvas.current)
        }

        initializeGame()
    }, [])

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <canvas ref={gameCanvas}></canvas>

            <div
                className={buildClassName(
                    'bg-stroke/50 d-flex fixed top-0 left-0 flex h-full w-full flex-col items-start justify-center p-20',
                    'transition-all duration-300',
                    gameStatus === 'in-progress'
                        ? '-translate-y-full opacity-0'
                        : 'translate-y-0 opacity-100',
                )}
            >
                <h2 className="text-background mb-7 text-5xl font-semibold">
                    You {gameStatus === 'won' ? 'won' : 'lost'}
                </h2>

                <AppButton>Restart</AppButton>
            </div>
        </div>
    )
}
