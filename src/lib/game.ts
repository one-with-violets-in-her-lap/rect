import { Application } from 'pixi.js'
import { GameEntity } from '@/lib/entities'
import { Obstacle } from '@/lib/entities/obstacle'
import { CurrentControlledCharacter } from '@/lib/entities/character/controlled-character'
import { RemoteCharacter } from '@/lib/entities/character/remote-character'
import { MultiPlayerSession } from '@/lib/utils/webrtc-multiplayer'

export async function createGame(
    multiPlayerSession: MultiPlayerSession,
    currentCharacterPosition: 'left' | 'right',
    remoteCharacterPosition: 'left' | 'right',
) {
    const game = new Game(multiPlayerSession)

    game.entities = [
        new CurrentControlledCharacter(
            game,
            currentCharacterPosition === 'left'
                ? { x: 0, y: 0 }
                : { x: 500, y: 0 },
        ),
        new RemoteCharacter(
            game,
            remoteCharacterPosition === 'left'
                ? { x: 0, y: 0 }
                : { x: 500, y: 0 }, // TODO: fix hard-coded position
        ),
        new Obstacle(game, { x: 0, y: 700 }),
    ]

    return game
}

export class Game {
    pixiApp: Application

    entities: GameEntity[] = []

    constructor(readonly multiPlayerSession: MultiPlayerSession) {
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
