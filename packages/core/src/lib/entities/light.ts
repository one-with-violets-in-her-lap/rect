import { BlurFilter, Graphics } from 'pixi.js'
import { GameEntity, type EntityTypeName } from './index'

export class Light extends GameEntity<Graphics> {
    options = { enableCollision: false }

    typeName: EntityTypeName = 'light'

    async load() {
        const pixiObject = new Graphics()
            .poly([
                0,
                0,
                500,
                0,
                1200,
                this.game.containerElement.clientHeight,
                400,
                this.game.containerElement.clientHeight,
            ])
            .fill('#FFFFFF')

        pixiObject.alpha = 0.1

        const blurFilter = new BlurFilter({ strength: 10 })
        pixiObject.filters = [blurFilter]

        return pixiObject
    }
}
