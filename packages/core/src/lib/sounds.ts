import jumpSound from '@core/assets/audio/jump.mp3'
import landSound from '@core/assets/audio/land.mp3'
import hitFleshSound from '@core/assets/audio/hit-flesh-2.mp3'
import metalHitSound from '@core/assets/audio/metal-hit.mp3'
import stabSound from '@core/assets/audio/sword-stab-flesh.mp3'
import gunShotSound from '@core/assets/audio/22-caliber-with-ricochet.mp3'

import {
    createSoundEffectSynchronizer,
    type SoundEffectSynchronizer,
} from '@core/lib/multi-player-sync/sound-effects'
import { getTypedObjectKeys } from '@core/lib/utils/objects'
import type { MultiPlayerSession } from '@core/lib/utils/webrtc-multiplayer'

import { Sound } from '@pixi/sound'

const sounds = {
    jump: {
        url: jumpSound,
        volume: 1.2,
    },

    land: {
        url: landSound,
        volume: 0.2,
    },

    damage: {
        url: hitFleshSound,
        volume: 0.7,
    },

    bulletObstacleHit: {
        url: metalHitSound,
        volume: 0.3,
    },

    kill: {
        url: stabSound,
        volume: 1,
    },

    shot: {
        url: gunShotSound,
        volume: 0.45,
    },
}

export type SoundName = keyof typeof sounds

export class SoundManager {
    private loadedSounds: Partial<Record<SoundName, Sound>> = {}
    private soundEffectsSynchronizer?: SoundEffectSynchronizer

    constructor(
        private readonly multiPlayerSession: MultiPlayerSession | null,
    ) {}

    async initializeAndLoadSounds() {
        if (this.multiPlayerSession !== null) {
            this.soundEffectsSynchronizer = createSoundEffectSynchronizer(
                this,
                this.multiPlayerSession,
            )
        }

        for (const key of getTypedObjectKeys(sounds)) {
            this.loadedSounds[key] = Sound.from(sounds[key])
        }
    }

    play(soundName: SoundName, options: { sync: boolean } = { sync: true }) {
        if (this.loadedSounds[soundName] === undefined) {
            console.warn(
                `Failed to play ${soundName} because it hasn't been loaded yet`,
            )
            return
        }
        this.loadedSounds[soundName].play()

        if (options.sync) {
            this.soundEffectsSynchronizer?.syncPlayedSound(soundName)
        }
    }
}
