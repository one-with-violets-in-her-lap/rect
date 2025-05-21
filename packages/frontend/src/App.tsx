import { useEffect, useRef, useState } from 'react'
import { connectToMultiPlayerSession } from 'rect'
import { CreateGameView } from '@frontend/components/CreateGameView'
import { GameContainer } from '@frontend/components/GameContainer'
import type { MultiPlayerState } from '@frontend/models/multi-player-state'

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
        <div className="mx-auto max-w-4xl px-6 py-46">
            {multiPlayer.status === 'loading' ? (
                <span>Loading...</span>
            ) : multiPlayer.status === 'connected' ? (
                <GameContainer
                    multiPlayerSession={multiPlayer.multiPlayerSession}
                />
            ) : (
                <CreateGameView
                    multiPlayer={multiPlayer}
                    onMultiPlayerStateUpdate={setMultiPlayer}
                />
            )}
        </div>
    )
}
