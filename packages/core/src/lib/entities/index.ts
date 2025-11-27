import type {
    BaseCreateEntityPacket,
    GameEntitySerializer,
} from '../multi-player-sync/game'
import { type EntityTypeName, BaseGameEntity } from './base'
import { Boundary, boundarySerializer } from './boundary'
import { Bullet, bulletSerializer } from './bullet'
import type { Character } from './character'
import { characterSerializer } from './character/serializer'
import { PointLight, pointLightSerializer } from './light'
import { Obstacle, obstacleSerializer } from './obstacle'

type GameEntity = Obstacle | Character | PointLight | Bullet | Boundary

export const entitySerializersMap: Record<
    EntityTypeName,
    GameEntitySerializer<GameEntity, BaseCreateEntityPacket>
> = {
    obstacle: obstacleSerializer,
    bullet: bulletSerializer,
    character: characterSerializer,
    'point-light': pointLightSerializer,
    boundary: boundarySerializer,
}

export { type EntityTypeName, BaseGameEntity, type GameEntity }
