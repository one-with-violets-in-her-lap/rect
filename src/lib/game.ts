import { Application } from 'pixi.js'
import { GameEntity } from '@/lib/entities'
import { Obstacle } from '@/lib/entities/obstacle'
import { CurrentControlledCharacter } from '@/lib/entities/character/controlled-character'
import { RemoteCharacter } from '@/lib/entities/character/remote-character'
import { MultiPlayerSession } from '@/lib/utils/webrtc-multiplayer'
import {
    createGameSynchronizer,
    GameSynchronizer,
} from '@/lib/multi-player-sync/game'

export async function createGame(multiPlayerSession: MultiPlayerSession) {
    const game = new Game(multiPlayerSession)

    if (multiPlayerSession.type === 'host') {
        game.addEntity(new CurrentControlledCharacter(game, { x: 0, y: 0 }))

        game.addEntity(
            new RemoteCharacter(
                game,
                { x: 500, y: 0 }, // TODO: fix hard-coded position
            ),
        )

        game.addEntity(new Obstacle(game, { x: 0, y: 700 }))
    }

    return game
}

export class Game {
    pixiApp: Application

    synchronizer: GameSynchronizer | null = null

    private readonly entities: GameEntity[] = []

    constructor(readonly multiPlayerSession?: MultiPlayerSession) {
        this.pixiApp = new Application()

        if (this.multiPlayerSession) {
            this.synchronizer = createGameSynchronizer(
                this,
                this.multiPlayerSession,
                (newEntity) => {
                    this.entities.push(newEntity)
                },
            )
        } else {
            console.warn(
                'Multi-player is not specified, so multi-player is disabled',
            )
        }
    }

    async initialize(canvasElement: HTMLCanvasElement) {
        await this.pixiApp.init({
            canvas: canvasElement,
            resizeTo: window,
            backgroundColor: '#FFFFFF',
        })

        if (this.multiPlayerSession?.type === 'host') {
            this.synchronizer?.sendGameInitialization()
        } else {
            await this.synchronizer?.waitForGameInitialization()
        }

        this.entities.forEach(async (entity) => {
            this.pixiApp.stage.addChild(await entity.initialize())
            this.pixiApp.ticker.add((ticker) => entity.update(ticker))
        })
    }

    getEntities() {
        return this.entities
    }

    addEntity(entity: GameEntity) {
        this.entities.push(entity)

        if (entity instanceof CurrentControlledCharacter) {
            this.synchronizer?.syncNewEntity({
                type: 'game/create-entity',
                entityId: entity.id,
                entityTypeName: 'remote-character',
                initialPosition: entity.initialPosition,
            })
        } else if (entity instanceof RemoteCharacter) {
            this.synchronizer?.syncNewEntity({
                type: 'game/create-entity',
                entityId: entity.id,
                entityTypeName: 'current-controlled-character',
                initialPosition: entity.initialPosition,
            })
        } else {
            this.synchronizer?.syncNewEntity({
                type: 'game/create-entity',
                entityId: entity.id,
                entityTypeName: entity.typeName,
                initialPosition: entity.initialPosition,
            })
        }
    }
}
