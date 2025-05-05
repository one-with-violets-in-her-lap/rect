import obstacleSpriteImage from '@/assets/images/obstacle.png'

import { Assets, Sprite } from 'pixi.js'
import { NotInitializedError } from '@/utils/errors'

export class Obstacle {
    sprite?: Sprite

    constructor(private readonly canvas: HTMLCanvasElement) {}

    async initializeSprite() {
        await Assets.load(obstacleSpriteImage)
        this.sprite = Sprite.from(obstacleSpriteImage)
        this.sprite.setSize(500, 100)

        this.sprite.y = this.canvas.height - this.sprite.height - 100 // TODO: make `400` a constant

        return this.sprite
    }

    async dispose() {
        if (!this.sprite) {
            throw new NotInitializedError(
                'Character sprite pixi object was not ' +
                    'initialized, so it cannot be destroyed',
            )
        }

        this.sprite.destroy()
    }
}
