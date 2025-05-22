import type { MultiPlayerSession } from '@core/index'
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

    return <div>{muted ? 'Muted' : 'Speaking'}</div>
}
