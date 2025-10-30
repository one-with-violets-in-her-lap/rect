import type { AnimatedSprite, Spritesheet } from 'pixi.js'
import { GameEntity } from '@core/lib/entities'
import {
    addPacketHandler,
    type MultiPlayerPacket,
    type MultiPlayerSession,
} from '@core/lib/utils/webrtc-multiplayer'
import { playAnimation } from '../utils/sprites'

interface SpriteUpdatePacket extends MultiPlayerPacket {
    type: 'entity/sprite/update'
    entityId: string
    newSpriteName: string
}

export interface SpriteSynchronizer {
    syncSpriteUpdate(newSpriteName: string): void
}

export function createSpriteSynchronizer(
    entity: GameEntity<AnimatedSprite>,
    spritesheet: Spritesheet,
    multiPlayerSession: MultiPlayerSession,
): SpriteSynchronizer {
    addPacketHandler(
        multiPlayerSession.receiveConnection,
        'entity/sprite/update',
        (packet: SpriteUpdatePacket) => {
            if (packet.entityId === entity.id) {
                const pixiObject = entity.getPixiObjectOrThrow()
                playAnimation(
                    pixiObject,
                    spritesheet.animations,
                    packet.newSpriteName,
                )
            }
        },
    )

    return {
        syncSpriteUpdate(newSpriteName) {
            const movementPacket: SpriteUpdatePacket = {
                type: 'entity/sprite/update',
                entityId: entity.id,
                newSpriteName,
            }

            multiPlayerSession.sendConnection.send(movementPacket)
        },
    }
}
