import { Container, Ticker } from 'pixi.js'
import { NotInitializedError } from '@/utils/errors'

const GRAVITY_FORCE = 0.9
const JUMP_FORCE = 20

export abstract class GameEntity<TPixiObject extends Container> {
    protected pixiObject?: TPixiObject

    private isJumping = false
    protected verticalVelocity = 0

    constructor(
        protected readonly canvas: HTMLCanvasElement,
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

    protected jump() {
        this.isJumping = true
    }

    update(ticker: Ticker) {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Failed to perform movement tick, ' +
                    'character sprite pixi object was not initialized',
            )
        }

        if (this.options.enableGravity) {
            const groundY = this.canvas.height - this.pixiObject.height
            const entityGrounded = this.pixiObject.y === groundY

            if (entityGrounded) {
                this.verticalVelocity = GRAVITY_FORCE * ticker.deltaTime

                if (this.isJumping) {
                    this.verticalVelocity = -JUMP_FORCE
                    this.isJumping = false
                }
            } else {
                this.verticalVelocity += GRAVITY_FORCE * ticker.deltaTime
            }

            this.pixiObject.y = Math.min(
                this.pixiObject.y + this.verticalVelocity * ticker.deltaTime,
                groundY,
            )
        }

        return this.pixiObject
    }
}
