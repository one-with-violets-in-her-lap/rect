// Here are stored the things exposed as a public API for initializing the game

/**
 * Rect - embeddable simple multi-player platformer game
 */

export { createGame } from '@core/lib/game'
export {
    connectToMultiPlayerSession,
    createMultiPlayerSession,
} from '@core/lib/utils/webrtc-multiplayer'
