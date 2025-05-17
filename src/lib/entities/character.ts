import characterSpriteImage from '@/assets/images/character-1.png'

import { Assets, FederatedPointerEvent, Sprite, Text } from 'pixi.js'
import { Game } from '@/lib/game'
import { EntityTypeName, GameEntity } from '@/lib/entities'
import { KeyBindings } from '@/lib/utils/key-bindings'
import { Position } from '@/lib/utils/position'
import { Bullet } from '@/lib/entities/bullet'

const CURRENT_CHARACTER_LABEL_Y_OFFSET = -18

export class Character extends GameEntity {
    typeName: EntityTypeName = 'character'
    options = { enableCollision: true, enableGravity: true }

    keyBindings: KeyBindings

    private abortController?: AbortController

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

        const muzzleOffset = pixiObject.width

        const xMoveAmount = Math.cos(aimAngleRadians)
        const yMoveAmount = Math.sin(aimAngleRadians)

        const bulletX =
            pixiObject.x + xMoveAmount * (xMoveAmount >= 0 ? muzzleOffset : 1)
        const bulletY =
            pixiObject.y + yMoveAmount * (yMoveAmount >= 0 ? muzzleOffset : 1)

        const bullet = new Bullet(this.game, {
            x: bulletX,
            y: bulletY,
        })
        bullet.radiansAngle = aimAngleRadians
        await bullet.initialize()

        this.game.addEntityAndSyncMultiPlayer(bullet)
    }
}
