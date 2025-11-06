import { Container, Ticker } from 'pixi.js'
import { Game } from '@core/lib/game'
import { CollisionError, NotInitializedError } from '@core/lib/utils/errors'
import { type Position } from '@core/lib/utils/position'
import { checkIfNewEntityPositionColliding } from '@core/lib/collisions'
import {
    createEntitySynchronizer,
    type EntitySynchronizer,
} from '@core/lib/multi-player-sync/entity'

export type EntityTypeName = 'obstacle' | 'character' | 'bullet'

export abstract class GameEntity<TPixiObject extends Container = Container> {
    abstract typeName: EntityTypeName
    abstract options: {
        enableCollision: boolean
        enableGravity: boolean
    }

    id: string

    pixiObject?: TPixiObject

    private synchronizer: EntitySynchronizer | null = null

    constructor(
        protected readonly game: Game,
        readonly initialPosition: Position,
        id?: string,
        readonly isRemote = false,
    ) {
        this.id = id || crypto.randomUUID()

        if (this.game.multiPlayerSession) {
            this.synchronizer = createEntitySynchronizer(
                this,
                this.game.multiPlayerSession,
            )
        }
    }

    async initialize() {
        this.pixiObject = await this.load()

        this.pixiObject.position = this.initialPosition

        return this.pixiObject
    }

    protected abstract load(): Promise<TPixiObject> | TPixiObject

    update(ticker: Ticker) {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Failed to perform movement tick, ' +
                    'character sprite pixi object was not initialized',
            )
        }

        return this.pixiObject
    }

    async cleanup() {
        this.pixiObject?.destroy()
    }

    getPixiObjectOrThrow() {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Failed to perform movement tick, ' +
                    'character sprite pixi object was not initialized',
            )
        }

        return this.pixiObject
    }

    protected updatePositionRespectingCollisions(
        newPosition: Partial<Position>,
    ) {
        const pixiObject = this.getPixiObjectOrThrow()

        const collisionInfo = checkIfNewEntityPositionColliding(
            this,
            {
                x: pixiObject.x,
                y: pixiObject.y,
                ...newPosition,
            },
            this.game.getEntities(),
        )

        const hasCollisionsWithYScreenBounds =
            newPosition.y !== undefined &&
            (this.game.pixiApp.canvas.height - pixiObject.height <=
                newPosition.y ||
                newPosition.y < 0)

        const hasCollisionsWithXScreenBounds =
            newPosition.x !== undefined &&
            (this.game.pixiApp.canvas.width - pixiObject.width <=
                newPosition.x ||
                newPosition.x < 0)

        if (
            collisionInfo.isColliding ||
            hasCollisionsWithYScreenBounds ||
            hasCollisionsWithXScreenBounds
        ) {
            throw new CollisionError(collisionInfo.collidingEntity)
        }

        if (newPosition.x) {
            pixiObject.x = newPosition.x
        }

        if (newPosition.y) {
            pixiObject.y = newPosition.y
        }
    }

    protected syncStateWithMultiPlayer(pixiObject: TPixiObject) {
        this.synchronizer?.syncEntityUpdate({
            newPosition: {
                x: pixiObject.x,
                y: pixiObject.y,
            },
            newRotationRadians: pixiObject.rotation,
        })
    }
}
