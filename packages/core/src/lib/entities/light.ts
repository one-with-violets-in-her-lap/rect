import { Bounds, Graphics, Ticker } from 'pixi.js'
import type {
    BaseCreateEntityPacket,
    GameEntitySerializer,
} from '@core/lib/multi-player-sync/game'
import { BaseGameEntity, type EntityTypeName } from '@core/lib/entities'
import type { Game } from '@core/lib/game'
import type { Position } from '@core/lib/utils/position'

function getSegments(bounds: Bounds) {
    return [
        [
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y },
        ],
        [
            { x: bounds.x + bounds.width, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        ],
        [
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
            { x: bounds.x, y: bounds.y + bounds.height },
        ],
        [
            { x: bounds.x, y: bounds.y + bounds.height },
            { x: bounds.x, y: bounds.y },
        ],
    ]
}

export class PointLight extends BaseGameEntity<Graphics> {
    options = { enableCollision: false }

    typeName: EntityTypeName = 'point-light'

    constructor(
        game: Game,
        initialPosition: Position,
        id?: string,
        isRemote = false,
        readonly radius = 200,
    ) {
        super(game, initialPosition, id, isRemote)
    }

    async load() {
        const pixiObject = new Graphics()

        return pixiObject
    }

    update(ticker: Ticker) {
        const pixiObject = super.update(ticker)

        pixiObject.clear()

        let segments: Position[][] = []

        for (const entity of this.game.entities) {
            try {
                const entitySegments = getSegments(entity.getBoundingBox())
                segments.push(...entitySegments)
            } catch (error) {}
        }

        const visibilityPoints = this.calculateVisibilityPolygon(
            pixiObject,
            segments,
        )

        pixiObject.beginPath()

        for (
            let pointIndex = 0;
            pointIndex < visibilityPoints.length - 1;
            pointIndex++
        ) {
            const point = visibilityPoints[pointIndex]
            const nextPoint = visibilityPoints[pointIndex + 1]

            pixiObject.moveTo(0, 0)
            pixiObject.lineTo(point.x - pixiObject.x, point.y - pixiObject.y)
            pixiObject.lineTo(
                nextPoint.x - pixiObject.x,
                nextPoint.y - pixiObject.y,
            )
        }

        pixiObject.fill('white')

        return pixiObject
    }

    private calculateVisibilityPolygon(
        pixiObject: Graphics,
        segments: Position[][],
    ) {
        let rays: { x: number; y: number; angle: number }[] = []

        for (const edge of segments) {
            for (let index = 0; index < 2; index++) {
                const baseRayDistanceX =
                    (index === 0 ? edge[0].x : edge[1].x) - pixiObject.x
                const baseRayDistanceY =
                    (index === 0 ? edge[0].y : edge[1].y) - pixiObject.y

                const baseAngle = Math.atan2(baseRayDistanceY, baseRayDistanceX)

                let currentAngle = 0

                for (let rayIndex = 0; rayIndex < 3; rayIndex++) {
                    let minDistanceFromSource = Infinity
                    let minIntersectionPointX = 0
                    let minIntersectionPointY = 0
                    let minIntersectionAngle = 0
                    let isValid = false

                    if (rayIndex === 0) {
                        currentAngle = baseAngle - 0.0001
                    }

                    if (rayIndex === 1) {
                        currentAngle = baseAngle
                    }

                    if (rayIndex === 2) {
                        currentAngle = baseAngle + 0.0001
                    }

                    const distanceX = Math.cos(currentAngle) * this.radius
                    const distanceY = Math.sin(currentAngle) * this.radius

                    for (const otherEdge of segments) {
                        const edgeSizeX = otherEdge[1].x - otherEdge[0].x
                        const edgeSizeY = otherEdge[1].y - otherEdge[0].y

                        if (
                            Math.abs(edgeSizeX - distanceX) > 0 &&
                            Math.abs(edgeSizeY - distanceY) > 0
                        ) {
                            const normalizedDistanceFromSegment =
                                (distanceX * (otherEdge[0].y - pixiObject.y) +
                                    distanceY *
                                        (pixiObject.x - otherEdge[0].x)) /
                                (edgeSizeX * distanceY - edgeSizeY * distanceX)

                            const normalizedDistanceFromSource =
                                (otherEdge[0].x +
                                    edgeSizeX * normalizedDistanceFromSegment -
                                    pixiObject.x) /
                                distanceX

                            if (
                                normalizedDistanceFromSource > 0 &&
                                normalizedDistanceFromSegment >= 0 &&
                                normalizedDistanceFromSegment <= 1
                            ) {
                                if (
                                    normalizedDistanceFromSource <
                                    minDistanceFromSource
                                ) {
                                    minDistanceFromSource =
                                        normalizedDistanceFromSource

                                    minIntersectionPointX =
                                        pixiObject.x +
                                        distanceX * normalizedDistanceFromSource
                                    minIntersectionPointY =
                                        pixiObject.y +
                                        distanceY * normalizedDistanceFromSource

                                    minIntersectionAngle = Math.atan2(
                                        minIntersectionPointY - pixiObject.y,
                                        minIntersectionPointX - pixiObject.x,
                                    )

                                    isValid = true
                                }
                            }
                        }
                    }

                    if (isValid) {
                        rays.push({
                            angle: minIntersectionAngle,
                            x: minIntersectionPointX,
                            y: minIntersectionPointY,
                        })
                    }
                }
            }
        }

        rays.sort((ray1, ray2) => ray1.angle - ray2.angle)

        return rays
    }
}

export interface CreatePointLightPacket extends BaseCreateEntityPacket {
    entityTypeName: 'point-light'
}

export const pointLightSerializer: GameEntitySerializer<
    PointLight,
    CreatePointLightPacket
> = {
    serialize(entity) {
        return {
            entityId: entity.id,
            type: 'game/create-entity',
            entityTypeName: 'point-light',
            initialPosition: entity.initialPosition,
            isRemote: !entity.isRemote,
        }
    },

    createFromPacket(game, packet) {
        return new PointLight(
            game,
            packet.initialPosition,
            packet.entityId,
            packet.isRemote,
        )
    },
}
