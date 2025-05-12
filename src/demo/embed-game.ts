import '@/demo/assets/styles/global.css'

import {
    connectToMultiPlayerSession,
    createGame,
    createMultiPlayerSession,
} from '@/index'

embedGame()

async function embedGame() {
    const gameCanvas = document.querySelector('#gameCanvas')

    if (!gameCanvas || !(gameCanvas instanceof HTMLCanvasElement)) {
        throw new Error('Game canvas element is missing (#gameCanvas)')
    }

    const searchParams = new URLSearchParams(window.location.search)
    const isMultiPlayerEnabled = searchParams.get('multi-player') !== null
    const multiPlayerSessionToConnectTo = searchParams.get('connect')

    if (isMultiPlayerEnabled && multiPlayerSessionToConnectTo === null) {
        createMultiPlayerSession().then(
            async ({ sessionId, waitForOtherPlayerConnection }) => {
                alert(
                    `Send your friend the link -> http://localhost:5173?multi-player&connect=${sessionId}`,
                )

                const multiPlayer = await waitForOtherPlayerConnection()

                const game = await createGame(multiPlayer)

                await game.initialize(gameCanvas)
            },
        )
    } else if (isMultiPlayerEnabled && multiPlayerSessionToConnectTo !== null) {
        connectToMultiPlayerSession(multiPlayerSessionToConnectTo).then(
            async (multiPlayer) => {
                const game = await createGame(multiPlayer)

                await game.initialize(gameCanvas)
            },
        )
    } else {
        const game = await createGame(null)
        await game.initialize(gameCanvas)
    }
}
