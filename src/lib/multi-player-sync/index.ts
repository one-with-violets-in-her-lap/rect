import { EntityMovement, GameEntity } from '@/lib/entities'
import { Game } from '@/lib/game'
import {
    CreateEntityPacket,
    handleCreateEntityPacket,
} from '@/lib/multi-player-sync/entity-creator'
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

export function createGameSynchronizer(
    game: Game,
    multiPlayerSession: MultiPlayerSession,
) {
    addPacketHandler(
        multiPlayerSession.receiveConnection,
        'create-entity',
        (packet: CreateEntityPacket) => handleCreateEntityPacket(game, packet),
    )

    return {
        syncNewEntity(newEntity: GameEntity) {
            const newEntityPacket: CreateEntityPacket = {
                type: 'create-entity',
                entityTypeName: newEntity.typeName,
                entityId: newEntity.id,
            }

            multiPlayerSession.sendConnection.send(newEntityPacket)
        },
    }
}
