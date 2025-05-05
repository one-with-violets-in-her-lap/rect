import characterSpriteImage from '@/assets/images/character-1.png'

import { Assets, Sprite, Ticker } from 'pixi.js'
import { KeyBindings } from '@/utils/key-bindings'
import { NotInitializedError } from '@/utils/errors'
import { GameEntity } from '@/game-entity'

interface CharacterMovement {
    isMovingLeft: boolean
    isMovingRight: boolean
    jumpState:
        | {
              status: 'jumping' | 'landing'
              initialPositionY: number
          }
        | {
              status: 'inactive'
              initialPositionY: null
          }
}

const X_VELOCITY = 8
const JUMP_VELOCITY = 18
const JUMP_HEIGHT = 220

export class Character extends GameEntity<Sprite> {
    private keyBindings: KeyBindings

    private movement: CharacterMovement = {
        isMovingLeft: false,
        isMovingRight: false,
        jumpState: {
            status: 'inactive',
            initialPositionY: null,
        },
    }

    constructor(canvas: HTMLCanvasElement) {
        super(canvas, { enableCollision: true, enableGravity: false })
        this.keyBindings = new KeyBindings([
            {
                key: 'd',
                doOnKeyDown: () => (this.movement.isMovingRight = true),
                doOnKeyUp: () => (this.movement.isMovingRight = false),
            },

            {
                key: 'a',
                doOnKeyDown: () => (this.movement.isMovingLeft = true),
                doOnKeyUp: () => (this.movement.isMovingLeft = false),
            },

            {
                key: ' ',
                doOnKeyDown: () => {
                    if (this.movement.jumpState.status === 'inactive') {
                        this.movement.jumpState = {
                            status: 'jumping',
                            initialPositionY: this.pixiObject?.y || 0,
                        }
                    }
                },
            },
        ])
    }

    async initialize() {
        await Assets.load(characterSpriteImage)

        this.pixiObject = Sprite.from(characterSpriteImage)

        this.pixiObject.y = this.canvas.height - this.pixiObject.height

        this.keyBindings.initializeEventListeners()

        return this.pixiObject
    }

    async destroy() {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Character sprite pixi object was not ' +
                    'initialized, so it cannot be destroyed',
            )
        }

        this.pixiObject.destroy()
        this.keyBindings.disposeEventListeners()
    }

    update(ticker: Ticker) {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Failed to perform movement tick, ' +
                    'character sprite pixi object was not initialized',
            )
        }

        if (this.movement.isMovingLeft) {
            this.pixiObject.x = Math.max(
                this.pixiObject.x - Math.max(X_VELOCITY * ticker.deltaTime),
                0,
            )
        }

        if (this.movement.isMovingRight) {
            const rightBoundaryX = this.canvas.width - this.pixiObject.width
            this.pixiObject.x = Math.min(
                this.pixiObject.x + X_VELOCITY * ticker.deltaTime,
                rightBoundaryX,
            )
        }

        if (this.movement.jumpState.status === 'jumping') {
            const newY = this.pixiObject.y - JUMP_VELOCITY * ticker.deltaTime
            const maxDistanceFromGround =
                this.movement.jumpState.initialPositionY - JUMP_HEIGHT

            this.pixiObject.y = Math.max(newY, maxDistanceFromGround)

            if (newY <= maxDistanceFromGround) {
                this.movement.jumpState.status = 'landing'
            }
        } else if (this.movement.jumpState.status === 'landing') {
            const newY = this.pixiObject.y + JUMP_VELOCITY * ticker.deltaTime

            this.pixiObject.y = Math.min(
                newY,
                this.movement.jumpState.initialPositionY,
            )

            if (newY >= this.movement.jumpState.initialPositionY) {
                this.movement.jumpState = {
                    status: 'inactive',
                    initialPositionY: null,
                }
            }
        }
    }
}
