import { Bounds } from 'pixi.js'
import { GameEntity } from '@/lib/entities'

export function checkIfBoundsColliding(bounds1: Bounds, bounds2: Bounds) {
    return (
        bounds1.x < bounds2.x + bounds2.width &&
        bounds1.x + bounds1.width > bounds2.x &&
        bounds1.y < bounds2.y + bounds2.height &&
        bounds1.y + bounds1.height > bounds2.y
    )
}

/**
 * Checks if new position of some entity does not collide with other entities
 *
 * @param targetEntityToCheck Entity, which new position will be checked
 *
 * @param newPositionToCheck New position to check for collisions
 *
 * @param allEntities All entities against which to check for collisions.
 *
 * This function automatically filters out the target entity from `allEntities`,
 * so you don't need to it yourself
 *
 * @returns `false` if there are **no** collisions, otherwise `false`
 */
export function checkIfNewEntityPositionColliding(
    targetEntityToCheck: GameEntity,
    newPositionToCheck: { x: number; y: number },
    allEntities: GameEntity[],
) {
    return allEntities.some((entity) => {
        if (entity === targetEntityToCheck) {
            return false
        }

        return checkIfBoundsColliding(
            entity.getPixiObjectOrThrow().getBounds(),
            new Bounds(
                newPositionToCheck.x,
                newPositionToCheck.y,
                newPositionToCheck.x +
                    targetEntityToCheck.getPixiObjectOrThrow().width,
                newPositionToCheck.y +
                    targetEntityToCheck.getPixiObjectOrThrow().height,
            ),
        )
    })
}
