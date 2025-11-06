import {
    AnimatedSprite,
    Assets,
    Spritesheet,
    type Size,
    type SpritesheetData,
} from 'pixi.js'
import type { SpriteSynchronizer } from '@core/lib/multi-player-sync/sprites'

/**
 * Loads the spritesheet, normalizes the textures' sizes and sets up some parameters
 */
export async function loadSpritesheet<TSpritesheetData extends SpritesheetData>(
    spritesheetImageUrl: string,
    spritesheetData: TSpritesheetData,
    objectSize: Size,
): Promise<Spritesheet<TSpritesheetData>> {
    const spritesheetTexture = await Assets.load(spritesheetImageUrl)

    const spritesheet = new Spritesheet(spritesheetTexture, spritesheetData)
    await spritesheet.parse()

    for (const texture of Object.values(spritesheet.textures)) {
        texture.orig.width = objectSize.width
        texture.orig.height = objectSize.height
    }

    return spritesheet
}

export interface SpriteAnimation<TSpritesheet extends Spritesheet> {
    name: keyof TSpritesheet['animations']
    loop: boolean
}

export class AnimatedSpriteWithMetadata<
    TSpritesheet extends Spritesheet,
> extends AnimatedSprite {
    currentAnimation: SpriteAnimation<TSpritesheet>

    constructor(
        private readonly spritesheet: TSpritesheet,
        size: Size,
        initialAnimation: SpriteAnimation<TSpritesheet>,
        animationSpeed: number = 1,
    ) {
        super(spritesheet.animations[initialAnimation.name as string])
        this.currentAnimation = initialAnimation
        this.animationSpeed = animationSpeed
        this.setSize(size)
    }

    /**
     * Starts to play a provided animation, swapping the current one
     */
    playAnimation(
        animation: SpriteAnimation<TSpritesheet>,
        options: Partial<{
            synchronizerToEnable: SpriteSynchronizer<TSpritesheet> | null
            playPreviousAnimationOnCompletion: boolean
        }> = {},
    ) {
        const {
            synchronizerToEnable,
            playPreviousAnimationOnCompletion = true,
        } = options

        const previousAnimation = this.currentAnimation
        this.currentAnimation = animation

        this.textures = this.spritesheet.animations[animation.name as string]
        this.loop = animation.loop
        this.scale.set(1)
        this.play()

        if (playPreviousAnimationOnCompletion) {
            this.onComplete = () =>
                this.playAnimation(previousAnimation, {
                    synchronizerToEnable,
                    playPreviousAnimationOnCompletion: false,
                })
        }

        if (synchronizerToEnable) {
            synchronizerToEnable.syncSpriteUpdate(animation)
        }
    }
}
