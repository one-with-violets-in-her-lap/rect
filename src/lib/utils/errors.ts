import { GameEntity } from '@/lib/entities'

export class RectGameError extends Error {}

export class MultiPlayerError extends RectGameError {}

export class NotInitializedError extends RectGameError {}

export class CollisionError extends RectGameError {
    /**
     * Entity, with which collision was detected. If `null` - collision occurred with
     * screen bounds
     */
    collidingEntity: GameEntity | null = null

    constructor(collidingEntity: GameEntity | null = null) {
        const errorMessage = collidingEntity
            ? `Collision with entity ${collidingEntity.typeName}-${collidingEntity.id} was detected`
            : 'Collision with screen bounds was detected'

        super(errorMessage)

        this.collidingEntity = collidingEntity
    }
}
