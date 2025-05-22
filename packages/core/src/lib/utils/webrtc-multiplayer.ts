import Peer, { type DataConnection } from 'peerjs'

export interface MultiPlayerSession {
    type: 'host' | 'other-end-peer'
    receiveConnection: DataConnection
    sendConnection: DataConnection
    destroy: VoidFunction
}

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

                        setupVoiceChat(
                            'other-end-peer',
                            currentPeer,
                            receiveConnection.peer,
                        )

                        resolve({
                            type: 'other-end-peer',
                            sendConnection,
                            receiveConnection,
                            destroy() {
                                sendConnection.close()
                                receiveConnection.close()
                            },
                        })
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

                setupVoiceChat('host', currentPeer, receiveConnection.peer)

                resolve({
                    type: 'host',
                    receiveConnection,
                    sendConnection,
                    destroy() {
                        sendConnection.close()
                        receiveConnection.close()
                    },
                })
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

function setupVoiceChat(
    peerType: MultiPlayerSession['type'],
    currentPeer: Peer,
    otherEndPeerId: string,
) {
    return navigator.mediaDevices
        .getUserMedia({
            audio: true,
            video: false,
            preferCurrentTab: true,
        })
        .then(
            (userMediaStream) =>
                new Promise<void>((resolve) => {
                    if (peerType === 'host') {
                        console.log('Calling a peer')

                        const audioCallConnection = currentPeer.call(
                            otherEndPeerId,
                            userMediaStream,
                        )

                        console.log(`Call accepted: ${audioCallConnection}`)

                        audioCallConnection.addListener('stream', (stream) => {
                            const audio = new Audio()
                            audio.srcObject = stream
                            audio.play()
                        })

                        resolve()
                    } else {
                        console.log('Waiting for a call')

                        currentPeer.addListener('call', (call) => {
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
                }),
        )
}
