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

    const character = new Character(pixiApp.canvas, pixiApp.ticker)
    pixiApp.stage.addChild(await character.initializeSprite())

    pixiApp.stage.addChild(
        await new Obstacle(pixiApp.canvas).initializeSprite(),
    )
}
