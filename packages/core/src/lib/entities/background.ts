import { Graphics, type Size } from 'pixi.js'
import { GAME_CANVAS_HEIGHT, GAME_CANVAS_WIDTH, type Game } from '@core/lib/game'
import type {
    BaseCreateEntityPacket,
    GameEntitySerializer,
} from '@core/lib/multi-player-sync/game'
import type { Position } from '@core/lib/utils/position'
import { BaseGameEntity, type EntityTypeName } from './base'

export class Background extends BaseGameEntity {
    options = { enableCollision: false }

    typeName: EntityTypeName = 'background'

    constructor(
        game: Game,
        initialPosition: Position,
        id?: string,
        isRemote = false,
    ) {
        super(game, initialPosition, id, isRemote)
    }

    async load() {
        const pixiObject = new Graphics()

        pixiObject.rect(0, 0, GAME_CANVAS_WIDTH, GAME_CANVAS_HEIGHT)
        pixiObject.fill('#FFFFFF')

        return pixiObject
    }
}

export interface CreateBackgroundPacket extends BaseCreateEntityPacket {
    entityTypeName: 'background'
}

export const backgroundSerializer: GameEntitySerializer<
    Background,
    CreateBackgroundPacket
> = {
    serialize(entity) {
        return {
            entityId: entity.id,
            type: 'game/create-entity',
            entityTypeName: 'background',
            initialPosition: entity.initialPosition,
            isRemote: !entity.isRemote,
        }
    },

    createFromPacket(game, packet) {
        return new Background(
            game,
            packet.initialPosition,
            packet.entityId,
            packet.isRemote,
        )
    },
}

