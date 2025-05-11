import characterSpriteImage from '@/assets/images/character-1.png'

import { Assets, Sprite, Text } from 'pixi.js'
import { Game } from '@/lib/game'
import { EntityTypeName, GameEntity } from '@/lib/entities'
import { NotInitializedError } from '@/lib/utils/errors'
import { KeyBindings } from '@/lib/utils/key-bindings'
import { Position } from '@/lib/utils/position'

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
        this.keyBindings.initializeEventListeners()

        await Assets.load(characterSpriteImage)

        const pixiObject = Sprite.from(characterSpriteImage)

        const currentCharacterLabel = new Text({
            text: 'You',
            style: {
                fill: '#00000050',
                fontSize: '18px',
                fontWeight: '800'
            },
            x: pixiObject.width / 2,
            y: -18,
        })
        currentCharacterLabel.anchor = 0.5

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

        this.pixiObject.destroy()
    }
}
