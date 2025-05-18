import { Character } from '@/lib/entities/character'
import { MultiPlayerError } from '@/lib/utils/errors'
import {
    addPacketHandler,
    MultiPlayerPacket,
    MultiPlayerSession,
} from '@/lib/utils/webrtc-multiplayer'

interface CharacterUpdatePacket extends MultiPlayerPacket {
    type: 'character/update'
    entityId: string
    newEntityState: {
        damage?: number
    }
}

export interface CharacterSynchronizer {
    syncCharacterUpdate(newState: CharacterUpdatePacket['newEntityState']): void
}

export function createCharacterSynchronizer(
    entity: Character,
    multiPlayerSession: MultiPlayerSession,
): CharacterSynchronizer {
    addPacketHandler(
        multiPlayerSession.receiveConnection,
        'character/update',
        (packet: CharacterUpdatePacket) => {
            if (packet.entityId === entity.id) {
                if (!(entity instanceof Character)) {
                    throw new MultiPlayerError(
                        'Character was requested for entity that ' +
                            'is not a character. Multi-player is probably out-of-sync',
                    )
                }

                if (packet.newEntityState.damage) {
                    entity.damage(packet.newEntityState.damage)
                }
            }
        },
    )

    return {
        syncCharacterUpdate(newState) {
            const movementPacket: CharacterUpdatePacket = {
                type: 'character/update',
                entityId: entity.id,
                newEntityState: newState,
            }

            multiPlayerSession.sendConnection.send(movementPacket)
        },
    }
}
