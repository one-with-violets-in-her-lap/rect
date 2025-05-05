import { Character } from '@/character'
import { Obstacle } from '@/obstacle'
import { Application } from 'pixi.js'

export async function initializeGame(canvasElement: HTMLCanvasElement) {
    const pixiApp = new Application()

    await pixiApp.init({
        canvas: canvasElement,
        resizeTo: window,
        backgroundColor: '#FFFFFF',
    })

    const gameEntities = [
        new Character(pixiApp.canvas),
        new Obstacle(pixiApp.canvas),
    ]

    gameEntities.forEach(async (entity) => {
        pixiApp.stage.addChild(await entity.initialize())
        pixiApp.ticker.add((ticker) => entity.update(ticker))
    })
}
