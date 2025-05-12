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

const GAME_CANVAS_WIDTH = 1900
const GAME_CANVAS_HEIGHT = 1000
const gameCanvasAspectRatio = GAME_CANVAS_WIDTH / GAME_CANVAS_HEIGHT

function resizeCanvas(canvasElement: HTMLCanvasElement) {
    const canvasWidthFromAspectRatio = window.innerHeight * gameCanvasAspectRatio
    const canvasHeightFromAspectRatio = window.innerWidth / gameCanvasAspectRatio

    if (canvasWidthFromAspectRatio <= window.innerWidth) {
        canvasElement.style.width = `${canvasWidthFromAspectRatio}px`
        canvasElement.style.height = `${window.innerHeight}px`
    } else {
        canvasElement.style.width = `${window.innerWidth}px`
        canvasElement.style.height = `${canvasHeightFromAspectRatio}px`
    }
}

export async function createGame(
    multiPlayerSession: MultiPlayerSession | null,
) {
    const game = new Game(multiPlayerSession)

    if (!multiPlayerSession || multiPlayerSession?.type === 'host') {
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
    private windowResizeHandler?: VoidFunction

    constructor(readonly multiPlayerSession?: MultiPlayerSession | null) {
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
            width: GAME_CANVAS_WIDTH,
            height: GAME_CANVAS_HEIGHT,
            backgroundColor: '#FFFFFF',
        })

        if (this.multiPlayerSession?.type === 'host') {
            this.synchronizer?.sendGameInitialization()
        } else {
            await this.synchronizer?.waitForGameInitialization()
        }

        this.windowResizeHandler = () => resizeCanvas(canvasElement)
        window.addEventListener('resize', this.windowResizeHandler)
        this.windowResizeHandler()

        this.entities.forEach(async (entity) => {
            this.pixiApp.stage.addChild(await entity.initialize())
            this.pixiApp.ticker.add((ticker) => entity.update(ticker))
        })
    }

    async destroy() {
        if (this.windowResizeHandler) {
            window.removeEventListener('resize', this.windowResizeHandler)
        }

        this.pixiApp.destroy()
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
