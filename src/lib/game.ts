import { Application, Rectangle, Ticker, TickerCallback } from 'pixi.js'
import { GameEntity } from '@/lib/entities'
import { Obstacle } from '@/lib/entities/obstacle'
import { Character } from '@/lib/entities/character'
import { MultiPlayerSession } from '@/lib/utils/webrtc-multiplayer'
import {
    createGameSynchronizer,
    GameSynchronizer,
} from '@/lib/multi-player-sync/game'
import { RectGameError } from '@/lib/utils/errors'

const GAME_CANVAS_WIDTH = 1900
const GAME_CANVAS_HEIGHT = 950
const gameCanvasAspectRatio = GAME_CANVAS_WIDTH / GAME_CANVAS_HEIGHT

function resizeCanvas(canvasElement: HTMLCanvasElement) {
    if (!canvasElement.parentElement) {
        throw new RectGameError('Canvas element must have a container')
    }

    const canvasWidthFromAspectRatio =
        canvasElement.parentElement.clientHeight * gameCanvasAspectRatio
    const canvasHeightFromAspectRatio =
        canvasElement.parentElement.clientWidth / gameCanvasAspectRatio

    if (canvasWidthFromAspectRatio <= canvasElement.parentElement.clientWidth) {
        canvasElement.style.width = `${canvasWidthFromAspectRatio}px`
        canvasElement.style.height = `${canvasElement.parentElement.clientHeight}px`
    } else {
        canvasElement.style.width = `${canvasElement.parentElement.clientWidth}px`
        canvasElement.style.height = `${canvasHeightFromAspectRatio}px`
    }
}

export async function createGame(
    multiPlayerSession: MultiPlayerSession | null,
) {
    const game = new Game(multiPlayerSession)

    if (!multiPlayerSession || multiPlayerSession.type === 'host') {
        game.addEntityAndSyncMultiPlayer(new Character(game, { x: 0, y: 0 }))

        game.addEntityAndSyncMultiPlayer(new Obstacle(game, { x: 0, y: 700 }))

        game.addEntityAndSyncMultiPlayer(
            new Character(
                game,
                { x: 500, y: 0 }, // TODO: fix hard-coded position
                undefined,
                true,
            ),
        )
    }

    return game
}

export class Game {
    pixiApp: Application

    synchronizer: GameSynchronizer | null = null

    entities: GameEntity[] = []
    private tickerCallbacksByEntityId: Record<string, TickerCallback<Ticker>> =
        {}

    private windowResizeHandler?: VoidFunction

    private initialized = false

    constructor(readonly multiPlayerSession?: MultiPlayerSession | null) {
        this.pixiApp = new Application()

        if (this.multiPlayerSession) {
            this.synchronizer = createGameSynchronizer(
                this,
                this.multiPlayerSession,
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

        this.pixiApp.stage.interactive = true
        this.pixiApp.stage.hitArea = new Rectangle(
            0,
            0,
            GAME_CANVAS_WIDTH,
            GAME_CANVAS_HEIGHT,
        )

        if (this.multiPlayerSession?.type === 'host') {
            this.synchronizer?.sendGameInitialization()
        } else {
            await this.synchronizer?.waitForGameInitialization()
        }

        this.windowResizeHandler = () => resizeCanvas(canvasElement)
        window.addEventListener('resize', this.windowResizeHandler)
        this.windowResizeHandler()

        this.initialized = true
        this.entities.forEach((entity) => this.addEntityToPixiApp(entity))
    }

    async stopWithAnimation() {
        this.pixiApp.ticker.speed = 0.3
        setTimeout(() => {
            this.pixiApp.stop()
        }, 1000)
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

    addEntityAndSyncMultiPlayer(entity: GameEntity) {
        this.entities.push(entity)

        this.synchronizer?.syncNewEntity({
            type: 'game/create-entity',
            entityId: entity.id,
            entityTypeName: entity.typeName,
            initialPosition: entity.initialPosition,
            isRemote: !entity.isRemote,
        })

        this.addEntityToPixiApp(entity)
    }

    async destroyEntity(
        entityToDelete: GameEntity,
        syncWithMultiPlayer = true,
    ) {
        this.pixiApp.ticker.remove(
            this.tickerCallbacksByEntityId[entityToDelete.id],
        )

        this.entities = this.entities.filter(
            (entity) => entity.id !== entityToDelete.id,
        )

        entityToDelete.cleanup()

        if (syncWithMultiPlayer) {
            this.synchronizer?.syncEntityDestroy(entityToDelete.id)
        }
    }

    async addEntityToPixiApp(entity: GameEntity) {
        if (this.initialized) {
            const pixiObject = await entity.initialize()

            this.pixiApp.stage.addChild(pixiObject)

            this.addTickerCallback(entity, (ticker) => entity.update(ticker))
        } else {
            console.log(
                'Adding entity to an app operation was deferred until the app will' +
                    ' be initialized',
            )
        }
    }

    private addTickerCallback(
        entity: GameEntity,
        callback: TickerCallback<Ticker>,
    ) {
        this.tickerCallbacksByEntityId[entity.id] = callback
        this.pixiApp.ticker.add(callback)
    }
}
