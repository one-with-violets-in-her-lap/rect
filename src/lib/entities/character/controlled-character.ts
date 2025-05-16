import characterSpriteImage from '@/assets/images/character-1.png'

import { Assets, Sprite, Text } from 'pixi.js'
import { Game } from '@/lib/game'
import { EntityTypeName, GameEntity } from '@/lib/entities'
import { NotInitializedError } from '@/lib/utils/errors'
import { KeyBindings } from '@/lib/utils/key-bindings'
import { Position } from '@/lib/utils/position'
import { Bullet } from '@/lib/entities/bullet'

const CURRENT_CHARACTER_LABEL_Y_OFFSET = -18

/**
 * Character entity that is currently being played on. Can be controlled by user input
 * (e.g. keyboard)
 *
 * See also {@link RemoteCharacter}
 */
export class CurrentControlledCharacter extends GameEntity {
    typeName: EntityTypeName = 'current-controlled-character'
    options = { enableCollision: true, enableGravity: true }

    keyBindings: KeyBindings

    private abortController?: AbortController

    constructor(game: Game, initialPosition: Position, id?: string) {
        super(game, initialPosition, id)

        this.keyBindings = new KeyBindings([
            {
                key: 'd',
                doOnKeyDown: () => (this.movementStatus.isMovingRight = true),
                doOnKeyUp: () => (this.movementStatus.isMovingRight = false),
            },

            {
                key: 'a',
                doOnKeyDown: () => (this.movementStatus.isMovingLeft = true),
                doOnKeyUp: () => (this.movementStatus.isMovingLeft = false),
            },

            {
                key: ' ',
                doOnKeyDown: () => (this.movementStatus.isJumping = true),
            },
        ])
    }

    async load() {
        this.abortController = new AbortController()

        this.keyBindings.initializeEventListeners()

        await Assets.load(characterSpriteImage)

        const pixiObject = Sprite.from(characterSpriteImage)

        const currentCharacterLabel = new Text({
            text: 'You',
            style: {
                fill: '#00000050',
                fontSize: '18px',
                fontWeight: '800',
            },
            x: pixiObject.width / 2,
            y: CURRENT_CHARACTER_LABEL_Y_OFFSET,
        })
        currentCharacterLabel.anchor = 0.5

        this.game.pixiApp.canvas.addEventListener(
            'click',
            this.shoot.bind(this),
            {
                signal: this.abortController.signal,
            },
        )

        pixiObject.addChild(currentCharacterLabel)

        return pixiObject
    }

    async destroy() {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Character sprite pixi object was not ' +
                    'initialized, so it cannot be destroyed',
            )
        }

        this.keyBindings.disposeEventListeners()

        this.abortController?.abort()

        this.pixiObject.destroy()
    }

    private async shoot(pointerEvent: MouseEvent) {
        const pixiObject = this.getPixiObjectOrThrow()
        const bulletRadians = Math.atan2(
            pointerEvent.y - pixiObject.y,
            pointerEvent.x - pixiObject.x,
        )

        const bullet = new Bullet(this.game, {
            x: pixiObject.x + 150,
            y: pixiObject.y,
        })
        await bullet.initialize()
        bullet.radiansAngle = bulletRadians

        this.game.addEntity(bullet)
    }
}
