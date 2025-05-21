import characterSpriteImage from '@core/assets/images/character-1.png'

import { Assets, FederatedPointerEvent, Sprite, Text } from 'pixi.js'
import { Game } from '@core/lib/game'
import { type EntityTypeName, GameEntity } from '@core/lib/entities'
import { KeyBindings } from '@core/lib/utils/key-bindings'
import { type Position } from '@core/lib/utils/position'
import { Bullet } from '@core/lib/entities/bullet'
import {
    type CharacterSynchronizer,
    createCharacterSynchronizer,
} from '@core/lib/multi-player-sync/character'

const CURRENT_CHARACTER_LABEL_Y_OFFSET = -18

export class Character extends GameEntity {
    typeName: EntityTypeName = 'character'
    options = { enableCollision: true, enableGravity: true }

    keyBindings: KeyBindings

    private abortController?: AbortController
    private characterSynchronizer: CharacterSynchronizer | null = null

    private health = 100

    constructor(
        game: Game,
        initialPosition: Position,
        id?: string,
        isRemote = false,
    ) {
        super(game, initialPosition, id, isRemote)

        this.keyBindings = new KeyBindings([
            {
                key: 'd',
                doOnKeyDown: () => (this.movementStatus.isMovingRight = true),
                doOnKeyUp: () => (this.movementStatus.isMovingRight = false),
            },

            {
                key: 'a',
                doOnKeyDown: () => (this.movementStatus.isMovingLeft = true),
                doOnKeyUp: () => (this.movementStatus.isMovingLeft = false),
            },

            {
                key: ' ',
                doOnKeyDown: () => (this.movementStatus.isJumping = true),
            },
        ])

        if (this.game.multiPlayerSession) {
            this.characterSynchronizer = createCharacterSynchronizer(
                this,
                this.game.multiPlayerSession,
            )
        }
    }

    damageAndSync(damagePoints: number) {
        this.damage(damagePoints)

        this.characterSynchronizer?.syncCharacterUpdate({
            damage: damagePoints,
        })
    }

    damage(damagePoints: number) {
        this.health = Math.max(this.health - damagePoints, 0)

        if (this.health === 0) {
            this.game.destroyEntity(this, false)

            // If character is remote entity that died, then the opponent lost
            // and the current player won
            this.game.endWithAnimation(this.isRemote)
        }
    }

    async load() {
        this.abortController = new AbortController()

        await Assets.load(characterSpriteImage)

        const pixiObject = Sprite.from(characterSpriteImage)

        if (!this.isRemote) {
            const currentCharacterLabel = new Text({
                text: 'You',
                style: {
                    fill: '#00000050',
                    fontSize: '18px',
                    fontWeight: '800',
                },
                x: pixiObject.width / 2,
                y: CURRENT_CHARACTER_LABEL_Y_OFFSET,
            })
            currentCharacterLabel.anchor = 0.5
            pixiObject.addChild(currentCharacterLabel)

            this.game.pixiApp.stage.addEventListener(
                'pointerdown',
                (event) => this.shoot(event),
                {
                    signal: this.abortController.signal,
                },
            )
            this.keyBindings.initializeEventListeners()
        }

        return pixiObject
    }

    async cleanup() {
        super.cleanup()

        this.keyBindings.disposeEventListeners()

        this.abortController?.abort()
    }

    private async shoot(pointerEvent: FederatedPointerEvent) {
        const pixiObject = this.getPixiObjectOrThrow()

        const distanceX = pointerEvent.globalX - pixiObject.x
        const distanceY = pointerEvent.globalY - pixiObject.y
        const aimAngleRadians = Math.atan2(distanceY, distanceX)

        const bulletOffset = pixiObject.width

        const xMultiplier = Math.cos(aimAngleRadians)
        const yMultiplier = Math.sin(aimAngleRadians)

        const bulletX =
            pixiObject.x +
            xMultiplier * (xMultiplier >= 0 ? bulletOffset : bulletOffset / 2)
        const bulletY =
            pixiObject.y +
            yMultiplier * (yMultiplier >= 0 ? bulletOffset : bulletOffset / 2)

        const bullet = new Bullet(this.game, {
            x: bulletX,
            y: bulletY,
        })
        bullet.radiansAngle = aimAngleRadians
        await bullet.initialize()

        this.game.addEntityAndSyncMultiPlayer(bullet)
    }
}
