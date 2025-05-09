import { EntityMovement, GameEntity } from '@/lib/entities'
import { Game } from '@/lib/game'
import { MultiPlayerSession } from '@/lib/utils/webrtc-multiplayer'

type MultiPlayerPacket =
    | {
          type: 'update-movement-status'
          entityId: string
          newMovementStatus: EntityMovement
      }
    | {
          type: 'create-entity'
          newEntity: GameEntity
      }

export interface EntitySynchronizer {
    syncEntityMovement(newMovementStatus: Partial<EntityMovement>): void
}
export function createEntitySync(
    entity: GameEntity,
    multiPlayerSession: MultiPlayerSession,
    updateMovementStatus: (newStatus: EntityMovement) => void,
): EntitySynchronizer {
    multiPlayerSession.receiveConnection.on('data', (data) => {
        const packet = data as MultiPlayerPacket // TODO: fix naive check

        if (
            packet.type === 'update-movement-status' &&
            packet.entityId === entity.id
        ) {
            updateMovementStatus(packet.newMovementStatus)
        }
    })

    return {
        syncEntityMovement(newMovementStatus) {
            const movementPacket: MultiPlayerPacket = {
                type: 'update-movement-status',
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

export function createGameSync(
    game: Game,
    multiPlayerSession: MultiPlayerSession,
) {
    return {
        syncNewEntity(newEntity: GameEntity) {
            const newEntityPacket: MultiPlayerPacket = {
                type: 'create-entity',
                newEntity,
            }

            multiPlayerSession.sendConnection.send(newEntityPacket)
        },
    }
}
