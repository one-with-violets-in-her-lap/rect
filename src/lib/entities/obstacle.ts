import obstacleSpriteImage from '@/assets/images/obstacle.png'

import { Assets, Sprite } from 'pixi.js'
import { EntityTypeName, GameEntity } from '@/lib/entities'
import { Game } from '@/lib/game'
import { NotInitializedError } from '@/lib/utils/errors'
import { Position } from '@/lib/utils/position'

export class Obstacle extends GameEntity<Sprite> {
    typeName: EntityTypeName = 'obstacle'
    options = { enableGravity: false, enableCollision: true }

    sprite?: Sprite

    constructor(game: Game, initialPosition: Position, id?: string) {
        super(game, initialPosition, id)
    }

    async load() {
        await Assets.load(obstacleSpriteImage)
        this.sprite = Sprite.from(obstacleSpriteImage)
        this.sprite.setSize(500, 50)

        return this.sprite
    }

    async destroy() {
        if (!this.sprite) {
            throw new NotInitializedError(
                'Character sprite pixi object was not ' +
                    'initialized, so it cannot be destroyed',
            )
        }

        this.sprite.destroy()
    }
}
