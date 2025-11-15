import type {
    BaseCreateEntityPacket,
    GameEntitySerializer,
} from '@core/lib/multi-player-sync/game'
import { Character } from '@core/lib/entities/character'

export interface CreateCharacterPacket extends BaseCreateEntityPacket {
    entityTypeName: 'character'
}

export const characterSerializer: GameEntitySerializer<
    Character,
    CreateCharacterPacket
> = {
    serialize(entity) {
        return {
            entityId: entity.id,
            type: 'game/create-entity',
            entityTypeName: 'character',
            initialPosition: entity.initialPosition,
            isRemote: !entity.isRemote,
        }
    },

    createFromPacket(game, packet) {
        return new Character(
            game,
            packet.initialPosition,
            packet.entityId,
            packet.isRemote,
        )
    },
}
