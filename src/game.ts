import { Character } from '@/character'
import { Obstacle } from '@/obstacle'
import { Application } from 'pixi.js'

export class Game {
    pixiApp: Application

    constructor() {
        this.pixiApp = new Application()
    }

    async initialize(canvasElement: HTMLCanvasElement) {
        await this.pixiApp.init({
            canvas: canvasElement,
            resizeTo: window,
            backgroundColor: '#FFFFFF',
        })

        const gameEntities = [
            new Character(this),
            new Obstacle(this),
        ]
    
        gameEntities.forEach(async (entity) => {
            this.pixiApp.stage.addChild(await entity.initialize())
            this.pixiApp.ticker.add((ticker) => entity.update(ticker))
        })
    }
}
