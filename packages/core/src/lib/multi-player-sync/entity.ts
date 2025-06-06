import { GameEntity } from '@core/lib/entities'
import {
    addPacketHandler,
    type MultiPlayerPacket,
    type MultiPlayerSession,
} from '@core/lib/utils/webrtc-multiplayer'
import { type Position } from '@core/lib/utils/position'

interface EntityUpdatePacket extends MultiPlayerPacket {
    type: 'entity/update'
    entityId: string
    newEntityState: {
        newPosition?: Position
        newRotationRadians?: number
    }
}

export interface EntitySynchronizer {
    syncEntityUpdate(newState: EntityUpdatePacket['newEntityState']): void
}

export function createEntitySynchronizer(
    entity: GameEntity,
    multiPlayerSession: MultiPlayerSession,
): EntitySynchronizer {
    addPacketHandler(
        multiPlayerSession.receiveConnection,
        'entity/update',
        (packet: EntityUpdatePacket) => {
            if (packet.entityId === entity.id) {
                const pixiObject = entity.getPixiObjectOrThrow()

                if (packet.newEntityState.newPosition) {
                    pixiObject.position = packet.newEntityState.newPosition
                }

                if (packet.newEntityState.newRotationRadians) {
                    pixiObject.rotation =
                        packet.newEntityState.newRotationRadians
                }
            }
        },
    )

    return {
        syncEntityUpdate(newState) {
            const movementPacket: EntityUpdatePacket = {
                type: 'entity/update',
                entityId: entity.id,
                newEntityState: newState,
            }

            multiPlayerSession.sendConnection.send(movementPacket)
        },
    }
}
