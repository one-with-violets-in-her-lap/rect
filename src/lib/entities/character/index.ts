import characterSpriteImage from '@/assets/images/character-1.png'

import { Assets, Sprite } from 'pixi.js'
import { Game } from '@/lib/game'
import { GameEntity } from '@/lib/entities'
import { CurrentControlledCharacter } from '@/lib/entities/character/controlled-character'
import { NotInitializedError } from '@/lib/utils/errors'

/**
 * Base character entity class that implements moving and other interactions.
 *
 * Important to note that it doesn;t perform any interactions on its own, it just
 * provides ways to interact. Actual living characters is built as subclasses of
 * `BaseCharacter` - {@link CurrentControlledCharacter} and {@link RemoteCharacter}
 */
export class BaseCharacter extends GameEntity<Sprite> {
    constructor(
        game: Game,
        private readonly initialPosition: 'left' | 'right',
    ) {
        super(game, {
            enableCollision: true,
            enableGravity: true,
        })
    }

    async load() {
        await Assets.load(characterSpriteImage)

        const pixiObject = Sprite.from(characterSpriteImage)

        pixiObject.x =
            this.initialPosition === 'left'
                ? 0
                : this.game.pixiApp.canvas.width - pixiObject.width

        return pixiObject
    }

    async destroy() {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Character sprite pixi object was not ' +
                    'initialized, so it cannot be destroyed',
            )
        }

        this.pixiObject.destroy()
    }
}
