import {
    AnimatedSprite,
    Assets,
    Spritesheet,
    Texture,
    type Size,
    type SpritesheetData,
} from 'pixi.js'

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
export function playAnimation(
    pixiObject: AnimatedSprite,
    animation: Texture[],
) {
    pixiObject.textures = animation
    pixiObject.play()
    pixiObject.scale.set(1)
}
