import { Game } from '@/lib/game'
import { BaseCharacter } from '@/lib/entities/character'
import { KeyBindings } from '@/lib/utils/key-bindings'

/**
 * Character entity that is currently being played on. Can be controlled by user input
 * (e.g. keyboard)
 *
 * See also {@link RemoteCharacter}
 */
export class CurrentControlledCharacter extends BaseCharacter {
    keyBindings: KeyBindings

    constructor(
        game: Game,
        initialPosition: 'left' | 'right',
    ) {
        super(game, initialPosition)

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
        return await super.load()
    }

    async destroy() {
        this.keyBindings.disposeEventListeners()
        await super.destroy()
    }
}
