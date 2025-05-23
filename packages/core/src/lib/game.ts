import { Application, Rectangle, Ticker, type TickerCallback } from 'pixi.js'
import { GameEntity } from '@core/lib/entities'
import { type MultiPlayerSession } from '@core/lib/utils/webrtc-multiplayer'
import {
    createGameSynchronizer,
    type GameSynchronizer,
} from '@core/lib/multi-player-sync/game'
import { RectGameError } from '@core/lib/utils/errors'

export const GAME_CANVAS_WIDTH = 1900
export const GAME_CANVAS_HEIGHT = 950
export const gameCanvasAspectRatio = GAME_CANVAS_WIDTH / GAME_CANVAS_HEIGHT

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

export class Game {
    pixiApp: Application
    synchronizer: GameSynchronizer | null = null

    doOnEnd: ((isWinner: boolean) => void) | null = null

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

    async initialize(containerElement: HTMLElement) {
        await this.pixiApp.init({
            width: GAME_CANVAS_WIDTH,
            height: GAME_CANVAS_HEIGHT,
            backgroundAlpha: 0,
        })
        containerElement.replaceChildren(this.pixiApp.canvas)

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

        this.windowResizeHandler = () => resizeCanvas(this.pixiApp.canvas)
        window.addEventListener('resize', this.windowResizeHandler)
        this.windowResizeHandler()

        this.initialized = true
        this.entities.forEach((entity) => this.addEntityToPixiApp(entity))
    }

    async endWithAnimation(isWinner: boolean) {
        this.pixiApp.ticker.speed = 0.3

        setTimeout(() => {
            if (this.doOnEnd) {
                this.doOnEnd(isWinner)
            }

            this.pixiApp.stop()
        }, 1000)
    }

    async destroy() {
        if (this.windowResizeHandler) {
            window.removeEventListener('resize', this.windowResizeHandler)
        }

        this.synchronizer?.cleanup()

        for (const entity of this.entities) {
            await entity.cleanup()
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

    destroyEntity(entityToDelete: GameEntity, syncWithMultiPlayer = true) {
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

    private addTickerCallback(
        entity: GameEntity,
        callback: TickerCallback<Ticker>,
    ) {
        this.tickerCallbacksByEntityId[entity.id] = callback
        this.pixiApp.ticker.add(callback)
    }
}
