import characterSpritesheetImage from '@core/assets/sprites/character/spritesheet.png'
import characterSpritesheetData from '@core/assets/sprites/character/spritesheet.json'

import { FederatedPointerEvent, Spritesheet, Text, Ticker } from 'pixi.js'
import { Game } from '@core/lib/game'
import { type EntityTypeName, BaseGameEntity } from '@core/lib/entities'
import { KeyBindings, KeyCode } from '@core/lib/utils/key-bindings'
import { type Position } from '@core/lib/utils/position'
import { Bullet } from '@core/lib/entities/bullet'
import {
    type CharacterSynchronizer,
    createCharacterSynchronizer,
} from '@core/lib/multi-player-sync/character'
import { CollisionError, NotInitializedError } from '@core/lib/utils/errors'
import {
    createSpriteSynchronizer,
    type SpriteSynchronizer,
} from '@core/lib/multi-player-sync/sprites'
import { CharacterControls } from '@core/lib/hud/character-controls'
import {
    AnimatedSpriteWithMetadata,
    loadSpritesheet,
} from '@core/lib/utils/sprites'

export const CHARACTER_SIZE = { width: 115, height: 124 }
const CURRENT_CHARACTER_LABEL_Y_OFFSET = -18

type CharacterSpritesheet = Spritesheet<typeof characterSpritesheetData>

export interface CharacterMovement {
    isMovingLeft: boolean
    isMovingRight: boolean
    horizontalVelocity: number

    isJumping: boolean
    isGrounded: boolean
    verticalVelocity: number
}

const GRAVITY_FORCE = 0.9
const JUMP_FORCE = 20

const INITIAL_HORIZONTAL_VELOCITY = 10
const INITIAL_VERTICAL_VELOCITY = 0

export class Character extends BaseGameEntity<
    AnimatedSpriteWithMetadata<CharacterSpritesheet>
> {
    typeName: EntityTypeName = 'character'
    options = { enableCollision: true, enableGravity: true }

    keyBindings?: KeyBindings

    private controls?: CharacterControls

    private abortController?: AbortController
    private characterSynchronizer: CharacterSynchronizer | null = null
    private spriteSynchronizer: SpriteSynchronizer<CharacterSpritesheet> | null =
        null

    private health = 100

    private movementStatus: CharacterMovement = {
        isMovingLeft: false,
        isMovingRight: false,
        horizontalVelocity: INITIAL_HORIZONTAL_VELOCITY,

        isJumping: false,
        isGrounded: false,
        verticalVelocity: INITIAL_VERTICAL_VELOCITY,
    }

    private direction: 'left' | 'right' = 'right'

    constructor(
        game: Game,
        initialPosition: Position,
        id?: string,
        isRemote = false,
    ) {
        super(game, initialPosition, id, isRemote)

        if (!this.isRemote) {
            this.keyBindings = new KeyBindings([
                {
                    key: KeyCode.D,
                    doOnKeyDown: () => this.startMoveRight(),
                    doOnKeyUp: () => this.stopMovingRight(),
                },

                {
                    key: KeyCode.A,
                    doOnKeyDown: () => this.startMoveLeft(),
                    doOnKeyUp: () => this.stopMovingLeft(),
                },

                {
                    key: KeyCode.Space,
                    doOnKeyDown: () => this.jump(),
                },
            ])

            this.controls = new CharacterControls(this.game, {
                doOnRightButtonPressStart: () => this.startMoveRight(),
                doOnRightButtonPressEnd: () => this.stopMovingRight(),
                doOnLeftButtonPressStart: () => this.startMoveLeft(),
                doOnLeftButtonPressEnd: () => this.stopMovingLeft(),
                doOnJumpButtonClick: () => this.jump(),
            })
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

            this.game.end({
                // If character is remote entity that died, then the opponent lost
                // and the current player won
                status: this.isRemote ? 'won' : 'lost',
            })
        }
    }

    async load() {
        this.abortController = new AbortController()

        const spritesheet = await loadSpritesheet(
            characterSpritesheetImage,
            characterSpritesheetData,
            CHARACTER_SIZE,
        )

        const pixiObject = new AnimatedSpriteWithMetadata(
            spritesheet,
            CHARACTER_SIZE,
            {
                name: 'still-right',
                loop: true,
            },
            0.2,
        )

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
            this.keyBindings?.initializeEventListeners()
        }

        if (this.game.multiPlayerSession) {
            this.spriteSynchronizer = createSpriteSynchronizer(
                this,
                this.game.multiPlayerSession,
            )

            this.characterSynchronizer = createCharacterSynchronizer(
                this,
                this.game.multiPlayerSession,
            )
        }

        this.game.multiPlayerSession?.addEventListener(
            'player-disconnect',
            () => {
                this.die()
            },
            this.abortController.signal,
        )

        this.controls?.mount()

        return pixiObject
    }

    update(ticker: Ticker) {
        const pixiObject = super.update(ticker)

        if (!this.isRemote) {
            if (this.options.enableGravity) {
                this.applyGravity(ticker)
            }

            this.moveHorizontallyIfNeeded(ticker)
        }

        return pixiObject
    }

    private applyGravity(ticker: Ticker) {
        const pixiObject = this.getPixiObjectOrThrow()

        if (this.movementStatus.isGrounded) {
            this.movementStatus.verticalVelocity =
                GRAVITY_FORCE * ticker.deltaTime

            if (this.movementStatus.isJumping) {
                this.game.soundManager.play('jump')

                this.movementStatus.isGrounded = false
                this.movementStatus.verticalVelocity = -JUMP_FORCE
                this.movementStatus.isJumping = false
            }
        } else {
            this.movementStatus.verticalVelocity +=
                GRAVITY_FORCE * ticker.deltaTime
        }

        const deltaYToMoveBy =
            this.movementStatus.verticalVelocity * ticker.deltaTime

        try {
            this.moveBy({ y: deltaYToMoveBy })
            this.movementStatus.isGrounded = false
        } catch (error) {
            if (error instanceof CollisionError) {
                if (!this.movementStatus.isGrounded) {
                    this.game.soundManager.play('land')
                    this.movementStatus.isGrounded = true
                }
            } else {
                throw error
            }
        }

        this.syncStateWithMultiPlayer(pixiObject)
    }

    private moveHorizontallyIfNeeded(ticker: Ticker) {
        const pixiObject = this.getPixiObjectOrThrow()

        if (this.movementStatus.isMovingLeft) {
            try {
                this.updatePositionRespectingCollisions({
                    x:
                        pixiObject.x -
                        this.movementStatus.horizontalVelocity *
                            ticker.deltaTime,
                })
            } catch (error) {
                if (!(error instanceof CollisionError)) {
                    throw error
                }
            }
        }

        if (this.movementStatus.isMovingRight) {
            try {
                this.updatePositionRespectingCollisions({
                    x:
                        pixiObject.x +
                        this.movementStatus.horizontalVelocity *
                            ticker.deltaTime,
                })
            } catch (error) {
                if (!(error instanceof CollisionError)) {
                    throw error
                }
            }
        }

        this.syncStateWithMultiPlayer(pixiObject)
    }

    async cleanup() {
        super.cleanup()

        this.keyBindings?.disposeEventListeners()
        this.controls?.destroy()

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
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Character object was not initilized. Cannot access spritesheet and Pixi object',
            )
        }

        if (!this.movementStatus.isMovingLeft) {
            this.pixiObject.playAnimation(
                { loop: true, name: 'still-right' },
                { synchronizerToEnable: this.spriteSynchronizer },
            )
        }

        this.movementStatus.isMovingRight = false
    }

    private stopMovingLeft() {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Character object was not initilized. Cannot access spritesheet and Pixi object',
            )
        }

        if (!this.movementStatus.isMovingRight) {
            this.pixiObject.playAnimation(
                { name: 'still-left', loop: true },
                { synchronizerToEnable: this.spriteSynchronizer },
            )
        }

        this.movementStatus.isMovingLeft = false
    }

    private startMoveRight() {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Character object was not initilized. Cannot access spritesheet and Pixi object',
            )
        }

        this.pixiObject.playAnimation(
            { name: 'run-right', loop: true },
            { synchronizerToEnable: this.spriteSynchronizer },
        )

        this.movementStatus.isMovingRight = true
        this.direction = 'right'
    }

    private startMoveLeft() {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Character object was not initilized. Cannot access spritesheet and Pixi object',
            )
        }

        this.pixiObject.playAnimation(
            { name: 'run-left', loop: true },
            { synchronizerToEnable: this.spriteSynchronizer },
        )

        this.movementStatus.isMovingLeft = true
        this.direction = 'left'
    }

    private jump() {
        if (!this.pixiObject) {
            throw new NotInitializedError(
                'Character object was not initilized. Cannot access spritesheet and Pixi object',
            )
        }

        this.pixiObject.playAnimation(
            {
                name: this.direction === 'left' ? 'jump-left' : 'jump-right',
                loop: false,
            },
            {
                synchronizerToEnable: this.spriteSynchronizer,
                playPreviousAnimationOnCompletion: true,
            },
        )

        this.movementStatus.isJumping = true
    }
}
