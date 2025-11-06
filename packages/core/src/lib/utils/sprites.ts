import {
    AnimatedSprite,
    Assets,
    Spritesheet,
    Texture,
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

export async function createAnimatedSprite(
    initialAnimation: Texture[],
    objectSize: Size,
    options: Partial<{ animationSpeed: number; loop: boolean }> = {},
) {
    const { animationSpeed = 1, loop = true } = options

    const pixiObject = new AnimatedSprite(initialAnimation)
    pixiObject.scale.set(1)
    pixiObject.animationSpeed = animationSpeed
    pixiObject.loop = loop
    pixiObject.setSize(objectSize)
    pixiObject.play()

    return pixiObject
}

/**
 * Starts to play a provided animation by swapping it
 */
export function playAnimation<TAnimations extends Record<string, Texture[]>>(
    pixiObject: AnimatedSprite,
    animations: TAnimations,
    animationName: keyof TAnimations,
    options: Partial<{
        synchronizerToEnable: SpriteSynchronizer | null
        loop: boolean
        playPreviousAnimationOnCompletion: boolean
    }> = {},
) {
    const {
        synchronizerToEnable,
        loop = true,
        playPreviousAnimationOnCompletion = true,
    } = options

    const previousAnimation = pixiObject.textures
    const wasPreviousAnimationLooped = pixiObject.loop

    pixiObject.textures = animations[animationName]
    pixiObject.loop = loop
    pixiObject.scale.set(1)
    pixiObject.play()

    if (playPreviousAnimationOnCompletion) {
        pixiObject.onComplete = () => {
            pixiObject.textures = previousAnimation
            pixiObject.loop = wasPreviousAnimationLooped
            pixiObject.play()
        }
    }

    if (synchronizerToEnable) {
        synchronizerToEnable.syncSpriteUpdate(animationName as string)
    }
}
