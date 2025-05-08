import { Application } from 'pixi.js'
import { GameEntity } from '@/lib/game-entity'
import { Obstacle } from '@/lib/obstacle'
import { CurrentControlledCharacter } from '@/lib/entities/character/controlled-character'
import { RemoteCharacter } from '@/lib/entities/character/remote-character'

export async function createGame(canvasElement: HTMLCanvasElement) {
    const game = new Game()

    game.entities = [
        new CurrentControlledCharacter(game),
        new RemoteCharacter(game),
        new Obstacle(game),
    ]
    await game.initialize(canvasElement)
}

export class Game {
    pixiApp: Application

    entities: GameEntity[] = []

    constructor() {
        this.pixiApp = new Application()
    }

    async initialize(canvasElement: HTMLCanvasElement) {
        await this.pixiApp.init({
            canvas: canvasElement,
            resizeTo: window,
            backgroundColor: '#FFFFFF',
        })

        this.entities.forEach(async (entity) => {
            this.pixiApp.stage.addChild(await entity.initialize())
            this.pixiApp.ticker.add((ticker) => entity.update(ticker))
        })
    }
}
