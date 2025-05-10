import { GameEntity } from '@/lib/entities'
import {
    addPacketHandler,
    MultiPlayerPacket,
    MultiPlayerSession,
} from '@/lib/utils/webrtc-multiplayer'
import { Position } from '@/lib/utils/position'

interface EntityMovePacket extends MultiPlayerPacket {
    type: 'entity/move'
    entityId: string
    newPosition: Position
}

export interface EntitySynchronizer {
    syncEntityMove(newEntityPosition: Position): void
}

export function createEntitySynchronizer(
    entity: GameEntity,
    multiPlayerSession: MultiPlayerSession,
    updatePosition: (newPosition: Position) => void,
): EntitySynchronizer {
    addPacketHandler(
        multiPlayerSession.receiveConnection,
        'entity/move',
        (packet: EntityMovePacket) => {
            if (packet.entityId === entity.id) {
                updatePosition(packet.newPosition)
            }
        },
    )

    return {
        syncEntityMove(newPosition) {
            const movementPacket: EntityMovePacket = {
                type: 'entity/move',
                entityId: entity.id,
                newPosition: newPosition,
            }

            multiPlayerSession.sendConnection.send(movementPacket)
        },
    }
}
