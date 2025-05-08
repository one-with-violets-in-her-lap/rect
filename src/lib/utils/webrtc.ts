import Peer, { DataConnection } from 'peerjs'

export function openPeerForConnections() {
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

export function connectToAnotherPeer(
    currentPeer: Peer,
    otherEndPeerId: string,
) {
    return new Promise<{
        receiveConnection: DataConnection
        sendDataConnection: DataConnection
    }>((resolve, reject) => {
        const sendConnectionCreationPromise = createSendDataConnection(
            currentPeer,
            otherEndPeerId,
        )

        currentPeer.once('connection', (receiveConnection) => {
            console.log(
                `Connected to ${receiveConnection.peer}`,
            )

            sendConnectionCreationPromise
                .then((sendDataConnection) =>
                    resolve({ sendDataConnection, receiveConnection }),
                )
                .catch(reject)
        })
    })
}

export function waitForAnotherPeerConnection(currentPeer: Peer) {
    return new Promise<{
        receiveConnection: DataConnection
        sendDataConnection: DataConnection
    }>((resolve, reject) => {
        currentPeer.once('connection', async (receiveConnection) => {
            console.log(
                `Connected to ${receiveConnection.peer}. Creating send connection...`,
            )

            const sendDataConnection = await createSendDataConnection(
                currentPeer,
                receiveConnection.peer,
            )

            currentPeer.off('error')

            resolve({ receiveConnection, sendDataConnection })
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
