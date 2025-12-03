import { getRandomNumber } from '@core/lib/utils/math'
import { Game, GAME_CANVAS_HEIGHT, GAME_CANVAS_WIDTH } from '@core/lib/game'
import type { MultiPlayerSession } from '@core/lib/utils/webrtc-multiplayer'
import type { GameEntity } from '@core/lib/entities'
import { Obstacle } from '@core/lib/entities/obstacle'
import { PointLight } from '@core/lib/entities/light'
import { Boundary } from '@core/lib/entities/boundary'
import { Character, CHARACTER_SIZE } from '@core/lib/entities/character'
import {
    createMapSynchronizer,
    type MapSynchronizer,
} from './multi-player-sync'

const OBSTACLE_COUNT = { max: 6, min: 4 }

const OBSTACLE_WIDTH = { max: 430, min: 300 }
const OBSTACLE_HEIGHT = { max: 28, min: 46 }

const OBSTACLE_SPAWN_Y_BOUND = 100
const OBSTACLE_SPAWN_X_BOUND = 130

const BOUNDARY_SIZE = 80
const HIDDEN_BOUNDARY_OFFSET = 80
const BOTTOM_VISIBLE_BOUNDARY_OFFSET = 15

export class GameMap {
    private mapSynchronizer: MapSynchronizer | null = null

    constructor(
        private readonly multiPlayerSession: MultiPlayerSession | null,
    ) {}

    async initialize(game: Game) {
	console.log('map init', game)
        if (this.multiPlayerSession) {
            this.mapSynchronizer = createMapSynchronizer(
                this,
                game,
                this.multiPlayerSession,
            )
        }

        if (
            !this.multiPlayerSession ||
            this.multiPlayerSession.type === 'host'
        ) {
            this.clear(game)

            const entities: GameEntity[] = []

            // Top boundary
            entities.push(
                new Boundary(
                    game,
                    { x: 0, y: -HIDDEN_BOUNDARY_OFFSET },
                    { width: GAME_CANVAS_WIDTH, height: BOUNDARY_SIZE },
                ),
            )

            // Bottom visible boundary (floor)
            entities.push(
                new Boundary(
                    game,
                    {
                        x: 0,
                        y: GAME_CANVAS_HEIGHT - BOTTOM_VISIBLE_BOUNDARY_OFFSET,
                    },
                    { width: GAME_CANVAS_WIDTH, height: BOUNDARY_SIZE },
                ),
            )

            // Left boundary
            entities.push(
                new Boundary(
                    game,
                    { x: -HIDDEN_BOUNDARY_OFFSET, y: 0 },
                    { width: -BOUNDARY_SIZE, height: GAME_CANVAS_HEIGHT },
                ),
            )

            // Right boundary
            entities.push(
                new Boundary(
                    game,
                    { x: GAME_CANVAS_WIDTH, y: 0 },
                    { width: BOUNDARY_SIZE, height: GAME_CANVAS_HEIGHT },
                ),
            )

            entities.push(new Character(game, { x: 20, y: 20 }))

            entities.push(
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
                    GAME_CANVAS_WIDTH - OBSTACLE_SPAWN_X_BOUND - width,
                )

                const y = Math.min(
                    Math.max(
                        OBSTACLE_SPAWN_Y_BOUND,
                        (counter / obstacleCount) * GAME_CANVAS_HEIGHT,
                    ),
                    GAME_CANVAS_HEIGHT - OBSTACLE_SPAWN_Y_BOUND - height,
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

                entities.push(obstacle)
            }

            entities.push(
                new PointLight(
                    game,
                    { x: GAME_CANVAS_WIDTH / 2, y: 0 },
                    undefined,
                ),
            )

            this.mapSynchronizer?.syncMapInitialization(entities)

            entities.forEach((entity) => {
                game.addEntityToPixiApp(entity)
            })
        }
    }

    clear(game: Game) {
        for (const entity of game.entities) {
            game.destroyEntity(entity, false)
        }

        game.entities = []
    }
}
