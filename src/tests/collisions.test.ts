// @vitest-environment happy-dom

import { getCollisionsBetweenEntities } from '@/collisions'
import { GameEntity } from '@/game-entity'
import { Sprite } from 'pixi.js'
import { expect, test } from 'vitest'

class MockedGameEntity extends GameEntity {
    constructor(canvas: HTMLCanvasElement) {
        super(canvas, {
            enableCollision: true,
            enableGravity: false,
        })
    }

    load() {
        return new Sprite({ width: 20, height: 20 })
    }

    destroy() {}
}

test('Two colliding entities must be detected', async () => {
    const canvas = document.createElement('canvas')

    const entity1 = new MockedGameEntity(canvas)
    const entity2 = new MockedGameEntity(canvas)
    const entity3 = new MockedGameEntity(canvas)

    const entity1PixiObject = await entity1.initialize()
    entity1PixiObject.x = 10
    entity1PixiObject.y = 10

    const entity2PixiObject = await entity2.initialize()
    entity2PixiObject.x = 15
    entity2PixiObject.y = 15

    const entity3PixiObject = await entity3.initialize()
    entity3PixiObject.x = 40
    entity3PixiObject.y = 40

    const collisions = getCollisionsBetweenEntities([entity1, entity2, entity3])
    expect(collisions).toStrictEqual([[entity1, entity2]])
})
