import Peer, { type MediaConnection, type DataConnection } from 'peerjs'
import { MultiPlayerError } from '@core/lib/utils/errors'
import { KeyBindings } from '@core/lib/utils/key-bindings'
import { Emits } from '@core/lib/utils/events'

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

export async function createMultiPlayerSession(iceServers: RTCIceServer[]) {
    const peer = await createPeer(iceServers)

    return {
        sessionId: peer.id,
        waitForOtherPlayerConnection: () => waitForOtherPlayerConnection(peer),
    }
}

export function connectToMultiPlayerSession(otherEndPeerId: string, iceServers: RTCIceServer[]) {
    return createPeer(iceServers).then(
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

function createPeer(iceServers: RTCIceServer[]) {
    return new Promise<Peer>((resolve, reject) => {
        const peer = new Peer({
            debug: 2,
            config: {
                iceServers,
            },
            host: 'peerjs-signaling-server.onrender.com',
            referrerPolicy: 'no-referrer',
            secure: true,
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

export class MultiPlayerSession extends Emits<{
    'voice-chat-mute-update': { (isMuted: boolean): void }
    'player-disconnect': { (): void }
}> {
    private voiceChat?: {
        userMediaStream: MediaStream
        isMuted: boolean
        mediaRtcConnection: MediaConnection | null
    }

    private keyBindings: KeyBindings

    constructor(
        readonly type: 'host' | 'other-end-peer',
        readonly sendConnection: DataConnection,
        readonly receiveConnection: DataConnection,
        readonly currentPeer: Peer,
        readonly otherEndPeerId: string,
    ) {
        super()

        this.keyBindings = new KeyBindings([
            {
                // Press to talk
                key: 'k',
                doOnKeyDown: () => this.unmuteVoice(),
                doOnKeyUp: () => this.muteVoice(),
            },
        ])

        this.receiveConnection.on('iceStateChanged', (newState) => {
            console.log('ICE state changed:', newState)
            if (newState === 'disconnected') {
                this.emit('player-disconnect')
            }
        })
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
                        this.voiceChat = {
                            userMediaStream,
                            mediaRtcConnection: null,
                            isMuted: true,
                        }
                        this.muteVoice()

                        if (this.type === 'host') {
                            console.log('Calling a peer')

                            this.voiceChat.mediaRtcConnection =
                                this.currentPeer.call(
                                    this.otherEndPeerId,
                                    userMediaStream,
                                )

                            console.log(
                                `Call accepted: ${this.voiceChat.mediaRtcConnection}`,
                            )

                            this.voiceChat.mediaRtcConnection.addListener(
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

                                if (!this.voiceChat) {
                                    throw new MultiPlayerError(
                                        'Voice chat is not initialized at time two peers ' +
                                            'are connected. `this.voiceChat` is undefined',
                                    )
                                }
                                this.voiceChat.mediaRtcConnection = call

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
        this.receiveConnection.off('iceStateChanged')

        this.sendConnection.close()
        this.receiveConnection.close()

        this.voiceChat?.mediaRtcConnection?.close()
        this.keyBindings.disposeEventListeners()
    }

    muteVoice() {
        if (this.voiceChat?.mediaRtcConnection === undefined) {
            throw new MultiPlayerError('Voice chat is not initialized yet')
        }

        this.voiceChat.userMediaStream
            .getAudioTracks()
            .forEach((track) => (track.enabled = false))

        this.emit('voice-chat-mute-update', true)
    }

    unmuteVoice() {
        if (this.voiceChat?.userMediaStream === undefined) {
            throw new MultiPlayerError('Voice chat is not initialized yet')
        }

        this.voiceChat.userMediaStream
            .getAudioTracks()
            .forEach((track) => (track.enabled = true))

        this.emit('voice-chat-mute-update', false)
    }
}
