import Peer, { DataConnection } from 'peerjs'

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

                currentPeer.once('connection', (receiveConnection) => {
                    console.log(`Connected to ${receiveConnection.peer}`)

                    sendConnectionCreationPromise
                        .then((sendConnection) =>
                            resolve({
                                type: 'other-end-peer',
                                sendConnection,
                                receiveConnection,
                                destroy() {
                                    sendConnection.close()
                                    receiveConnection.close()
                                },
                            }),
                        )
                        .catch(reject)
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

            const sendConnection = await createSendDataConnection(
                currentPeer,
                receiveConnection.peer,
            )

            currentPeer.off('error')

            resolve({
                type: 'host',
                receiveConnection,
                sendConnection,
                destroy() {
                    sendConnection.close()
                    receiveConnection.close()
                },
            })
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
