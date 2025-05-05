import characterSpriteImage from '@/assets/images/character-1.png'

import { Assets, Sprite, Ticker } from 'pixi.js'
import { Game } from '@/game'
import { GameEntity } from '@/game-entity'
import { KeyBindings } from '@/utils/key-bindings'
import { NotInitializedError } from '@/utils/errors'

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
                doOnKeyDown: () => this.jump(),
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
            pixiObject.x = Math.max(
                pixiObject.x - Math.max(X_VELOCITY * ticker.deltaTime),
                0,
            )
        }

        if (this.movement.isMovingRight) {
            const rightBoundaryX =
                this.game.pixiApp.canvas.width - pixiObject.width
            pixiObject.x = Math.min(
                pixiObject.x + X_VELOCITY * ticker.deltaTime,
                rightBoundaryX,
            )
        }

        return pixiObject
    }
}
