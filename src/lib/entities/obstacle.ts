import obstacleSpriteImage from '@/assets/images/obstacle.png'

import { Assets, Sprite } from 'pixi.js'
import { EntityTypeName, GameEntity } from '@/lib/entities'
import { Game } from '@/lib/game'
import { Position } from '@/lib/utils/position'

export class Obstacle extends GameEntity<Sprite> {
    typeName: EntityTypeName = 'obstacle'
    options = { enableGravity: false, enableCollision: true }

    constructor(game: Game, initialPosition: Position, id?: string) {
        super(game, initialPosition, id)
    }

    async load() {
        await Assets.load(obstacleSpriteImage)

        const pixiObject = Sprite.from(obstacleSpriteImage)
        pixiObject.setSize(500, 50)

        return pixiObject
    }
}
