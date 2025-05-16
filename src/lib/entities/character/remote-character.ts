import characterSpriteImage from '@/assets/images/character-1.png'

import { Assets, Sprite } from 'pixi.js'
import { EntityTypeName, GameEntity } from '@/lib/entities'
import { Game } from '@/lib/game'
import { Position } from '@/lib/utils/position'

export class RemoteCharacter extends GameEntity {
    typeName: EntityTypeName = 'remote-character'
    options = { enableCollision: true, enableGravity: false }

    constructor(game: Game, initialPosition: Position, id?: string) {
        super(game, initialPosition, id)
    }

    async load() {
        await Assets.load(characterSpriteImage)

        const pixiObject = Sprite.from(characterSpriteImage)

        return pixiObject
    }
}
