import { useEffect, useRef, useState } from 'react'
import { Game, loadMapIfHost, type MultiPlayerSession } from 'rect'
import { buildClassName } from '@frontend/utils/class-names'
import { GameOverlay } from '@frontend/views/GameView/GameOverlay'
import type { GameResult, GameResultError } from '@core/lib/game'
import { AppButton } from '@frontend/components/ui/AppButton'

const GAME_RESULT_MESSAGES: Record<GameResult['status'], string> = {
    error: 'The game stopped',
    lost: 'You lost',
    won: 'You won',
}

const GAME_ERROR_MESSAGES: Record<GameResultError, string> = {
    'opponent-disconnected': 'The opponent was disconnected',
}

export function GameView({
    multiPlayerSession,
    onBackToMenu,
}: {
    multiPlayerSession: MultiPlayerSession
    onBackToMenu: () => void
}) {
    const gameCanvasContainer = useRef<HTMLDivElement>(null)
    const isGameInitializing = useRef(false)
    const game = useRef<Game>(null)

    const [gameStatus, setGameStatus] = useState<
        | {
              status: 'in-progress' | 'won' | 'lost'
          }
        | {
              status: 'error'
              error: GameResultError
          }
    >({ status: 'in-progress' })

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

        game.current = new Game(gameCanvasContainer.current, multiPlayerSession)

        game.current.doOnEnd = (result) => {
            setGameStatus(
                result.status === 'error'
                    ? {
                          status: 'error',
                          error: result.error,
                      }
                    : { status: result.status },
            )

            if (result.status === 'error') {
                return
            }

            scheduleGameRestart()
        }

        loadMapIfHost(game.current, multiPlayerSession)

        await game.current.initialize()
    }

    useEffect(() => {
        document.title = 'Rect | In-game'
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

                setGameStatus({ status: 'in-progress' })
            }
        }, 1000)
    }

    async function goBackToMenu() {
        if (game.current && gameCanvasContainer.current) {
            await game.current.destroy()

            game.current = null
            isGameInitializing.current = false
        }

        onBackToMenu()
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
                    'bg-stroke/70 fixed top-0 left-0 flex h-full w-full flex-col items-start justify-center p-20 backdrop-blur-xs',
                    'transition-all duration-300 ease-in-out',
                    gameStatus.status === 'in-progress'
                        ? '-translate-y-full opacity-0'
                        : 'translate-y-0 opacity-100',
                )}
            >
                {gameStatus.status !== 'in-progress' && (
                    <>
                        <h2 className="text-background mb-4 text-5xl font-semibold">
                            {GAME_RESULT_MESSAGES[gameStatus.status]}
                        </h2>

                        {gameStatus.status === 'error' && (
                            <>
                                <p className="text-background mb-4 text-base font-light">
                                    {GAME_ERROR_MESSAGES[gameStatus.error]}
                                </p>

                                <AppButton onClick={goBackToMenu}>
                                    To menu
                                </AppButton>
                            </>
                        )}
                    </>
                )}
            </div>
        </>
    )
}
