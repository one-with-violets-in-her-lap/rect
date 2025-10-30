import obstacleSpriteImage from '@core/assets/sprites/obstacle.png'

import { Assets, Sprite } from 'pixi.js'
import { type EntityTypeName, GameEntity } from '@core/lib/entities'

export class Obstacle extends GameEntity<Sprite> {
    typeName: EntityTypeName = 'obstacle'
    options = { enableGravity: false, enableCollision: true }

    async load() {
        await Assets.load(obstacleSpriteImage)

        const pixiObject = Sprite.from(obstacleSpriteImage)
        pixiObject.setSize(500, 50)

        return pixiObject
    }
}
