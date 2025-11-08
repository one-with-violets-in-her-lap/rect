import { getRandomNumber } from '@core/lib/utils/math'
import { GAME_CANVAS_WIDTH, type Game } from '@core/lib/game'
import type { MultiPlayerSession } from '@core/lib/utils/webrtc-multiplayer'
import { Obstacle } from '@core/lib/entities/obstacle'
import { Character, CHARACTER_SIZE } from '@core/lib/entities/character'
import { Light } from './entities/light'

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
        game.addEntityAndSyncMultiPlayer(new Character(game, { x: 0, y: 0 }))

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
                game.containerElement.clientWidth -
                    OBSTACLE_SPAWN_X_BOUND -
                    width,
            )

            const y = Math.min(
                Math.max(
                    OBSTACLE_SPAWN_Y_BOUND,
                    (counter / obstacleCount) *
                        game.containerElement.clientHeight,
                ),
                game.containerElement.clientHeight -
                    OBSTACLE_SPAWN_Y_BOUND -
                    height,
            )

            const variant = Math.random() > 0.2 ? 'default' : 'unstable'

            const obstacle = new Obstacle(game, { x, y }, undefined, variant, {
                width,
                height,
            })

            game.addEntityAndSyncMultiPlayer(obstacle)
        }

        game.addEntityAndSyncMultiPlayer(
            new Light(game, { x: 0, y: 0 }, undefined),
        )
    }
}
