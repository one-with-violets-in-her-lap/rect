import type { Spritesheet } from 'pixi.js'
import { GameEntity } from '@core/lib/entities'
import {
    addPacketHandler,
    type MultiPlayerPacket,
    type MultiPlayerSession,
} from '@core/lib/utils/webrtc-multiplayer'
import {
    type AnimatedSpriteWithMetadata,
    type SpriteAnimation,
} from '../utils/sprites'

interface SpriteUpdatePacket<TSpritesheet extends Spritesheet>
    extends MultiPlayerPacket {
    type: 'entity/sprite/update'
    entityId: string
    newAnimation: SpriteAnimation<TSpritesheet>
}

export interface SpriteSynchronizer<TSpritesheet extends Spritesheet> {
    syncSpriteUpdate(newAnimation: SpriteAnimation<TSpritesheet>): void
}

export function createSpriteSynchronizer<TSpritesheet extends Spritesheet>(
    entity: GameEntity<AnimatedSpriteWithMetadata<TSpritesheet>>,
    multiPlayerSession: MultiPlayerSession,
): SpriteSynchronizer<TSpritesheet> {
    addPacketHandler(
        multiPlayerSession.receiveConnection,
        'entity/sprite/update',
        (packet: SpriteUpdatePacket<TSpritesheet>) => {
            if (packet.entityId === entity.id) {
                const pixiObject = entity.getPixiObjectOrThrow()
                pixiObject.playAnimation(packet.newAnimation)
            }
        },
    )

    return {
        syncSpriteUpdate(newAnimation) {
            const movementPacket: SpriteUpdatePacket<TSpritesheet> = {
                type: 'entity/sprite/update',
                entityId: entity.id,
                newAnimation,
            }

            multiPlayerSession.sendConnection.send(movementPacket)
        },
    }
}
