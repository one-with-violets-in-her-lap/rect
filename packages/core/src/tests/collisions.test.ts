// @vitest-environment happy-dom

import { Sprite } from 'pixi.js'
import { expect, test } from 'vitest'
import { Game } from '@core/lib/game'
import { type EntityTypeName, GameEntity } from '@core/lib/entities'
import { checkIfNewEntityPositionColliding } from '@core/lib/collisions'

class MockedGameEntity extends GameEntity {
    typeName: EntityTypeName = 'obstacle'
    options = { enableCollision: true, enableGravity: false }

    load() {
        return new Sprite({ width: 20, height: 20 })
    }
}

test('Check collision detection between 3 entities', async () => {
    const ENTITY_1_POSITION_UPDATE = { x: 25, y: 30 }
    const ENTITY_3_POSITION_UPDATE = { x: 300, y: 300 }

    const game = new Game()

    const entityToCollide1 = new MockedGameEntity(game, { x: 10, y: 10 })
    await entityToCollide1.initialize()

    const entityToCollide2 = new MockedGameEntity(game, { x: 30, y: 30 })
    await entityToCollide2.initialize()

    const entityNotToCollide = new MockedGameEntity(game, { x: 200, y: 200 })
    await entityNotToCollide.initialize()

    const entities = [entityToCollide1, entityToCollide2, entityNotToCollide]

    const collisionInfo1 = checkIfNewEntityPositionColliding(
        entityToCollide1,
        ENTITY_1_POSITION_UPDATE,
        entities,
    )
    expect(
        collisionInfo1.isColliding === true &&
            collisionInfo1.collidingEntity !== null,
        `Entity 1 position update to ${JSON.stringify(ENTITY_1_POSITION_UPDATE)} must ` +
            `be identified as collision and the check must return a collidingEntity`,
    ) // TODO: check if colliding entity is the expected one

    const collisionInfo2 = checkIfNewEntityPositionColliding(
        entityNotToCollide,
        ENTITY_3_POSITION_UPDATE,
        entities,
    )
    expect(
        collisionInfo2.isColliding === false &&
            collisionInfo2.collidingEntity === false,
        `Entity 3 position update to ${JSON.stringify(ENTITY_3_POSITION_UPDATE)} must ` +
            `NOT be identified as collision and the check result must NOT have ` +
            `collidingEntity returned (must be null)`,
    )
})
