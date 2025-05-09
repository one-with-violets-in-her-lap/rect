import { Game } from '@/lib/game'
import { EntityTypeName, GameEntity } from '@/lib/entities'
import { Obstacle } from '@/lib/entities/obstacle'
import { RemoteCharacter } from '@/lib/entities/character/remote-character'
import { MultiPlayerPacket } from '@/lib/utils/webrtc-multiplayer'
import { CurrentControlledCharacter } from '@/lib/entities/character/controlled-character'

export interface CreateEntityPacket extends MultiPlayerPacket {
    type: 'create-entity'
    entityTypeName: EntityTypeName
    entityId: string
}

export function handleCreateEntityPacket(
    game: Game,
    packet: CreateEntityPacket,
) {
    return entityCreatorsByType[packet.entityTypeName](game, packet.entityId)
}

const entityCreatorsByType: Record<
    CreateEntityPacket['entityTypeName'],
    (game: Game, id: string) => GameEntity
> = {
    obstacle: (game, id) => new Obstacle(game, id),
    'remote-character': (game, id) => new RemoteCharacter(game, id),
    'current-controlled-character': (game, id) =>
        new CurrentControlledCharacter(game, id),
}
