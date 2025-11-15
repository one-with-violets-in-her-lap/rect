import type {
    BaseCreateEntityPacket,
    GameEntitySerializer,
} from '../multi-player-sync/game'
import { type EntityTypeName, BaseGameEntity } from './base'
import { Bullet, bulletSerializer } from './bullet'
import type { Character } from './character'
import { characterSerializer } from './character/serializer'
import { Light, lightSerializer } from './light'
import { Obstacle, obstacleSerializer } from './obstacle'

type GameEntity = Obstacle | Character | Light | Bullet

export const entitySerializersMap: Record<
    EntityTypeName,
    GameEntitySerializer<GameEntity, BaseCreateEntityPacket>
> = {
    obstacle: obstacleSerializer,
    bullet: bulletSerializer,
    character: characterSerializer,
    light: lightSerializer,
}

export { type EntityTypeName, BaseGameEntity, type GameEntity }
