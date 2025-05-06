import { Character } from '@/character'
import { checkIfBoundsColliding } from '@/collisions'
import { GameEntity } from '@/game-entity'
import { Obstacle } from '@/obstacle'
import { Application, Bounds } from 'pixi.js'

export class Game {
    pixiApp: Application

    private entities: GameEntity[] = []

    constructor() {
        this.pixiApp = new Application()
    }

    async initialize(canvasElement: HTMLCanvasElement) {
        await this.pixiApp.init({
            canvas: canvasElement,
            resizeTo: window,
            backgroundColor: '#FFFFFF',
        })

        this.entities = [new Character(this), new Obstacle(this)]

        this.entities.forEach(async (entity) => {
            this.pixiApp.stage.addChild(await entity.initialize())
            this.pixiApp.ticker.add((ticker) => entity.update(ticker))
        })
    }

    checkIfNewEntityPositionColliding(
        entityToCheck: GameEntity,
        newPosition: { x: number; y: number },
    ) {
        return this.entities.some((entity) => {
            if (entity === entityToCheck) {
                return false
            }

            return checkIfBoundsColliding(
                entity.getPixiObjectOrThrow().getBounds(),
                new Bounds(
                    newPosition.x,
                    newPosition.y,
                    newPosition.x + entityToCheck.getPixiObjectOrThrow().width,
                    newPosition.y + entity.getPixiObjectOrThrow().height,
                ),
            )
        })
    }
}
