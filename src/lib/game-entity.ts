import { Container, Ticker } from 'pixi.js'
import { Game } from '@/lib/game'
import { CollisionError, NotInitializedError } from '@/lib/utils/errors'
import { Position } from '@/lib/utils/position'
import { checkIfNewEntityPositionColliding } from '@/lib/collisions'

const GRAVITY_FORCE = 0.9
const JUMP_FORCE = 20

export abstract class GameEntity<TPixiObject extends Container = Container> {
    pixiObject?: TPixiObject

    private grounded = false

    protected isJumping = false
    protected verticalVelocity = 0

    constructor(
        protected readonly game: Game,
        private readonly options: {
            enableCollision: boolean
            enableGravity: boolean
        },
    ) {}

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
        if (this.grounded) {
            this.verticalVelocity = GRAVITY_FORCE * ticker.deltaTime

            if (this.isJumping) {
                this.grounded = false
                this.verticalVelocity = -JUMP_FORCE
                this.isJumping = false
            }
        } else {
            this.verticalVelocity += GRAVITY_FORCE * ticker.deltaTime
        }

        const deltaYToMoveBy = this.verticalVelocity * ticker.deltaTime
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
                this.grounded = false
            } catch (error) {
                if (error instanceof CollisionError) {
                    this.grounded = true
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
                this.grounded = false
            } catch (error) {
                if (error instanceof CollisionError) {
                    this.grounded = true
                    return
                } else {
                    throw error
                }
            }
        }
    }
}
