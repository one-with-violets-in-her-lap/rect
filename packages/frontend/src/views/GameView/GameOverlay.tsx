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

    useEffect(() => {
        multiPlayerSession.doOnVoiceMuteUpdate = setMuted

        return () => {
            multiPlayerSession.doOnVoiceMuteUpdate = null
        }
    }, [])

    return (
        <div className="absolute top-0 left-0 flex h-full w-full items-start justify-end overflow-hidden p-5">
            <div
                className={buildClassName(
                    'bg-primary text-background flex items-center gap-x-2 rounded-3xl px-5 py-1 text-lg transition-all duration-300 ease-out',
                    muted && 'scale-0 opacity-0',
                )}
            >
                Speaking
                <MicIcon className="animate-pulse" />
            </div>
        </div>
    )
}
