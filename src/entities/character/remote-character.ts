import { BaseCharacter } from '@/entities/character'

export class RemoteCharacter extends BaseCharacter {
    async load() {
        const pixiObject = await super.load()

        pixiObject.x = this.game.pixiApp.canvas.width - pixiObject.width

        this.movement.isMovingLeft = true
        this.isJumping = true

        return pixiObject
    }
}
