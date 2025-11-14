import defaultObstacleSpriteImage from '@core/assets/sprites/obstacle/default.png'
import unstableObstacleSpriteImage from '@core/assets/sprites/obstacle/unstable.png'

import { Assets, Bounds, Container, Graphics, Sprite, type Size } from 'pixi.js'
import { type EntityTypeName, BaseGameEntity } from '@core/lib/entities'
import type { Game } from '../game'
import type { Position } from '../utils/position'
import { NotInitializedError } from '../utils/errors'
import type {
    BaseCreateEntityPacket,
    GameEntitySerializer,
} from '../multi-player-sync/game'

export type ObstacleVariant = 'default' | 'unstable'

const OBSTACLE_SPRITES: Record<ObstacleVariant, string> = {
    default: defaultObstacleSpriteImage,
    unstable: unstableObstacleSpriteImage,
}

export class Obstacle extends BaseGameEntity {
    options = { enableGravity: false, enableCollision: true }

    typeName: EntityTypeName = 'obstacle'

    shadow?: Graphics
    sprite?: Sprite

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

        this.sprite = Sprite.from(OBSTACLE_SPRITES[this.variant])
        this.sprite.setSize(this.size)

        const pixiObject = new Container()

        const shadowHeight =
            this.game.containerElement.clientHeight - this.initialPosition.y
        const shadowWidth = this.size.width - 20

        this.shadow = new Graphics()
            .poly([
                0,
                0,
                shadowWidth,
                0,
                shadowWidth * 2,
                shadowHeight,
                shadowWidth / 2,
                shadowHeight,
            ])
            .fill('#000000')
        this.shadow.position.set(20, 20)
        this.shadow.alpha = 0.03

        pixiObject.addChild(this.shadow)

        pixiObject.addChild(this.sprite)

        return pixiObject
    }

    getBoundingBox() {
        if (!this.sprite || !this.pixiObject) {
            throw new NotInitializedError(
                'Cannot get bounding box because sprite is not initialized',
            )
        }

        return new Bounds(
            this.pixiObject.x,
            this.pixiObject.y + 4,
            this.pixiObject.x + this.sprite.width,
            this.pixiObject.y + this.sprite.height,
        )
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
            isRemote: false,
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
