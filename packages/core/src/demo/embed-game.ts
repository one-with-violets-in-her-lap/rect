import '@core/demo/assets/styles/global.css'

import {
    connectToMultiPlayerSession,
    createGame,
    createMultiPlayerSession,
} from '@core/index'
import { Game } from '@core/lib/game'

embedGame()

async function embedGame() {
    const gameCanvas = document.querySelector('#gameCanvas')

    if (!gameCanvas || !(gameCanvas instanceof HTMLCanvasElement)) {
        throw new Error('Game canvas element is missing (#gameCanvas)')
    }

    const searchParams = new URLSearchParams(window.location.search)
    const isMultiPlayerEnabled = searchParams.get('multi-player') !== null
    const multiPlayerSessionToConnectTo = searchParams.get('connect')

    let game: Game

    if (isMultiPlayerEnabled && multiPlayerSessionToConnectTo === null) {
        const { sessionId, waitForOtherPlayerConnection } =
            await createMultiPlayerSession()

        alert(
            `Send your friend the link -> http://localhost:5173?multi-player&connect=${sessionId}`,
        )

        game = await createGame(await waitForOtherPlayerConnection())
    } else if (isMultiPlayerEnabled && multiPlayerSessionToConnectTo !== null) {
        game = await createGame(
            await connectToMultiPlayerSession(multiPlayerSessionToConnectTo),
        )
    } else {
        game = await createGame(null)
    }

    game.doOnEnd = async () => {
        await game.destroy()

        const gameCanvasClone = gameCanvas.cloneNode()
        gameCanvas.insertAdjacentElement('afterend', gameCanvasClone as Element)
        gameCanvas.remove()

        embedGame()
    }

    await game.initialize(gameCanvas)
}
