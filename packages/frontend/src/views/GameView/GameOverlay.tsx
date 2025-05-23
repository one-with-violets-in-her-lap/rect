import type { MultiPlayerSession } from '@core/index'
import { buildClassName } from '@frontend/utils/class-names'
import { MicIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function GameOverlay({
    multiPlayerSession,
}: {
    multiPlayerSession: MultiPlayerSession
}) {
    const [muted, setMuted] = useState(true)
    const [muteToggleShortcutTipVisible, setMuteToggleShortcutTipVisible] =
        useState(false)

    function handleVoiceMuteUpdate(isMuted: boolean) {
        setMuteToggleShortcutTipVisible(false)
        setMuted(isMuted)
    }

    useEffect(() => {
        multiPlayerSession.doOnVoiceMuteUpdate = handleVoiceMuteUpdate

        let microphoneTipShowTimeoutId = window.setTimeout(() => {
            setMuteToggleShortcutTipVisible(true)
        }, 2000)

        return () => {
            window.clearTimeout(microphoneTipShowTimeoutId)
            multiPlayerSession.doOnVoiceMuteUpdate = null
        }
    }, [])

    return (
        <div className="pointer-events-none absolute top-0 left-0 flex h-full w-full items-start justify-end overflow-hidden p-5">
            <div
                className={buildClassName(
                    'bg-primary text-background flex items-center gap-x-2 rounded-3xl px-5 py-1 text-lg transition-all duration-300 ease-out',
                    muted && 'scale-0 opacity-0',
                )}
            >
                Speaking
                <MicIcon className="animate-pulse" />
            </div>

            <div
                className={buildClassName(
                    'bg-background text-stroke border-primary/50 shadow-primary/40 flex items-center gap-x-2 rounded-3xl border px-5 py-1 text-lg shadow-2xl transition-all duration-300 ease-out',
                    !muteToggleShortcutTipVisible &&
                        'absolute -translate-x-20 opacity-0',
                )}
            >
                Press K to talk
                <MicIcon />
            </div>
        </div>
    )
}
