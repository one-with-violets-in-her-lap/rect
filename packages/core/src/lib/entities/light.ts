import { BlurFilter, Graphics } from 'pixi.js'
import type {
    BaseCreateEntityPacket,
    GameEntitySerializer,
} from '@core/lib/multi-player-sync/game'
import { GameEntity, type EntityTypeName } from '@core/lib/entities'

export class Light extends GameEntity<Graphics> {
    options = { enableCollision: false }

    typeName: EntityTypeName = 'light'

    async load() {
        const pixiObject = new Graphics()
            .poly([
                0,
                0,
                500,
                0,
                1200,
                this.game.containerElement.clientHeight,
                400,
                this.game.containerElement.clientHeight,
            ])
            .fill('#FFFFFF')

        pixiObject.alpha = 0.1

        const blurFilter = new BlurFilter({ strength: 10 })
        pixiObject.filters = [blurFilter]

        return pixiObject
    }
}

export interface CreateLightPacket extends BaseCreateEntityPacket {
    entityTypeName: 'light'
}

export const lightSerializer: GameEntitySerializer<Light, CreateLightPacket> = {
    serialize(entity) {
        return {
            entityId: entity.id,
            type: 'game/create-entity',
            entityTypeName: 'light',
            initialPosition: entity.initialPosition,
            isRemote: false,
        }
    },

    createFromPacket(game, packet) {
        return new Light(
            game,
            packet.initialPosition,
            packet.entityId,
            packet.isRemote,
        )
    },
}
