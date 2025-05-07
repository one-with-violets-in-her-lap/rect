import Peer from 'peerjs'
import { Application } from 'pixi.js'
import { GameEntity } from '@/game-entity'
import { Obstacle } from '@/obstacle'
import { CurrentControlledCharacter } from '@/entities/character/controlled-character'
import { RemoteCharacter } from '@/entities/character/remote-character'

export async function createGame(canvasElement: HTMLCanvasElement) {
    const game = new Game()

    // Web RTC testing code

    const peer = new Peer({
        debug: 2,
    })

    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id)

        const otherEndPeerId = prompt(
            `Your peer ID is ${id}. Fill in the ID of peer you want to connect to`,
        )

        const sendConnection = peer.connect(otherEndPeerId || '')

        peer.on('connection', (receiveConnection) => {
            console.log(
                `Connected to ${receiveConnection.peer}. Starting sending and receiving`,
            )

            receiveConnection.on('data', (data) => {
                console.log(`New message from ${receiveConnection.peer}: ${data}`)
            })

            sendConnection.on('open', () => {
                console.log(`Send connection opened`)

                setInterval(() => {
                    console.log(`Sending hi to ${sendConnection.peer}`)
                    sendConnection.send(`Hi from ${peer.id}`)
                }, 1000)
            })
            sendConnection.on('error', (e) => console.error(e))
        })
        peer.on('error', (e) => console.error(e))
    })

    // End of Web RTC testing code

    game.entities = [
        new CurrentControlledCharacter(game),
        new RemoteCharacter(game),
        new Obstacle(game),
    ]
    await game.initialize(canvasElement)
}

export class Game {
    pixiApp: Application

    entities: GameEntity[] = []

    constructor() {
        this.pixiApp = new Application()
    }

    async initialize(canvasElement: HTMLCanvasElement) {
        await this.pixiApp.init({
            canvas: canvasElement,
            resizeTo: window,
            backgroundColor: '#FFFFFF',
        })

        this.entities.forEach(async (entity) => {
            this.pixiApp.stage.addChild(await entity.initialize())
            this.pixiApp.ticker.add((ticker) => entity.update(ticker))
        })
    }
}
