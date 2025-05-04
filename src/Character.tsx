import characterImage from '@/assets/images/character-1.png'

import { Assets, Sprite, Texture } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import { useTick } from '@pixi/react'

interface JumpState {
    status: 'jumping' | 'landing' | 'inactive'
    initialYPosition: number | null
}

const MOVING_AMOUNT_VALUES = {
    moveByPerTick: 4,
    jumpAmountPerTick: 10,
    maxJumpHeight: 300,
    landingAmountPerTick: 15,
}

const SPRITE_SIZE = {
    width: 112,
    height: 116,
}

export function Character() {
    const sprite = useRef<Sprite>(null)

    const [texture, setTexture] = useState(Texture.EMPTY)

    const [position, setPosition] = useState({ x: 0, y: 0 })

    const horizontalMovement = useRef<{
        movingLeft: boolean
        movingRight: boolean
    }>({ movingLeft: false, movingRight: false })

    const jumpState = useRef<JumpState>({
        status: 'inactive',
        initialYPosition: null,
    })

    function handleGlobalKeyDown(event: KeyboardEvent) {
        if (event.repeat) {
            return
        }

        if (event.key === 'd') {
            horizontalMovement.current.movingRight = true
        }

        if (event.key === 'a') {
            horizontalMovement.current.movingLeft = true
        }

        if (event.key === ' ' && jumpState.current.status !== 'landing') {
            jumpState.current.status = 'jumping'
        }
    }

    function handleGlobalKeyUp(event: KeyboardEvent) {
        if (event.key === 'd') {
            horizontalMovement.current.movingRight = false
        }

        if (event.key === 'a') {
            horizontalMovement.current.movingLeft = false
        }
    }

    useTick(() => {
        if (horizontalMovement.current.movingLeft) {
            setPosition((currentPosition) => ({
                x: currentPosition.x - MOVING_AMOUNT_VALUES.moveByPerTick,
                y: currentPosition.y,
            }))
        }

        if (horizontalMovement.current.movingRight) {
            setPosition((currentPosition) => ({
                x: currentPosition.x + MOVING_AMOUNT_VALUES.moveByPerTick,
                y: currentPosition.y,
            }))
        }

        if (!jumpState.current.initialYPosition) {
            throw new Error('Initial Y position for jump is `null`')
        }

        if (jumpState.current.status === 'jumping') {
            const maxDistanceFromGround =
                jumpState.current.initialYPosition -
                MOVING_AMOUNT_VALUES.maxJumpHeight

            const currentDistanceFromGround =
                jumpState.current.initialYPosition - position.y

            const jumpSlowingDivisor = Math.max(
                currentDistanceFromGround / MOVING_AMOUNT_VALUES.maxJumpHeight,
                0.4,
            )

            const nextJumpMoveAmount =
                MOVING_AMOUNT_VALUES.jumpAmountPerTick / jumpSlowingDivisor

            const newY = Math.max(
                position.y - nextJumpMoveAmount,
                maxDistanceFromGround,
            )

            setPosition((currentPosition) => ({
                ...currentPosition,
                y: newY,
            }))

            if (newY === maxDistanceFromGround) {
                jumpState.current.status = 'landing'
            }
        } else if (jumpState.current.status === 'landing') {
            const newY = Math.min(
                position.y + MOVING_AMOUNT_VALUES.landingAmountPerTick,
                jumpState.current.initialYPosition,
            )

            setPosition((currentPosition) => ({
                ...currentPosition,
                y: newY,
            }))

            if (newY === jumpState.current.initialYPosition) {
                jumpState.current.status = 'inactive'
            }
        }
    })

    useEffect(() => {
        let alreadyUnmounted = false

        Assets.load(characterImage).then((loadedTexture) => {
            if (!alreadyUnmounted) {
                setTexture(loadedTexture)
            }
        })

        const groundY = window.innerHeight - SPRITE_SIZE.height
        setPosition({ y: groundY, x: 0 })
        jumpState.current.initialYPosition = groundY

        const abortController = new AbortController()
        document.addEventListener('keypress', handleGlobalKeyDown, {
            signal: abortController.signal,
        })
        document.addEventListener(
            'keyup',
            (event) => handleGlobalKeyUp(event),
            { signal: abortController.signal },
        )

        return () => {
            alreadyUnmounted = true
            abortController.abort()
        }
    }, [])

    return (
        <pixiSprite
            ref={sprite}
            texture={texture}
            height={SPRITE_SIZE.height}
            width={SPRITE_SIZE.width}
            x={position.x}
            y={position.y}
            eventMode="static"
        ></pixiSprite>
    )
}
