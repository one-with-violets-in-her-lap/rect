import { getRandomNumber } from '@core/lib/utils/math'
import { GAME_CANVAS_HEIGHT, GAME_CANVAS_WIDTH, type Game } from '@core/lib/game'
import type { MultiPlayerSession } from '@core/lib/utils/webrtc-multiplayer'
import { Obstacle } from '@core/lib/entities/obstacle'
import { Character, CHARACTER_SIZE } from '@core/lib/entities/character'
import { PointLight } from './entities/light'
import { Boundary } from './entities/boundary'

const OBSTACLE_COUNT = { max: 9, min: 6 }

const OBSTACLE_WIDTH = { max: 530, min: 300 }
const OBSTACLE_HEIGHT = { max: 28, min: 46 }

const OBSTACLE_SPAWN_Y_BOUND = 100
const OBSTACLE_SPAWN_X_BOUND = 130

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
        game.addEntityAndSyncMultiPlayer(
            new Boundary(
                game,
                { x: 0, y: -50 },
                { width: GAME_CANVAS_WIDTH, height: 50 },
            ),
        )

        game.addEntityAndSyncMultiPlayer(
            new Boundary(
                game,
                { x: 0, y: GAME_CANVAS_HEIGHT - 15 },
                { width: GAME_CANVAS_WIDTH, height: 50 },
            ),
        )

        game.addEntityAndSyncMultiPlayer(
            new Boundary(
                game,
                { x: -50, y: 0 },
                { width: -50, height: GAME_CANVAS_HEIGHT },
            ),
        )
        game.addEntityAndSyncMultiPlayer(
            new Boundary(
                game,
                { x: GAME_CANVAS_WIDTH, y: 0 },
                { width: 50, height: GAME_CANVAS_HEIGHT },
            ),
        )

        game.addEntityAndSyncMultiPlayer(new Character(game, { x: 20, y: 20 }))

        game.addEntityAndSyncMultiPlayer(
            new Character(
                game,
                { x: GAME_CANVAS_WIDTH - CHARACTER_SIZE.width, y: 0 },
                undefined,
                true,
            ),
        )

        const obstacleCount = getRandomNumber(
            OBSTACLE_COUNT.min,
            OBSTACLE_COUNT.max,
        )
        for (let counter = 0; counter < obstacleCount; counter++) {
            const width = getRandomNumber(
                OBSTACLE_WIDTH.min,
                OBSTACLE_WIDTH.max,
            )
            const height = getRandomNumber(
                OBSTACLE_HEIGHT.min,
                OBSTACLE_HEIGHT.max,
            )

            const x = getRandomNumber(
                OBSTACLE_SPAWN_X_BOUND,
                GAME_CANVAS_WIDTH -
                    OBSTACLE_SPAWN_X_BOUND -
                    width,
            )

            const y = Math.min(
                Math.max(
                    OBSTACLE_SPAWN_Y_BOUND,
                    (counter / obstacleCount) *
                        GAME_CANVAS_HEIGHT,
                ),
                GAME_CANVAS_HEIGHT -
                    OBSTACLE_SPAWN_Y_BOUND -
                    height,
            )

            const variant = Math.random() > 0.2 ? 'default' : 'unstable'

            const obstacle = new Obstacle(
                game,
                { x, y },
                undefined,
                false,
                variant,
                {
                    width,
                    height,
                },
            )

            game.addEntityAndSyncMultiPlayer(obstacle)
        }

        game.addEntityAndSyncMultiPlayer(
            new PointLight(game, { x: 0, y: 0 }, undefined),
        )
    }
}
