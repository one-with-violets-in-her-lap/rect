import { Container, Ticker } from 'pixi.js'
import { Game } from '@/game'
import { CollisionError, NotInitializedError } from '@/utils/errors'
import { Position } from '@/utils/position'

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

        const hasCollisionsWithObjects =
            this.game.checkIfNewEntityPositionColliding(this, {
                x: pixiObject.x,
                y: pixiObject.y,
                ...newPosition,
            })

        const hasCollisionsWithYScreenBounds =
            newPosition.y &&
            this.game.pixiApp.canvas.height - pixiObject.height <= newPosition.y

        const hasCollisionsWithXScreenBounds =
            newPosition.x &&
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

        const newY = pixiObject.y + this.verticalVelocity * ticker.deltaTime

        try {
            this.updatePositionRespectingCollisions({ y: newY })
            this.grounded = false
        } catch (error) {
            if (error instanceof CollisionError) {
                this.grounded = true
            } else {
                throw error
            }
        }
    }
}
