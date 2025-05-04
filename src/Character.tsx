import characterImage from '@/assets/images/character-1.png'

import { Assets, FederatedEvent, Sprite, Texture } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'

export function Character() {
    const sprite = useRef<Sprite>(null)

    const isDragging = useRef(false)

    const [texture, setTexture] = useState(Texture.EMPTY)
    const [position, setPosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        let alreadyUnmounted = false

        Assets.load(characterImage).then((loadedTexture) => {
            if (!alreadyUnmounted) {
                setTexture(loadedTexture)
            }
        })

        return () => {
            alreadyUnmounted = true
        }
    }, [])

    function handleDragStart() {
        isDragging.current = true
    }

    function handleDragEnd() {
        isDragging.current = false
    }

    function handleDrag(event: FederatedEvent) {
        if (!sprite.current) {
            throw new Error(
                '`sprite` ref is `null`. It must be bound to pixi sprite component to work',
            )
        }

        if (isDragging.current && sprite.current) {
            setPosition({
                x: event.pageX - sprite.current.width / 2,
                y: event.pageY - sprite.current.height / 2,
            })
        }
    }

    return (
        <pixiSprite
            ref={sprite}
            texture={texture}
            x={position.x}
            y={position.y}
            eventMode="static"
            onPointerDown={handleDragStart}
            onPointerUp={handleDragEnd}
            onGlobalPointerMove={handleDrag}
        ></pixiSprite>
    )
}
