// Here are stored the things exposed as a public API for initializing the game

/**
 * Rect - embeddable simple multi-player platformer game
 */

export { Game } from '@core/lib/game'
export { loadMapIfHost } from '@core/lib/map'
export {
    connectToMultiPlayerSession,
    createMultiPlayerSession,
    type MultiPlayerSession,
} from '@core/lib/utils/webrtc-multiplayer'
