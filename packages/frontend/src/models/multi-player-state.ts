import type { MultiPlayerSession } from '@core/lib/utils/webrtc-multiplayer'

export type MultiPlayerState =
    | {
          status: 'not-initialized' | 'waiting-for-peer-to-connect' | 'loading'
      }
    | {
          status: 'connected'
          multiPlayerSession: MultiPlayerSession
      }
