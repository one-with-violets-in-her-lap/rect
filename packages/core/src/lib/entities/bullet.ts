import bulletSpriteImage from '@core/assets/images/bullet.png'

import { EntityTypeName, GameEntity } from '@core/lib/entities'
import { Character } from '@core/lib/entities/character'
import { CollisionError } from '@core/lib/utils/errors'
import { Assets, Sprite, Ticker } from 'pixi.js'

const BULLET_VELOCITY = 60
const BULLET_DAMAGE = 10

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
                this.syncStateWithMultiPlayer(pixiObject)
            } catch (error) {
                if (error instanceof CollisionError) {
                    this.game.destroyEntity(this)

                    if (error.collidingEntity instanceof Character) {
                        error.collidingEntity.damageAndSync(BULLET_DAMAGE)
                    }
                } else {
                    throw error
                }
            }
        }

        return pixiObject
    }
}
