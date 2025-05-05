import { Bounds } from 'pixi.js'
import { GameEntity } from '@/game-entity'
import { NotInitializedError } from '@/utils/errors'

function checkIfBoundsColliding(bounds1: Bounds, bounds2: Bounds) {
    return (
        bounds1.x < bounds2.x + bounds2.width &&
        bounds1.x + bounds1.width > bounds2.x &&
        bounds1.y < bounds2.y + bounds2.height &&
        bounds1.y + bounds1.height > bounds2.y
    )
}

type Collision = [GameEntity, GameEntity]

export function getCollisionsBetweenEntities(entities: GameEntity[]): Collision[] {
    const collisions: Collision[] = []

    entities.forEach((entity, index) => {
        if (index === 0) {
            return
        }

        const previousEntity = entities[index - 1]

        if (!previousEntity.pixiObject || !entity.pixiObject) {
            throw new NotInitializedError(
                'Game entities must have their Pixi.js objects initialized',
            )
        }

        const hasCollisions = checkIfBoundsColliding(
            previousEntity.pixiObject.getBounds(),
            entity.pixiObject.getBounds(),
        )

        if (hasCollisions) {
            collisions.push([previousEntity, entity])
        }
    })

    return collisions
}
