// Here are stored the things exposed as a public API for initializing the game

/**
 * Rect - embeddable simple multi-player platformer game
 */

export { Game } from '@core/lib/game'
export { GameMap } from '@core/lib/map'
export {
    connectToMultiPlayerSession,
    createMultiPlayerSession,
    getVoiceChatUserStream,
    type MultiPlayerSession,
} from '@core/lib/utils/webrtc-multiplayer'
