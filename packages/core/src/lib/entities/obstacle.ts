import defaultObstacleSpriteImage from '@core/assets/sprites/obstacle/default.png'
import unstableObstacleSpriteImage from '@core/assets/sprites/obstacle/unstable.png'

import { Assets, Sprite, type Size } from 'pixi.js'
import { type EntityTypeName, BaseGameEntity } from '@core/lib/entities'
import type { Game } from '@core/lib/game'
import type { Position } from '@core/lib/utils/position'
import type {
    BaseCreateEntityPacket,
    GameEntitySerializer,
} from '@core/lib/multi-player-sync/game'

export type ObstacleVariant = 'default' | 'unstable'

const OBSTACLE_SPRITES: Record<ObstacleVariant, string> = {
    default: defaultObstacleSpriteImage,
    unstable: unstableObstacleSpriteImage,
}

export class Obstacle extends BaseGameEntity {
    options = { enableGravity: false, isCollidable: true }

    typeName: EntityTypeName = 'obstacle'

    constructor(
        game: Game,
        initialPosition: Position,
        id?: string,
        isRemote = false,
        readonly variant: ObstacleVariant = 'default',
        readonly size: Size = { height: 32, width: 300 },
    ) {
        super(game, initialPosition, id, isRemote)
    }

    async load() {
        await Assets.load(OBSTACLE_SPRITES[this.variant])

        const pixiObject = Sprite.from(OBSTACLE_SPRITES[this.variant])
        pixiObject.setSize(this.size)

        return pixiObject
    }
}

export interface CreateObstaclePacket extends BaseCreateEntityPacket {
    entityTypeName: 'obstacle'
    variant: ObstacleVariant
    size: Size
}

export const obstacleSerializer: GameEntitySerializer<
    Obstacle,
    CreateObstaclePacket
> = {
    serialize(obstacle) {
        return {
            entityId: obstacle.id,
            type: 'game/create-entity',
            entityTypeName: 'obstacle',
            initialPosition: obstacle.initialPosition,
            isRemote: !obstacle.isRemote,
            size: obstacle.size,
            variant: obstacle.variant,
        }
    },

    createFromPacket(game, packet) {
        return new Obstacle(
            game,
            packet.initialPosition,
            packet.entityId,
            packet.isRemote,
            packet.variant,
            packet.size,
        )
    },
}
