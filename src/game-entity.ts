import { Container, Ticker } from 'pixi.js'

export abstract class GameEntity<TPixiObject extends Container> {
    protected pixiObject?: TPixiObject

    constructor(
        protected readonly canvas: HTMLCanvasElement,
        private readonly options: {
            enableCollision: boolean
            enableGravity: boolean
        },
    ) {}

    abstract initialize(): Promise<TPixiObject> | TPixiObject

    abstract destroy(): Promise<void> | void

    update(ticker: Ticker) {
        
    }
}
