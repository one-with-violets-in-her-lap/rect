import { MultiPlayerError } from '@core/lib/utils/errors'
import { KeyBindings } from '@core/lib/utils/key-bindings'
import Peer, { type MediaConnection, type DataConnection } from 'peerjs'

export interface MultiPlayerPacket {
    type: `${string}/${string}`
}

export function addPacketHandler<TPacket extends MultiPlayerPacket>(
    receiveConnection: DataConnection,
    packetType: TPacket['type'],
    doOnPacketReceived: (packet: TPacket) => void,
    handleOnce?: boolean,
) {
    const handleDataEvent = (data: unknown): void => {
        if (
            typeof data === 'object' &&
            data !== null &&
            'type' in data &&
            data.type === packetType
        ) {
            doOnPacketReceived(data as TPacket)
        }
    }

    if (handleOnce) {
        receiveConnection.once('data', handleDataEvent)
    } else {
        receiveConnection.on('data', handleDataEvent)
    }
}

export async function createMultiPlayerSession() {
    const peer = await createPeer()

    return {
        sessionId: peer.id,
        waitForOtherPlayerConnection: () => waitForOtherPlayerConnection(peer),
    }
}

export function connectToMultiPlayerSession(otherEndPeerId: string) {
    return createPeer().then(
        (currentPeer) =>
            new Promise<MultiPlayerSession>((resolve, reject) => {
                const sendConnectionCreationPromise = createSendDataConnection(
                    currentPeer,
                    otherEndPeerId,
                )

                currentPeer.once('connection', async (receiveConnection) => {
                    console.log(`Connected to ${receiveConnection.peer}`)

                    try {
                        const sendConnection =
                            await sendConnectionCreationPromise

                        const multiPlayerSession = new MultiPlayerSession(
                            'other-end-peer',
                            sendConnection,
                            receiveConnection,
                            currentPeer,
                            receiveConnection.peer,
                        )

                        multiPlayerSession.setupVoiceChat()

                        resolve(multiPlayerSession)
                    } catch (error) {
                        reject(error)
                    }
                })
            }),
    )
}

function waitForOtherPlayerConnection(currentPeer: Peer) {
    return new Promise<MultiPlayerSession>((resolve, reject) => {
        currentPeer.once('connection', async (receiveConnection) => {
            console.log(
                `Connected to ${receiveConnection.peer}. Creating send connection...`,
            )

            try {
                const sendConnection = await createSendDataConnection(
                    currentPeer,
                    receiveConnection.peer,
                )

                currentPeer.off('error')

                const multiPlayerSession = new MultiPlayerSession(
                    'host',
                    sendConnection,
                    receiveConnection,
                    currentPeer,
                    receiveConnection.peer,
                )

                multiPlayerSession.setupVoiceChat()

                resolve(multiPlayerSession)
            } catch (error) {
                reject(error)
            }
        })

        currentPeer.once('error', reject)
    })
}

function createSendDataConnection(currentPeer: Peer, otherEndPeerId: string) {
    return new Promise<DataConnection>((resolve, reject) => {
        const sendConnection = currentPeer.connect(otherEndPeerId)

        sendConnection.once('open', () => {
            sendConnection.off('error')
            resolve(sendConnection)
        })

        sendConnection.once('error', reject)
    })
}

function createPeer() {
    return new Promise<Peer>((resolve, reject) => {
        const peer = new Peer({
            debug: 2,
        })

        peer.once('open', (peerId) => {
            console.log(
                `My peer ID is: ${peerId}. Waiting for another peer to connect...`,
            )

            peer.off('error')

            resolve(peer)
        })

        peer.once('error', (error) => {
            reject(error)
        })
    })
}

export class MultiPlayerSession {
    private voiceChatConnection?: MediaConnection
    private userMediaStream?: MediaStream

    private keyBindings: KeyBindings

    constructor(
        readonly type: 'host' | 'other-end-peer',
        readonly sendConnection: DataConnection,
        readonly receiveConnection: DataConnection,
        readonly currentPeer: Peer,
        readonly otherEndPeerId: string,
    ) {
        this.keyBindings = new KeyBindings([
            {
                // Press to talk
                key: 'k',
                doOnKeyDown: () => this.unmuteVoice(),
                doOnKeyUp: () => this.muteVoice(),
            },
        ])
    }

    setupVoiceChat() {
        return navigator.mediaDevices
            .getUserMedia({
                audio: true,
                video: false,
                preferCurrentTab: true,
            })
            .then(
                (userMediaStream) =>
                    new Promise<void>((resolve) => {
                        this.userMediaStream = userMediaStream
                        this.muteVoice()

                        if (this.type === 'host') {
                            console.log('Calling a peer')

                            this.voiceChatConnection = this.currentPeer.call(
                                this.otherEndPeerId,
                                userMediaStream,
                            )

                            console.log(
                                `Call accepted: ${this.voiceChatConnection}`,
                            )

                            this.voiceChatConnection.addListener(
                                'stream',
                                (stream) => {
                                    const audio = new Audio()
                                    audio.srcObject = stream
                                    audio.play()
                                },
                            )

                            resolve()
                        } else {
                            console.log('Waiting for a call')

                            this.currentPeer.addListener('call', (call) => {
                                console.log('Answering the call')

                                call.answer(userMediaStream)

                                call.addListener('stream', (stream) => {
                                    const audio = new Audio()
                                    audio.srcObject = stream
                                    audio.play()
                                })

                                resolve()
                            })
                        }

                        this.keyBindings.initializeEventListeners()
                    }),
            )
    }

    destroy() {
        this.sendConnection.close()
        this.receiveConnection.close()
        this.voiceChatConnection?.close()
        this.keyBindings.disposeEventListeners()
    }

    muteVoice() {
        if (this.userMediaStream === undefined) {
            throw new MultiPlayerError('Voice chat is not initialized yet')
        }

        this.userMediaStream
            .getAudioTracks()
            .forEach((track) => (track.enabled = false))
    }

    unmuteVoice() {
        if (this.userMediaStream === undefined) {
            throw new MultiPlayerError('Voice chat is not initialized yet')
        }

        this.userMediaStream
            .getAudioTracks()
            .forEach((track) => (track.enabled = true))
    }
}
