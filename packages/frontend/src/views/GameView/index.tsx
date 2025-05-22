import { useEffect, useRef, useState } from 'react'
import { Game, loadMapIfHost, type MultiPlayerSession } from 'rect'
import { buildClassName } from '@frontend/utils/class-names'
import { GameOverlay } from '@frontend/views/GameView/GameOverlay'

export function GameView({
    multiPlayerSession,
}: {
    multiPlayerSession: MultiPlayerSession
}) {
    const gameCanvasContainer = useRef<HTMLDivElement>(null)
    const isGameInitializing = useRef(false)
    const game = useRef<Game>(null)

    const [gameStatus, setGameStatus] = useState<
        'in-progress' | 'lost' | 'won'
    >('in-progress')

    async function initializeGame() {
        if (isGameInitializing.current) {
            console.log('Game is already being initialized. Skipping init')
            return
        }

        isGameInitializing.current = true

        if (!gameCanvasContainer.current) {
            throw new Error(
                'Canvas container element with ref `gameCanvasContainer` is not initialized',
            )
        }

        game.current = new Game(multiPlayerSession)

        game.current.doOnEnd = (isWinner) => {
            setGameStatus(isWinner ? 'won' : 'lost')

            scheduleGameRestart()
        }

        loadMapIfHost(game.current, multiPlayerSession)

        await game.current.initialize(gameCanvasContainer.current)
    }

    useEffect(() => {
        initializeGame()
    }, [])

    async function scheduleGameRestart() {
        setTimeout(async () => {
            if (game.current && gameCanvasContainer.current) {
                await game.current.destroy()

                game.current = null
                isGameInitializing.current = false

                await initializeGame()

                gameCanvasContainer.current.focus()

                setGameStatus('in-progress')
            }
        }, 1000)
    }

    return (
        <>
            <div
                className="flex h-svh w-screen items-center justify-center"
                ref={gameCanvasContainer}
            ></div>

            <GameOverlay multiPlayerSession={multiPlayerSession} />

            <div
                className={buildClassName(
                    'bg-stroke/50 d-flex fixed top-0 left-0 flex h-full w-full flex-col items-start justify-center p-20',
                    'transition-all duration-300 ease-in-out',
                    gameStatus === 'in-progress'
                        ? '-translate-y-full opacity-0'
                        : 'translate-y-0 opacity-100',
                )}
            >
                {gameStatus !== 'in-progress' && (
                    <h2 className="text-background mb-7 text-5xl font-semibold">
                        You {gameStatus === 'won' ? 'won' : 'lost'}
                    </h2>
                )}
            </div>
        </>
    )
}
