import { Graphics } from 'pixi.js'
import type {
    BaseCreateEntityPacket,
    GameEntitySerializer,
} from '@core/lib/multi-player-sync/game'
import { BaseGameEntity, type EntityTypeName } from '@core/lib/entities'

export class PointLight extends BaseGameEntity<Graphics> {
    options = { enableCollision: false }

    typeName: EntityTypeName = 'point-light'

    async load() {
        const pixiObject = new Graphics()

        return pixiObject
    }
}

export interface CreatePointLightPacket extends BaseCreateEntityPacket {
    entityTypeName: 'point-light'
}

export const pointLightSerializer: GameEntitySerializer<PointLight, CreatePointLightPacket> = {
    serialize(entity) {
        return {
            entityId: entity.id,
            type: 'game/create-entity',
            entityTypeName: 'point-light',
            initialPosition: entity.initialPosition,
            isRemote: !entity.isRemote,
        }
    },

    createFromPacket(game, packet) {
        return new PointLight(
            game,
            packet.initialPosition,
            packet.entityId,
            packet.isRemote,
        )
    },
}
