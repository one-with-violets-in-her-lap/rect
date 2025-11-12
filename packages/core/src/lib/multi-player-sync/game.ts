import { Game } from '@core/lib/game'
import { type EntityTypeName, GameEntity } from '@core/lib/entities'
import {
    addPacketHandler,
    type MultiPlayerPacket,
    type MultiPlayerSession,
} from '@core/lib/utils/webrtc-multiplayer'
import { type Position } from '@core/lib/utils/position'
import { MultiPlayerError } from '@core/lib/utils/errors'
import {
    obstacleSerializer,
    type CreateObstaclePacket,
} from '@core/lib/entities/obstacle'
import {
    characterSerializer,
    type CreateCharacterPacket,
} from '@core/lib/entities/character/serializer'
import {
    bulletSerializer,
    type CreateBulletPacket,
} from '@core/lib/entities/bullet'
import {
    lightSerializer,
    type CreateLightPacket,
} from '@core/lib/entities/light'

export interface BaseCreateEntityPacket extends MultiPlayerPacket {
    type: 'game/create-entity'
    entityTypeName: EntityTypeName
    entityId: string
    initialPosition: Position
    isRemote: boolean
}

export type CreateEntityPacket =
    | CreateObstaclePacket
    | CreateCharacterPacket
    | CreateBulletPacket
    | CreateLightPacket

interface GameInitializationCompletedPacket extends MultiPlayerPacket {
    type: 'game/initialization-completed'
}

interface DestroyEntityPacket extends MultiPlayerPacket {
    type: 'game/destroy-entity'
    entityId: string
}

export interface GameSynchronizer {
    syncNewEntity(newEntityPacket: BaseCreateEntityPacket): void
    syncEntityDestroy(entityId: string): void
    sendGameInitialization(): void
    waitForGameInitialization(): Promise<void>
    cleanup(): void
}

export function createGameSynchronizer(
    game: Game,
    multiPlayerSession: MultiPlayerSession,
): GameSynchronizer {
    addPacketHandler(
        multiPlayerSession.receiveConnection,
        'game/create-entity',
        (packet: CreateEntityPacket) => {
            const entity = createEntityFromPacket(game, packet)
            game.entities.push(entity)
            game.addEntityToPixiApp(entity)
        },
    )

    addPacketHandler(
        multiPlayerSession.receiveConnection,
        'game/destroy-entity',
        (packet: DestroyEntityPacket) => {
            const entity = game.entities.find(
                (entity) => entity.id === packet.entityId,
            )

            if (!entity) {
                throw new MultiPlayerError(
                    `Failed to find an entity with ${packet.entityId} from entity ` +
                        `destroy packet. Game is probably out of sync`,
                )
            }

            game.destroyEntity(entity, false)
        },
    )

    return {
        syncNewEntity(newEntityPacket) {
            multiPlayerSession.sendConnection.send(newEntityPacket)
        },

        syncEntityDestroy(entityId) {
            const destroyPacket: DestroyEntityPacket = {
                type: 'game/destroy-entity',
                entityId,
            }

            multiPlayerSession.sendConnection.send(destroyPacket)
        },

        sendGameInitialization() {
            const gameInitializationCompletedPacket: GameInitializationCompletedPacket =
                {
                    type: 'game/initialization-completed',
                }

            multiPlayerSession.sendConnection.send(
                gameInitializationCompletedPacket,
            )
        },

        waitForGameInitialization() {
            return new Promise((resolve) => {
                addPacketHandler<GameInitializationCompletedPacket>(
                    multiPlayerSession.receiveConnection,
                    'game/initialization-completed',
                    () => {
                        resolve()
                    },
                )
            })
        },

        cleanup() {
            multiPlayerSession.receiveConnection.removeAllListeners()
        },
    }
}

function createEntityFromPacket(game: Game, packet: CreateEntityPacket) {
    // TODO: shitty code, make some kind of a registry in entities module
    switch (packet.entityTypeName) {
        case 'obstacle':
            return obstacleSerializer.createFromPacket(game, packet)

        case 'character':
            return characterSerializer.createFromPacket(game, packet)

        case 'bullet':
            return bulletSerializer.createFromPacket(game, packet)

        case 'light':
            return lightSerializer.createFromPacket(game, packet)
    }
}

export interface GameEntitySerializer<
    TGameEntity extends GameEntity,
    TSerializedPacket extends BaseCreateEntityPacket,
> {
    serialize(entity: TGameEntity): TSerializedPacket
    createFromPacket(game: Game, packet: TSerializedPacket): TGameEntity
}
