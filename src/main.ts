import '@/assets/styles/global.css'

import { Game } from '@/game'

const gameCanvas = document.querySelector('#gameCanvas')

if (!gameCanvas || !(gameCanvas instanceof HTMLCanvasElement)) {
    throw new Error('Game canvas element is missing (#gameCanvas)')
}

new Game().initialize(gameCanvas)
