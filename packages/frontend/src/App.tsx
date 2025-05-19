import { useEffect, useState } from 'react'
import { connectToMultiPlayerSession } from 'rect'
import { CreateGameView } from '@frontend/components/CreateGameView'
import { GameContainer } from '@frontend/components/GameContainer'
import type { MultiPlayerState } from '@frontend/models/multi-player-state'

export function App() {
    const [multiPlayer, setMultiPlayer] = useState<MultiPlayerState>({
        status: 'loading',
    })

    async function connectToGame() {
        const searchParams = new URLSearchParams(window.location.search)
        const multiPlayerSessionToConnectTo = searchParams.get('connect')

        if (multiPlayerSessionToConnectTo !== null) {
            setMultiPlayer({
                status: 'connected',
                multiPlayerSession: await connectToMultiPlayerSession(
                    multiPlayerSessionToConnectTo,
                ),
            })
        } else {
            setMultiPlayer({
                status: 'not-initialized',
            })
        }
    }

    useEffect(() => {
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
