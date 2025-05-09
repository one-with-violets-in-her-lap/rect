import { Game } from '@/lib/game'
import { EntityTypeName, GameEntity } from '@/lib/entities'
import { Obstacle } from '@/lib/entities/obstacle'
import { RemoteCharacter } from '@/lib/entities/character/remote-character'
import {
    addPacketHandler,
    MultiPlayerPacket,
    MultiPlayerSession,
} from '@/lib/utils/webrtc-multiplayer'
import { CurrentControlledCharacter } from '@/lib/entities/character/controlled-character'
import { Position } from '@/lib/utils/position'

interface CreateEntityPacket extends MultiPlayerPacket {
    type: 'create-entity'
    entityTypeName: EntityTypeName
    entityId: string
    initialPosition: Position
}

const entityCreatorsByType: Record<
    CreateEntityPacket['entityTypeName'],
    (game: Game, createEntityPacket: CreateEntityPacket) => GameEntity
> = {
    obstacle: (game, createEntityPacket) =>
        new Obstacle(
            game,
            createEntityPacket.initialPosition,
            createEntityPacket.entityId,
        ),
    'remote-character': (game, createEntityPacket) =>
        new RemoteCharacter(
            game,
            createEntityPacket.initialPosition,
            createEntityPacket.entityId,
        ),
    'current-controlled-character': (game, createEntityPacket) =>
        new CurrentControlledCharacter(
            game,
            createEntityPacket.initialPosition,
            createEntityPacket.entityId,
        ),
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
                initialPosition: newEntity.initialPosition,
            }

            multiPlayerSession.sendConnection.send(newEntityPacket)
        },
    }
}

function handleCreateEntityPacket(game: Game, packet: CreateEntityPacket) {
    return entityCreatorsByType[packet.entityTypeName](game, packet)
}
