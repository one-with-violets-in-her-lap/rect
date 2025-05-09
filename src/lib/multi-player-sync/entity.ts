import { EntityMovement, GameEntity } from '@/lib/entities'
import {
    addPacketHandler,
    MultiPlayerPacket,
    MultiPlayerSession,
} from '@/lib/utils/webrtc-multiplayer'

interface EntityMovementPacket extends MultiPlayerPacket {
    type: 'update-entity-movement'
    entityId: string
    newMovementStatus: EntityMovement
}

export interface EntitySynchronizer {
    syncEntityMovement(newMovementStatus: Partial<EntityMovement>): void
}

export function createEntitySynchronizer(
    entity: GameEntity,
    multiPlayerSession: MultiPlayerSession,
    updateMovementStatus: (newStatus: EntityMovement) => void,
): EntitySynchronizer {
    addPacketHandler(
        multiPlayerSession.receiveConnection,
        'update-entity-movement',
        (packet: EntityMovementPacket) => {
            if (packet.entityId === entity.id) {
                updateMovementStatus(packet.newMovementStatus)
            }
        },
    )

    return {
        syncEntityMovement(newMovementStatus) {
            const movementPacket: EntityMovementPacket = {
                type: 'update-entity-movement',
                entityId: entity.id,
                newMovementStatus: {
                    ...entity.getMovementStatus(),
                    ...newMovementStatus,
                },
            }

            multiPlayerSession.sendConnection.send(movementPacket)
        },
    }
}
