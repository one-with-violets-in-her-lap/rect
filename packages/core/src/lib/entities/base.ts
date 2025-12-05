import { Container, Ticker } from 'pixi.js'
import { Game } from '@core/lib/game'
import { CollisionError, NotInitializedError } from '@core/lib/utils/errors'
import { type Position } from '@core/lib/utils/position'
import { checkIfNewEntityPositionColliding } from '@core/lib/collisions'
import {
    createEntitySynchronizer,
    type EntitySynchronizer,
} from '@core/lib/multi-player-sync/entity'
import { getTypedObjectKeys } from '../utils/objects'

export type EntityTypeName =
    | 'obstacle'
    | 'character'
    | 'bullet'
    | 'point-light'
    | 'boundary'

export abstract class BaseGameEntity<
    TPixiObject extends Container = Container,
> {
    abstract typeName: EntityTypeName
    abstract options: {
        isCollidable: boolean | ((collidedEntity: BaseGameEntity) => boolean)
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

    update(_ticker: Ticker) {
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

    getBoundingBox() {
        return this.getPixiObjectOrThrow().getBounds()
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

        if (collisionInfo.isColliding) {
            const isCurrentEntityCollidable =
                typeof this.options.isCollidable === 'boolean'
                    ? this.options.isCollidable
                    : this.options.isCollidable(
                          collisionInfo.collidingEntity,
                      )

            const isTargetEntityCollidable =
                typeof collisionInfo.collidingEntity.options.isCollidable ===
                'boolean'
                    ? collisionInfo.collidingEntity.options.isCollidable
                    : collisionInfo.collidingEntity.options.isCollidable(
                          this,
                      )

            if (
                collisionInfo.isColliding &&
                isCurrentEntityCollidable &&
                isTargetEntityCollidable
            ) {
                throw new CollisionError(collisionInfo.collidingEntity)
            }
        }

        if (newPosition.x) {
            pixiObject.x = newPosition.x
        }

        if (newPosition.y) {
            pixiObject.y = newPosition.y
        }
    }

    moveBy(delta: Partial<Position>) {
        for (const axis of getTypedObjectKeys(delta)) {
            let wholeStepMoveError: unknown | null = null

            if (delta[axis] === undefined) {
                continue
            }

            const pixiObject = this.getPixiObjectOrThrow()

            const remainder = delta[axis] % 1
            const direction = Math.sign(delta[axis])
            const moveSteps = Math.abs(Math.floor(delta[axis]))

            for (
                let deltaCounter = 0;
                deltaCounter < moveSteps;
                deltaCounter++
            ) {
                try {
                    this.updatePositionRespectingCollisions({
                        [axis]: pixiObject[axis] + direction,
                    })
                } catch (error) {
                    wholeStepMoveError = error
                }
            }

            if (remainder !== 0) {
                this.updatePositionRespectingCollisions({
                    [axis]: pixiObject[axis] + direction,
                })
            }

            if (wholeStepMoveError) {
                throw wholeStepMoveError
            }
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
