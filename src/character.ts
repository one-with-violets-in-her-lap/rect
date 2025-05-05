import characterSpriteImage from '@/assets/images/character-1.png'

import { Assets, Sprite, Ticker } from 'pixi.js'
import { KeyBindings } from '@/key-bindings'
import { NotInitializedError } from '@/utils/errors'

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

export class Character {
    sprite?: Sprite

    private keyBindings: KeyBindings

    private movement: CharacterMovement = {
        isMovingLeft: false,
        isMovingRight: false,
        jumpState: {
            status: 'inactive',
            initialPositionY: null,
        },
    }

    constructor(
        private readonly canvas: HTMLCanvasElement,
        private readonly ticker: Ticker,
    ) {
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
                            initialPositionY: this.sprite?.y || 0,
                        }
                    }
                },
            },
        ])
    }

    async initializeSprite() {
        await Assets.load(characterSpriteImage)

        this.sprite = Sprite.from(characterSpriteImage)

        this.sprite.y = this.canvas.height - this.sprite.height

        this.keyBindings.initializeEventListeners()

        this.ticker.add((ticker) => this.performMovementTick(ticker))

        return this.sprite
    }

    async dispose() {
        if (!this.sprite) {
            throw new NotInitializedError(
                'Character sprite pixi object was not ' +
                    'initialized, so it cannot be destroyed',
            )
        }

        this.sprite.destroy()
        this.keyBindings.disposeEventListeners()
    }

    private performMovementTick(ticker: Ticker) {
        if (!this.sprite) {
            throw new NotInitializedError(
                'Failed to perform movement tick, ' +
                    'character sprite pixi object was not initialized',
            )
        }

        if (this.movement.isMovingLeft) {
            this.sprite.x = Math.max(
                this.sprite.x - Math.max(X_VELOCITY * ticker.deltaTime),
                0,
            )
        }

        if (this.movement.isMovingRight) {
            const rightBoundaryX = this.canvas.width - this.sprite.width
            this.sprite.x = Math.min(
                this.sprite.x + X_VELOCITY * ticker.deltaTime,
                rightBoundaryX,
            )
        }

        if (this.movement.jumpState.status === 'jumping') {
            const newY = this.sprite.y - JUMP_VELOCITY * ticker.deltaTime
            const maxDistanceFromGround =
                this.movement.jumpState.initialPositionY - JUMP_HEIGHT

            this.sprite.y = Math.max(newY, maxDistanceFromGround)

            if (newY <= maxDistanceFromGround) {
                this.movement.jumpState.status = 'landing'
            }
        } else if (this.movement.jumpState.status === 'landing') {
            const newY = this.sprite.y + JUMP_VELOCITY * ticker.deltaTime

            this.sprite.y = Math.min(
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
