import { Container, Ticker } from 'pixi.js'
import { Game } from '@/lib/game'
import { CollisionError, NotInitializedError } from '@/lib/utils/errors'
import { Position } from '@/lib/utils/position'
import { checkIfNewEntityPositionColliding } from '@/lib/collisions'
import { createEntitySync, EntitySynchronizer } from '@/lib/multi-player-sync'

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

    private sync: EntitySynchronizer

    constructor(
        protected readonly game: Game,
        private readonly options: {
            enableCollision: boolean
            enableGravity: boolean
        },
    ) {
        this.id = crypto.randomUUID()

        this.sync = createEntitySync(
            this,
            this.game.multiPlayerSession,
            (newMovement) => (this.movementStatus = newMovement),
        )
    }

    async initialize() {
        this.pixiObject = await this.load()
        return this.pixiObject
    }

    protected abstract load(): Promise<TPixiObject> | TPixiObject

    abstract destroy(): Promise<void> | void

    update(ticker: Ticker) {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Failed to perform movement tick, ' +
                    'character sprite pixi object was not initialized',
            )
        }

        if (this.options.enableGravity) {
            this.applyGravity(ticker, this.pixiObject)
        }

        this.moveHorizontallyIfNeeded(this.pixiObject, ticker)

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

        const hasCollisionsWithObjects = checkIfNewEntityPositionColliding(
            this,
            {
                x: pixiObject.x,
                y: pixiObject.y,
                ...newPosition,
            },
            this.game.entities,
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
            hasCollisionsWithObjects ||
            hasCollisionsWithYScreenBounds ||
            hasCollisionsWithXScreenBounds
        ) {
            throw new CollisionError()
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
                    return
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
                    return
                } else {
                    throw error
                }
            }
        }
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

        this.sync.syncEntityMovement(this.movementStatus)
    }
}
