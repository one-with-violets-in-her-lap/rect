import { Graphics, type Size } from 'pixi.js'
import type { Game } from '@core/lib/game'
import type {
    BaseCreateEntityPacket,
    GameEntitySerializer,
} from '@core/lib/multi-player-sync/game'
import type { Position } from '@core/lib/utils/position'
import { BaseGameEntity, type EntityTypeName } from './base'

export class Boundary extends BaseGameEntity {
    options = { enableGravity: false, isCollidable: true }

    typeName: EntityTypeName = 'boundary'

    constructor(
        game: Game,
        initialPosition: Position,
        readonly size: Size,
        id?: string,
        isRemote = false,
    ) {
        super(game, initialPosition, id, isRemote)
    }

    async load() {
        const pixiObject = new Graphics()

        pixiObject.rect(0, 0, this.size.width, this.size.height)
        pixiObject.fill('#7F3351')

        pixiObject.setSize(this.size)

        return pixiObject
    }
}

export interface CreateBoundaryPacket extends BaseCreateEntityPacket {
    entityTypeName: 'boundary'
    size: Size
}

export const boundarySerializer: GameEntitySerializer<
    Boundary,
    CreateBoundaryPacket
> = {
    serialize(entity) {
        return {
            entityId: entity.id,
            type: 'game/create-entity',
            entityTypeName: 'boundary',
            initialPosition: entity.initialPosition,
            isRemote: !entity.isRemote,
            size: entity.size,
        }
    },

    createFromPacket(game, packet) {
        return new Boundary(
            game,
            packet.initialPosition,
            packet.size,
            packet.entityId,
            packet.isRemote,
        )
    },
}
