import '@core/demo/assets/styles/global.css'

import {
    connectToMultiPlayerSession,
    createMultiPlayerSession,
} from '@core/index'
import { Game } from '@core/lib/game'
import { loadMapIfHost } from '@core/lib/map'

embedGame()

async function embedGame() {
    const gameContainer = document.querySelector('#gameContainer')

    if (!gameContainer || !(gameContainer instanceof HTMLElement)) {
        throw new Error('Game container element is missing (#gameContainer)')
    }

    const multiPlayerSession = await setupMultiPlayerIfEnabled()

    const game = new Game(multiPlayerSession)
    game.doOnEnd = async () => {
        await game.destroy()
        embedGame()
    }

    loadMapIfHost(game, multiPlayerSession)

    await game.initialize(gameContainer)
}

async function setupMultiPlayerIfEnabled() {
    const iceServers = await fetch(import.meta.env.VITE_ICE_SERVERS_URL).then(
        (response) => response.json(),
    )

    const searchParams = new URLSearchParams(window.location.search)
    const isMultiPlayerEnabled = searchParams.get('multi-player') !== null
    const multiPlayerSessionToConnectTo = searchParams.get('connect')

    if (isMultiPlayerEnabled && multiPlayerSessionToConnectTo === null) {
        const { sessionId, waitForOtherPlayerConnection } =
            await createMultiPlayerSession(iceServers)

        alert(
            `Send your friend the link -> http://localhost:5173?multi-player&connect=${sessionId}`,
        )

        return await waitForOtherPlayerConnection()
    } else if (isMultiPlayerEnabled && multiPlayerSessionToConnectTo !== null) {
        return await connectToMultiPlayerSession(
            multiPlayerSessionToConnectTo,
            iceServers,
        )
    } else {
        return null
    }
}
