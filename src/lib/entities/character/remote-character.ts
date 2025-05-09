import { Game } from '@/lib/game'
import { BaseCharacter } from '@/lib/entities/character'
import { MultiPlayerSession } from '@/lib/utils/webrtc-multiplayer'

export class RemoteCharacter extends BaseCharacter {
    constructor(
        game: Game,
        initialPosition: 'left' | 'right',
        private readonly multiPlayerSession: MultiPlayerSession,
    ) {
        super(game, initialPosition)
    }

    async load() {
        const pixiObject = await super.load()

        this.multiPlayerSession.receiveConnection.on('data', (data) => {
            this.movementStatus = JSON.parse(String(data))
        })

        return pixiObject
    }
}
