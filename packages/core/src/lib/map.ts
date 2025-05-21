import {
    GAME_CANVAS_HEIGHT,
    GAME_CANVAS_WIDTH,
    type Game,
} from '@core/lib/game'
import type { MultiPlayerSession } from '@core/lib/utils/webrtc-multiplayer'
import { Obstacle } from '@core/lib/entities/obstacle'
import { Character, CHARACTER_SIZE } from '@core/lib/entities/character'

/**
 * Adds game entities to the game that form a complete map users can play
 *
 * Adds them only
 * if the current player is a **host** - *user who created a game and gave the link to other
 * peer*
 */
export function loadMapIfHost(
    game: Game,
    multiPlayerSession: MultiPlayerSession | null,
) {
    if (!multiPlayerSession || multiPlayerSession.type === 'host') {
        game.addEntityAndSyncMultiPlayer(new Character(game, { x: 0, y: 0 }))

        game.addEntityAndSyncMultiPlayer(
            new Obstacle(game, { x: 0, y: GAME_CANVAS_HEIGHT * 0.38 }),
        )

        game.addEntityAndSyncMultiPlayer(
            new Obstacle(game, {
                x: GAME_CANVAS_WIDTH * 0.7,
                y: GAME_CANVAS_HEIGHT * 0.9,
            }),
        )

        game.addEntityAndSyncMultiPlayer(
            new Obstacle(game, {
                x: GAME_CANVAS_WIDTH * 0.35,
                y: GAME_CANVAS_HEIGHT * 0.7,
            }),
        )

        game.addEntityAndSyncMultiPlayer(
            new Obstacle(game, {
                x: GAME_CANVAS_WIDTH * 0.1,
                y: GAME_CANVAS_HEIGHT * 0.9,
            }),
        )

        game.addEntityAndSyncMultiPlayer(
            new Obstacle(game, {
                x: GAME_CANVAS_WIDTH * 0.5,
                y: GAME_CANVAS_HEIGHT * 0.46,
            }),
        )

        game.addEntityAndSyncMultiPlayer(
            new Obstacle(game, {
                x: GAME_CANVAS_WIDTH * 0.3,
                y: GAME_CANVAS_HEIGHT * 0.2,
            }),
        )

        game.addEntityAndSyncMultiPlayer(
            new Character(
                game,
                { x: GAME_CANVAS_WIDTH - CHARACTER_SIZE.width, y: 0 },
                undefined,
                true,
            ),
        )
    }
}
