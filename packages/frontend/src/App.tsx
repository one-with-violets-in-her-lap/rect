import { useEffect, useRef, useState } from 'react'
import { Toaster } from 'sonner'
import { connectToMultiPlayerSession } from 'rect'
import { CreateGameView } from '@frontend/views/CreateGameView'
import { GameView } from '@frontend/views/GameView'
import type { MultiPlayerState } from '@frontend/models/multi-player-state'
import { AppSpinner } from '@frontend/components/ui/AppSpinner'

export function App() {
    const [multiPlayer, setMultiPlayer] = useState<MultiPlayerState>({
        status: 'loading',
    })
    const isMultiPlayerInitializing = useRef(false)

    useEffect(() => {
        async function connectToGame() {
            if (isMultiPlayerInitializing.current) {
                console.log(
                    'Multi-player is already initializing. Skipping init',
                )
                return
            }

            isMultiPlayerInitializing.current = true

            const searchParams = new URLSearchParams(window.location.search)
            const multiPlayerSessionToConnectTo = searchParams.get('connect')

            if (multiPlayerSessionToConnectTo !== null) {
                const multiPlayerSession = await connectToMultiPlayerSession(
                    multiPlayerSessionToConnectTo,
                )

                setMultiPlayer({
                    status: 'connected',
                    multiPlayerSession: multiPlayerSession,
                })
            } else {
                setMultiPlayer({
                    status: 'not-initialized',
                })
            }
        }

        connectToGame()
    }, [])

    return (
        <>
            <Toaster
                richColors
                className="text-xl"
                toastOptions={{
                    style: { fontSize: '18px' },
                    closeButton: true,
                    duration: 3000,
                }}
            />

            {multiPlayer.status === 'loading' ? (
                <AppSpinner className="mx-auto my-24" />
            ) : multiPlayer.status === 'connected' ? (
                <GameView multiPlayerSession={multiPlayer.multiPlayerSession} />
            ) : (
                <CreateGameView
                    multiPlayer={multiPlayer}
                    onMultiPlayerStateUpdate={setMultiPlayer}
                />
            )}
        </>
    )
}
