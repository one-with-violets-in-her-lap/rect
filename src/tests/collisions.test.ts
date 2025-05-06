// @vitest-environment happy-dom

import { Sprite } from 'pixi.js'
import { expect, test } from 'vitest'
import { Game } from '@/game'
import { GameEntity } from '@/game-entity'
import { checkIfNewEntityPositionColliding } from '@/collisions'

class MockedGameEntity extends GameEntity {
    constructor(game: Game) {
        super(game, {
            enableCollision: true,
            enableGravity: false,
        })
    }

    load() {
        return new Sprite({ width: 20, height: 20 })
    }

    destroy() {}
}

test('Check collision detection between 3 entities', async () => {
    const ENTITY_1_POSITION_UPDATE = { x: 25, y: 30 }
    const ENTITY_3_POSITION_UPDATE = { x: 300, y: 300 }

    const game = new Game()

    const entity1 = new MockedGameEntity(game)
    const entity2 = new MockedGameEntity(game)
    const entity3 = new MockedGameEntity(game)

    const entity1PixiObject = await entity1.initialize()
    entity1PixiObject.x = 10
    entity1PixiObject.y = 10

    const entity2PixiObject = await entity2.initialize()
    entity2PixiObject.x = 30
    entity2PixiObject.y = 30

    const entity3PixiObject = await entity3.initialize()
    entity3PixiObject.x = 200
    entity3PixiObject.y = 200

    game.entities = [entity1, entity2, entity3]

    expect(
        checkIfNewEntityPositionColliding(
            entity1,
            ENTITY_1_POSITION_UPDATE,
            game.entities,
        ),
        `Entity 1 position update to ${ENTITY_1_POSITION_UPDATE} must be identified as collision`,
    ).toBe(true)

    expect(
        checkIfNewEntityPositionColliding(
            entity3,
            ENTITY_3_POSITION_UPDATE,
            game.entities,
        ),
        `Entity 3 position update to ${ENTITY_3_POSITION_UPDATE} must NOT be identified as collision`,
    ).toBe(false)
})
