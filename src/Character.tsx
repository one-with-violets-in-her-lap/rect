import characterImage from '@/assets/images/character-1.png'

import { Assets, Sprite, Texture } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import { useTick } from '@pixi/react'

type JumpState =
    | {
          status: 'jumping' | 'landing'
          initialYPosition: number
      }
    | {
          status: 'inactive'
          initialYPosition: null
      }

const MOVING_AMOUNT_VALUES = {
    moveByPerTick: 4,
    jumpAmountPerTick: 12,
    maxJumpHeight: 20,
    landingAmountPerTick: 10,
}

const SPRITE_SIZE = {
    width: 112,
    height: 116,
}

export function Character() {
    const sprite = useRef<Sprite>(null)

    const [texture, setTexture] = useState(Texture.EMPTY)

    const [position, setPosition] = useState({ x: 0, y: 0 })

    const [horizontalMovement, setHorizontalMovement] = useState<{
        movingLeft: boolean
        movingRight: boolean
    }>({ movingLeft: false, movingRight: false })

    const [jumpState, setJumpState] = useState<JumpState>({
        status: 'inactive',
        initialYPosition: null,
    })

    function handleGlobalKeyDown(event: KeyboardEvent) {
        if (event.repeat) {
            return
        }

        if (event.key === 'd') {
            setHorizontalMovement((currentMovement) => ({
                ...currentMovement,
                movingRight: true,
            }))
        }

        if (event.key === 'a') {
            setHorizontalMovement((currentMovement) => ({
                ...currentMovement,
                movingLeft: true,
            }))
        }

        if (event.key === ' ' && jumpState.status !== 'landing') {
            setJumpState({
                initialYPosition: position.y,
                status: 'jumping',
            })
        }
    }

    function handleGlobalKeyUp(event: KeyboardEvent) {
        if (event.key === 'd') {
            setHorizontalMovement((currentMovement) => ({
                ...currentMovement,
                movingRight: false,
            }))
        }

        if (event.key === 'a') {
            setHorizontalMovement((currentMovement) => ({
                ...currentMovement,
                movingLeft: false,
            }))
        }
    }

    useTick(() => {
        if (horizontalMovement.movingLeft) {
            setPosition((currentPosition) => ({
                x: currentPosition.x - MOVING_AMOUNT_VALUES.moveByPerTick,
                y: currentPosition.y,
            }))
        }

        if (horizontalMovement.movingRight) {
            setPosition((currentPosition) => ({
                x: currentPosition.x + MOVING_AMOUNT_VALUES.moveByPerTick,
                y: currentPosition.y,
            }))
        }
    })

    useEffect(() => {
        let alreadyUnmounted = false

        Assets.load(characterImage).then((loadedTexture) => {
            if (!alreadyUnmounted) {
                setTexture(loadedTexture)
            }
        })

        setPosition({ y: window.innerHeight - SPRITE_SIZE.height, x: 0 })

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
