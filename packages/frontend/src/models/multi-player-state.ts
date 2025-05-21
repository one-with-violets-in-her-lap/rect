import type { MultiPlayerSession } from 'rect'

export type MultiPlayerState =
    | {
          status: 'not-initialized' | 'waiting-for-peer-to-connect' | 'loading'
      }
    | {
          status: 'connected'
          multiPlayerSession: MultiPlayerSession
      }
