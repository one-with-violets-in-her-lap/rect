import type { Game } from '@core/lib/game'
import {
    addPacketHandler,
    type MultiPlayerPacket,
    type MultiPlayerSession,
} from '@core/lib/utils/webrtc-multiplayer'
import type { BaseCreateEntityPacket } from '@core/lib/multi-player-sync/game'
import { entitySerializersMap, type GameEntity } from '@core/lib/entities'
import type { GameMap } from '.'

interface MapInitializePacket extends MultiPlayerPacket {
    type: 'map/initialize'
    entities: BaseCreateEntityPacket[]
}

export interface MapSynchronizer {
    syncMapInitialization(entities: GameEntity[]): void
}

export function createMapSynchronizer(
    map: GameMap,
    game: Game,
    multiPlayerSession: MultiPlayerSession,
) {
    addPacketHandler<MapInitializePacket>(
        multiPlayerSession.receiveConnection,
        'map/initialize',
        async (packet) => {
	    console.log(packet)

            map.clear(game)

	    console.log(game.entities)

            packet.entities.forEach((entityPacket) => {
                const entity = entitySerializersMap[
                    entityPacket.entityTypeName
                ].createFromPacket(game, entityPacket)
                game.entities.push(entity)
                game.addEntityToPixiApp(entity)
            })
        },
    )

    return {
        syncMapInitialization(entities: GameEntity[]) {
            const entityPackets = entities.map((entity) =>
                entitySerializersMap[entity.typeName].serialize(entity),
            )

            const mapInitializationPacket: MapInitializePacket = {
                type: 'map/initialize',
                entities: entityPackets,
            }

            multiPlayerSession.sendConnection.send(mapInitializationPacket)
        },
    }
}
