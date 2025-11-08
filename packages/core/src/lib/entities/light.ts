import { BlurFilter, Graphics } from 'pixi.js'
import { GameEntity, type EntityTypeName } from './index'

const LIGHT_WIDTH = 800
const LIGHT_RAY_WIDTH = 2

export class Light extends GameEntity<Graphics> {
    options = { enableCollision: false }

    typeName: EntityTypeName = 'light'

    async load() {
        let pixiObject = new Graphics()

        for (let rayX = 0; rayX < LIGHT_WIDTH; rayX += LIGHT_RAY_WIDTH) {
            const rayHeight =
                this.game.containerElement.clientHeight - this.initialPosition.y

            pixiObject = pixiObject.poly([
                rayX,
                0,
                rayX + LIGHT_RAY_WIDTH,
                0,
                rayX + 380,
                rayHeight,
                rayX + 380 - LIGHT_RAY_WIDTH,
                rayHeight,
            ])
        }

        pixiObject = pixiObject.fill('#FFFFFF')
        pixiObject.alpha = 0.1

        const blurFilter = new BlurFilter({ strength: 20 })
        pixiObject.filters = [blurFilter]

        return pixiObject
    }
}
