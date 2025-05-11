import { Game } from '@/lib/game'
import { EntityTypeName, GameEntity } from '@/lib/entities'
import { Obstacle } from '@/lib/entities/obstacle'
import { RemoteCharacter } from '@/lib/entities/character/remote-character'
import {
    addPacketHandler,
    MultiPlayerPacket,
    MultiPlayerSession,
} from '@/lib/utils/webrtc-multiplayer'
import { CurrentControlledCharacter } from '@/lib/entities/character/controlled-character'
import { Position } from '@/lib/utils/position'

interface CreateEntityPacket extends MultiPlayerPacket {
    type: 'game/create-entity'
    entityTypeName: EntityTypeName
    entityId: string
    initialPosition: Position
}

interface GameInitializationCompletedPacket extends MultiPlayerPacket {
    type: 'game/initialization-completed'
}

export interface GameSynchronizer {
    syncNewEntity(newEntityPacket: CreateEntityPacket): void
    sendGameInitialization(): void
    waitForGameInitialization(): Promise<void>
}

const entityCreatorsByType: Record<
    CreateEntityPacket['entityTypeName'],
    (game: Game, createEntityPacket: CreateEntityPacket) => GameEntity
> = {
    obstacle: (game, createEntityPacket) =>
        new Obstacle(
            game,
            createEntityPacket.initialPosition,
            createEntityPacket.entityId,
        ),
    'remote-character': (game, createEntityPacket) =>
        new RemoteCharacter(
            game,
            createEntityPacket.initialPosition,
            createEntityPacket.entityId,
        ),
    'current-controlled-character': (game, createEntityPacket) =>
        new CurrentControlledCharacter(
            game,
            createEntityPacket.initialPosition,
            createEntityPacket.entityId,
        ),
}

export function createGameSynchronizer(
    game: Game,
    multiPlayerSession: MultiPlayerSession,
    addNewEntity: (entities: GameEntity) => void,
): GameSynchronizer {
    addPacketHandler(
        multiPlayerSession.receiveConnection,
        'game/create-entity',
        (packet: CreateEntityPacket) =>
            addNewEntity(createEntityFromPacket(game, packet)),
    )

    return {
        syncNewEntity(newEntityPacket) {
            multiPlayerSession.sendConnection.send(newEntityPacket)
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
    }
}

function createEntityFromPacket(game: Game, packet: CreateEntityPacket) {
    return entityCreatorsByType[packet.entityTypeName](game, packet)
}
