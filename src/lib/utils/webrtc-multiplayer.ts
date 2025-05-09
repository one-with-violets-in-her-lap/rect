import Peer, { DataConnection } from 'peerjs'

export interface MultiPlayerSession {
    receiveConnection: DataConnection
    sendConnection: DataConnection
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
                            resolve({ sendConnection, receiveConnection }),
                        )
                        .catch(reject)
                })
            }),
    )
}

function waitForOtherPlayerConnection(currentPeer: Peer) {
    return new Promise<{
        receiveConnection: DataConnection
        sendConnection: DataConnection
    }>((resolve, reject) => {
        currentPeer.once('connection', async (receiveConnection) => {
            console.log(
                `Connected to ${receiveConnection.peer}. Creating send connection...`,
            )

            const sendConnection = await createSendDataConnection(
                currentPeer,
                receiveConnection.peer,
            )

            currentPeer.off('error')

            resolve({ receiveConnection, sendConnection })
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
