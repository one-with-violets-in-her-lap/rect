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

export interface EntityMovement {
    isMovingLeft: boolean
    isMovingRight: boolean
    horizontalVelocity: number

    isJumping: boolean
    isGrounded: boolean
    verticalVelocity: number
}

const GRAVITY_FORCE = 0.9
const JUMP_FORCE = 20

export abstract class GameEntity<TPixiObject extends Container = Container> {
    abstract typeName: EntityTypeName
    abstract options: {
        enableCollision: boolean
        enableGravity: boolean
    }

    id: string

    pixiObject?: TPixiObject

    protected movementStatus: EntityMovement = {
        isMovingLeft: false,
        isMovingRight: false,
        horizontalVelocity: 8,

        isJumping: false,
        isGrounded: false,
        verticalVelocity: 0,
    }

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

    async cleanup() {
        this.pixiObject?.destroy()
    }

    update(ticker: Ticker) {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Failed to perform movement tick, ' +
                    'character sprite pixi object was not initialized',
            )
        }

        if (!this.isRemote) {
            if (this.options.enableGravity) {
                this.applyGravity(ticker, this.pixiObject)
            }

            this.moveHorizontallyIfNeeded(this.pixiObject, ticker)
        }

        return this.pixiObject
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

    getMovementStatus() {
        return this.movementStatus
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
            this.game.pixiApp.canvas.height - pixiObject.height <= newPosition.y

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

    private applyGravity(ticker: Ticker, pixiObject: TPixiObject) {
        if (this.movementStatus.isGrounded) {
            this.movementStatus.verticalVelocity =
                GRAVITY_FORCE * ticker.deltaTime

            if (this.movementStatus.isJumping) {
                this.movementStatus.isGrounded = false
                this.movementStatus.verticalVelocity = -JUMP_FORCE
                this.movementStatus.isJumping = false
            }
        } else {
            this.movementStatus.verticalVelocity +=
                GRAVITY_FORCE * ticker.deltaTime
        }

        const deltaYToMoveBy =
            this.movementStatus.verticalVelocity * ticker.deltaTime
        const direction = Math.sign(deltaYToMoveBy)
        const moveSteps = Math.abs(Math.floor(deltaYToMoveBy))
        const remainder = deltaYToMoveBy % 1

        for (
            let deltaYCounter = 0;
            deltaYCounter < moveSteps;
            deltaYCounter++
        ) {
            try {
                this.updatePositionRespectingCollisions({
                    y: pixiObject.y + direction,
                })
                this.movementStatus.isGrounded = false
            } catch (error) {
                if (error instanceof CollisionError) {
                    this.movementStatus.isGrounded = true
                    break
                } else {
                    throw error
                }
            }
        }

        if (remainder !== 0) {
            try {
                this.updatePositionRespectingCollisions({
                    y: pixiObject.y + direction,
                })
                this.movementStatus.isGrounded = false
            } catch (error) {
                if (error instanceof CollisionError) {
                    this.movementStatus.isGrounded = true
                } else {
                    throw error
                }
            }
        }

        this.syncStateWithMultiPlayer(pixiObject)
    }

    private moveHorizontallyIfNeeded(pixiObject: TPixiObject, ticker: Ticker) {
        if (this.movementStatus.isMovingLeft) {
            try {
                this.updatePositionRespectingCollisions({
                    x:
                        pixiObject.x -
                        this.movementStatus.horizontalVelocity *
                            ticker.deltaTime,
                })
            } catch (error) {
                if (!(error instanceof CollisionError)) {
                    throw error
                }
            }
        }

        if (this.movementStatus.isMovingRight) {
            try {
                this.updatePositionRespectingCollisions({
                    x:
                        pixiObject.x +
                        this.movementStatus.horizontalVelocity *
                            ticker.deltaTime,
                })
            } catch (error) {
                if (!(error instanceof CollisionError)) {
                    throw error
                }
            }
        }

        this.syncStateWithMultiPlayer(pixiObject)
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
