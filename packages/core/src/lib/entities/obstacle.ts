import defaultObstacleSpriteImage from '@core/assets/sprites/obstacle/default.png'
import unstableObstacleSpriteImage from '@core/assets/sprites/obstacle/unstable.png'

import { Assets, Bounds, Container, Graphics, Sprite, type Size } from 'pixi.js'
import { type EntityTypeName, GameEntity } from '@core/lib/entities'
import type { Game } from '../game'
import type { Position } from '../utils/position'
import { NotInitializedError } from '../utils/errors'

export type ObstacleVariant = 'default' | 'unstable'

const OBSTACLE_SPRITES: Record<ObstacleVariant, string> = {
    default: defaultObstacleSpriteImage,
    unstable: unstableObstacleSpriteImage,
}

export class Obstacle extends GameEntity {
    options = { enableGravity: false, enableCollision: true }

    typeName: EntityTypeName = 'obstacle'

    shadow?: Graphics
    sprite?: Sprite

    constructor(
        game: Game,
        initialPosition: Position,
        id?: string,
        private readonly variant: ObstacleVariant = 'default',
        private readonly size: Size = { height: 32, width: 300 },
    ) {
        super(game, initialPosition, id)
    }

    async load() {
        await Assets.load(OBSTACLE_SPRITES[this.variant])

        this.sprite = Sprite.from(OBSTACLE_SPRITES[this.variant])
        this.sprite.setSize(this.size)

        this.shadow = new Graphics()
            .rect(
                20,
                5,
                this.sprite.width - 20,
                this.game.containerElement.clientHeight -
                    this.initialPosition.y,
            )
            .fill('#000000')
	this.shadow.alpha = 0.05

        const pixiObject = new Container()
        pixiObject.addChild(this.shadow)
        pixiObject.addChild(this.sprite)

        return pixiObject
    }

    getBoundingBox() {
        if (!this.sprite) {
            throw new NotInitializedError(
                'Cannot get bounding box because sprite is not initialized',
            )
        }

        return this.sprite.getBounds()
    }
}
