import { Game } from '@core/lib/game'
import { type EntityTypeName, GameEntity } from '@core/lib/entities'
import { Obstacle } from '@core/lib/entities/obstacle'
import {
    addPacketHandler,
    type MultiPlayerPacket,
    type MultiPlayerSession,
} from '@core/lib/utils/webrtc-multiplayer'
import { Character } from '@core/lib/entities/character'
import { type Position } from '@core/lib/utils/position'
import { Bullet } from '@core/lib/entities/bullet'
import { MultiPlayerError } from '@core/lib/utils/errors'

interface CreateEntityPacket extends MultiPlayerPacket {
    type: 'game/create-entity'
    entityTypeName: EntityTypeName
    entityId: string
    initialPosition: Position
    isRemote: boolean
}

interface GameInitializationCompletedPacket extends MultiPlayerPacket {
    type: 'game/initialization-completed'
}

interface DestroyEntityPacket extends MultiPlayerPacket {
    type: 'game/destroy-entity'
    entityId: string
}

export interface GameSynchronizer {
    syncNewEntity(newEntityPacket: CreateEntityPacket): void
    syncEntityDestroy(entityId: string): void
    sendGameInitialization(): void
    waitForGameInitialization(): Promise<void>
    cleanup(): void
}

// TODO: remove code duplication by just dynamically passing params in GameEntity constructor
const entityCreatorsByType: Record<
    CreateEntityPacket['entityTypeName'],
    (game: Game, createEntityPacket: CreateEntityPacket) => GameEntity
> = {
    obstacle: (game, createEntityPacket) =>
        new Obstacle(
            game,
            createEntityPacket.initialPosition,
            createEntityPacket.entityId,
            createEntityPacket.isRemote,
        ),
    character: (game, createEntityPacket) =>
        new Character(
            game,
            createEntityPacket.initialPosition,
            createEntityPacket.entityId,
            createEntityPacket.isRemote,
        ),
    bullet: (game, createEntityPacket) =>
        new Bullet(
            game,
            createEntityPacket.initialPosition,
            createEntityPacket.entityId,
            createEntityPacket.isRemote,
        ),
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
    return entityCreatorsByType[packet.entityTypeName](game, packet)
}
