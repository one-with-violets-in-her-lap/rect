import type { SoundManager, SoundName } from '@core/lib/sounds'
import {
    addPacketHandler,
    type MultiPlayerPacket,
    type MultiPlayerSession,
} from '@core/lib/utils/webrtc-multiplayer'

interface SoundEffectPacket extends MultiPlayerPacket {
    type: 'sound/play'
    soundName: SoundName
}

export interface SoundEffectSynchronizer {
    syncPlayedSound(sound: SoundName): Promise<void>
    cleanup(): void
}

export function createSoundEffectSynchronizer(
    soundManager: SoundManager,
    multiPlayerSession: MultiPlayerSession,
): SoundEffectSynchronizer {
    addPacketHandler(
        multiPlayerSession.receiveConnection,
        'sound/play',
        (soundEffectPacket: SoundEffectPacket) => {
            soundManager.play(soundEffectPacket.soundName, { sync: false })
        },
    )

    return {
        cleanup() {
            multiPlayerSession.receiveConnection.close()
            multiPlayerSession.sendConnection.close()
        },

        async syncPlayedSound(sound) {
            const soundEffectPacket: SoundEffectPacket = {
                type: 'sound/play',
                soundName: sound,
            }

            await multiPlayerSession.sendConnection.send(soundEffectPacket)
        },
    }
}
