import '@/assets/styles/global.css'

import { createGame } from '@/lib/game'
import {
    connectToMultiPlayerSession,
    createMultiPlayerSession,
} from '@/lib/utils/webrtc-multiplayer'

const gameCanvas = document.querySelector('#gameCanvas')

if (!gameCanvas || !(gameCanvas instanceof HTMLCanvasElement)) {
    throw new Error('Game canvas element is missing (#gameCanvas)')
}

const multiPlayerSessionToConnectTo = new URLSearchParams(
    window.location.search,
).get('connect')
if (multiPlayerSessionToConnectTo === null) {
    createMultiPlayerSession().then(
        async ({ sessionId, waitForOtherPlayerConnection }) => {
            alert(
                `Send your friend the link -> http://localhost:5173?connect=${sessionId}`,
            )

            const multiPlayer = await waitForOtherPlayerConnection()

            const game = await createGame(multiPlayer)

            await game.initialize(gameCanvas)
        },
    )
} else {
    connectToMultiPlayerSession(multiPlayerSessionToConnectTo).then(
        async (multiPlayer) => {
            const game = await createGame(multiPlayer)

            await game.initialize(gameCanvas)
        },
    )
}
