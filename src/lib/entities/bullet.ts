import bulletSpriteImage from '@/assets/images/bullet.png'

import { EntityTypeName, GameEntity } from '@/lib/entities'
import { CollisionError } from '@/lib/utils/errors'
import { Assets, Sprite, Ticker } from 'pixi.js'

const BULLET_VELOCITY = 60

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
        const pixiObject = super.update(ticker)

        if (!this.isRemote) {
            pixiObject.rotation = this.radiansAngle

            const newX =
                pixiObject.x +
                Math.cos(this.radiansAngle) * BULLET_VELOCITY * ticker.deltaTime
            const newY =
                pixiObject.y +
                Math.sin(this.radiansAngle) * BULLET_VELOCITY * ticker.deltaTime

            try {
                this.updatePositionRespectingCollisions({ x: newX, y: newY })
            } catch (error) {
                if (error instanceof CollisionError) {
                    this.destroy()
                } else {
                    throw error
                }
            }

            this.syncStateWithMultiPlayer(pixiObject)
        }

        return pixiObject
    }
}
