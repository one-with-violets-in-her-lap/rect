import characterSpriteImage from '@/assets/images/character-1.png'

import { Assets, Sprite, Ticker } from 'pixi.js'
import { Game } from '@/game'
import { GameEntity } from '@/game-entity'
import { KeyBindings } from '@/utils/key-bindings'
import { CollisionError, NotInitializedError } from '@/utils/errors'

interface CharacterMovement {
    isMovingLeft: boolean
    isMovingRight: boolean
}

const X_VELOCITY = 8

export class Character extends GameEntity<Sprite> {
    private keyBindings: KeyBindings

    private movement: CharacterMovement = {
        isMovingLeft: false,
        isMovingRight: false,
    }

    constructor(game: Game) {
        super(game, { enableCollision: true, enableGravity: true })

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
                doOnKeyDown: () => (this.isJumping = true),
            },
        ])
    }

    async load() {
        await Assets.load(characterSpriteImage)

        const pixiObject = Sprite.from(characterSpriteImage)

        this.keyBindings.initializeEventListeners()

        return pixiObject
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
        const pixiObject = super.update(ticker)

        if (this.movement.isMovingLeft) {
            try {
                this.updatePositionRespectingCollisions({
                    x: pixiObject.x - X_VELOCITY * ticker.deltaTime,
                })
            } catch (error) {
                if (!(error instanceof CollisionError)) {
                    throw error
                }
            }
        }

        if (this.movement.isMovingRight) {
            try {
                this.updatePositionRespectingCollisions({
                    x: pixiObject.x + X_VELOCITY * ticker.deltaTime,
                })
            } catch (error) {
                if (!(error instanceof CollisionError)) {
                    throw error
                }
            }
        }

        return pixiObject
    }
}
