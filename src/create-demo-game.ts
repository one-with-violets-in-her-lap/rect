import '@/assets/styles/global.css'

import { createGame } from '@/lib/game'

const gameCanvas = document.querySelector('#gameCanvas')

if (!gameCanvas || !(gameCanvas instanceof HTMLCanvasElement)) {
    throw new Error('Game canvas element is missing (#gameCanvas)')
}

createGame(gameCanvas)
