import { Game } from '@/lib/game'
import { BaseCharacter, CharacterMovement } from '@/lib/entities/character'
import { KeyBindings } from '@/lib/utils/key-bindings'
import { MultiPlayerSession } from '@/lib/utils/webrtc-multiplayer'

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
        private readonly multiPlayerSession: MultiPlayerSession,
    ) {
        super(game, initialPosition)
        this.keyBindings = new KeyBindings([
            {
                key: 'd',
                doOnKeyDown: () => this.updateMovementAndSyncMultiPlayer({
                    isMovingRight: true
                }),
                doOnKeyUp: () => this.updateMovementAndSyncMultiPlayer({
                    isMovingRight: false
                }),
            },

            {
                key: 'a',
                doOnKeyDown: () => this.updateMovementAndSyncMultiPlayer({
                    isMovingLeft: true
                }),
                doOnKeyUp: () => this.updateMovementAndSyncMultiPlayer({
                    isMovingLeft: false
                }),
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

    private updateMovementAndSyncMultiPlayer(newMovement: Partial<CharacterMovement>) {
        const fullNewMovementData = {
            ...this.movement,
            ...newMovement
        } 

        this.movement = fullNewMovementData
        this.multiPlayerSession.sendConnection.send(JSON.stringify(fullNewMovementData))
    }
}
