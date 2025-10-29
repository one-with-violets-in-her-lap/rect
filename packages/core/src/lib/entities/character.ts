import characterSpritesheetImage from '@core/assets/sprites/character/spritesheet.png'
import characterSpritesheetData from '@core/assets/sprites/character/spritesheet.json'

import {
    AnimatedSprite,
    FederatedPointerEvent,
    Spritesheet,
    Text,
} from 'pixi.js'
import { Game } from '@core/lib/game'
import { type EntityTypeName, GameEntity } from '@core/lib/entities'
import { KeyBindings } from '@core/lib/utils/key-bindings'
import { type Position } from '@core/lib/utils/position'
import { Bullet } from '@core/lib/entities/bullet'
import {
    type CharacterSynchronizer,
    createCharacterSynchronizer,
} from '@core/lib/multi-player-sync/character'
import { NotInitializedError } from '../utils/errors'
import {
    createAnimatedSprite,
    loadSpritesheet,
    playAnimation,
} from '../utils/sprites'

export const CHARACTER_SIZE = { width: 115, height: 124 }
const CURRENT_CHARACTER_LABEL_Y_OFFSET = -18

export class Character extends GameEntity<AnimatedSprite> {
    typeName: EntityTypeName = 'character'
    options = { enableCollision: true, enableGravity: true }

    keyBindings: KeyBindings

    private abortController?: AbortController
    private characterSynchronizer: CharacterSynchronizer | null = null

    private health = 100

    private spritesheet?: Spritesheet<typeof characterSpritesheetData>

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
                doOnKeyDown: () => this.startMoveRight(),
                doOnKeyUp: () => this.stopMovingRight(),
            },

            {
                key: 'a',
                doOnKeyDown: () => this.startMoveLeft(),
                doOnKeyUp: () => this.stopMovingLeft(),
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
            this.die()

            this.game.endWithAnimation({
                // If character is remote entity that died, then the opponent lost
                // and the current player won
                status: this.isRemote ? 'won' : 'lost',
            })
        }
    }

    async load() {
        this.abortController = new AbortController()

        this.spritesheet = await loadSpritesheet(
            characterSpritesheetImage,
            characterSpritesheetData,
            CHARACTER_SIZE,
        )

        const pixiObject = await createAnimatedSprite(this.spritesheet.animations.still, CHARACTER_SIZE, {
            animationSpeed: 0.2,
            loop: true,
        })

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

        this.game.multiPlayerSession?.addEventListener(
            'player-disconnect',
            () => {
                this.die()
            },
            this.abortController.signal,
        )

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

        this.game.soundManager.play('shot')

        const bullet = new Bullet(this.game, {
            x: bulletX,
            y: bulletY,
        })
        bullet.radiansAngle = aimAngleRadians
        await bullet.initialize()

        this.game.addEntityAndSyncMultiPlayer(bullet)
    }

    private die() {
        this.game.destroyEntity(this, false)
        this.game.soundManager.play('kill')
    }

    private stopMovingRight() {
        console.log('stop right')

        if (!this.pixiObject || !this.spritesheet) {
            throw new NotInitializedError(
                'Character object was not initilized. Cannot access spritesheet and Pixi object',
            )
        }

        if (!this.movementStatus.isMovingLeft) {
            playAnimation(
                this.pixiObject,
                this.spritesheet.animations['still'],
            )
        }

        this.movementStatus.isMovingRight = false
    }

    private stopMovingLeft() {
        console.log('stop left')

        if (!this.pixiObject || !this.spritesheet) {
            throw new NotInitializedError(
                'Character object was not initilized. Cannot access spritesheet and Pixi object',
            )
        }

        if (!this.movementStatus.isMovingRight) {
            playAnimation(
                this.pixiObject,
                this.spritesheet.animations['still'],
            )
        }

        this.movementStatus.isMovingLeft = false
    }

    private startMoveRight() {
        console.log('start right')

        if (!this.pixiObject || !this.spritesheet) {
            throw new NotInitializedError(
                'Character object was not initilized. Cannot access spritesheet and Pixi object',
            )
        }

        playAnimation(
            this.pixiObject,
            this.spritesheet.animations['run-right'],
        )

        this.movementStatus.isMovingRight = true
    }

    private startMoveLeft() {
        console.log('start left')

        if (!this.pixiObject || !this.spritesheet) {
            throw new NotInitializedError(
                'Character object was not initilized. Cannot access spritesheet and Pixi object',
            )
        }

        playAnimation(
            this.pixiObject,
            this.spritesheet.animations['run-left'],
        )

        this.movementStatus.isMovingLeft = true
    }
}
