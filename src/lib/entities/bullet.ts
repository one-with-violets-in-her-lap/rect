import bulletSpriteImage from '@/assets/images/bullet.png'

import { EntityTypeName, GameEntity } from '@/lib/entities'
import { NotInitializedError } from '@/lib/utils/errors'
import { Assets, Sprite, Ticker } from 'pixi.js'

export class Bullet extends GameEntity {
    typeName: EntityTypeName = 'bullet'
    options = { enableCollision: true, enableGravity: false }

    radiansAngle = 0

    protected async load() {
        await Assets.load(bulletSpriteImage)

        const pixiObject = Sprite.from(bulletSpriteImage)
        pixiObject.width = 40
        pixiObject.height = 19

        return pixiObject
    }

    update(ticker: Ticker) {
        console.log(this.pixiObject)
        const pixiObject = super.update(ticker)

        pixiObject.rotation = this.radiansAngle
        this.movementStatus.isMovingRight = true

        return pixiObject
    }

    destroy() {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Character sprite pixi object was not ' +
                    'initialized, so it cannot be destroyed',
            )
        }

        this.pixiObject.destroy()
    }
}
