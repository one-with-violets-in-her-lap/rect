import { useEffect, useRef } from 'react'
import { createGame } from 'rect'
import type { MultiPlayerSession } from '@core/lib/utils/webrtc-multiplayer'
import type { Game } from '@core/lib/game'

export function GameContainer({
    multiPlayerSession,
}: {
    multiPlayerSession: MultiPlayerSession
}) {
    // const gameCanvas = useRef<HTMLCanvasElement>(null)
    // const game = useRef<Game>(null)

    // useEffect(() => {
    //     let destroyed = false

    //     async function initializeGame() {
    //         if (!gameCanvas.current) {
    //             throw new Error(
    //                 'Canvas element with ref `gameCanvas` is not initialized',
    //             )
    //         }

    //         game.current = await createGame(multiPlayerSession)
        
    //         console.log('Initializing game')

    //         if (!destroyed) {
    //             await game.current.initialize(gameCanvas.current)
    //         } else {
    //             console.log('Component is destroyed, game init cancelled')
    //             await game.current.destroy()
    //             return
    //         }

    //         if (destroyed) {
    //             console.log('Component is destroyed, game will be destroyed')
    //             await game.current.destroy()
    //         }
    //     }

    //     initializeGame()

    //     return () => {
    //         destroyed = true

    //         if (game.current) {
    //             console.log('Destroying')
    //             game.current.destroy()
    //         }
    //     }
    // }, [])

    return (
        <div className="bg-pink-700 w-full mx-auto min-h-96">
            
        </div>
    )
}
