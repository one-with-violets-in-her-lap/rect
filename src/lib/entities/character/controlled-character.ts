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

    constructor(game: Game) {
        super(game)
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
        this.keyBindings.initializeEventListeners()
        return await super.load()
    }
    async destroy() {
        this.keyBindings.disposeEventListeners()
        await super.destroy()
    }
}
