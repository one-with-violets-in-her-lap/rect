import { CopyIcon, QrCodeIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { createMultiPlayerSession } from 'rect'
import { AppButton } from '@frontend/components/ui/AppButton'
import { buildClassName } from '@frontend/utils/class-names'
import type { MultiPlayerState } from '@frontend/models/multi-player-state'

export function CreateGameView({
    multiPlayer,
    onMultiPlayerStateUpdate,
}: {
    multiPlayer: MultiPlayerState
    onMultiPlayerStateUpdate: (newValue: MultiPlayerState) => void
}) {
    const [loading, setLoading] = useState(false)
    const [connectUrl, setConnectUrl] = useState<string>()

    async function handleStart() {
        setLoading(true)

        try {
            const { sessionId, waitForOtherPlayerConnection } =
                await createMultiPlayerSession()

            const connectUrl = new URL(window.location.href)
            connectUrl.searchParams.set('connect', sessionId)
            setConnectUrl(connectUrl.toString())

            onMultiPlayerStateUpdate({
                status: 'waiting-for-peer-to-connect',
            })

            const multiPlayerSession = await waitForOtherPlayerConnection()

            onMultiPlayerStateUpdate({
                status: 'connected',
                multiPlayerSession,
            })
        } catch (error) {
            toast.error('An unknown error occurred')
            onMultiPlayerStateUpdate({
                status: 'not-initialized',
            })

            throw error
        } finally {
            setLoading(false)
        }
    }

    async function handleCopy() {
        if (connectUrl) {
            try {
                await navigator.clipboard.writeText(connectUrl)
                toast.success('Copied')
            } catch {
                toast.error('Failed to copy')
            }
        }
    }

    return (
        <div className="mx-auto flex h-full max-w-4xl items-center px-4 py-6">
            <section
                className={buildClassName(
                    'transition-all',
                    'duration-700',
                    multiPlayer.status === 'waiting-for-peer-to-connect' &&
                        'absolute -translate-y-96 opacity-0',
                )}
            >
                <h1 className="mb-5 text-6xl font-semibold">Rect</h1>

                <p className="mb-5 text-xl">1v1 shooter game</p>

                <AppButton
                    loading={loading}
                    className="w-2xs"
                    onClick={handleStart}
                >
                    Start
                </AppButton>
            </section>

            <section
                className={buildClassName(
                    '-translate-x-96 opacity-0 transition-all delay-500 duration-500',
                    multiPlayer.status === 'waiting-for-peer-to-connect' &&
                        'translate-x-0 opacity-100',
                )}
            >
                <h2 className="mb-7 text-5xl font-semibold max-md:text-4xl">
                    Waiting for another player to connect
                </h2>

                <p className="mb-5 text-xl">Give your friend this link:</p>

                <div className="text-primary grid max-w-lg grid-cols-[1fr_48px] items-center gap-x-4 rounded-lg bg-pink-50 px-4 py-3">
                    <div className="max-w-full grow overflow-x-hidden text-nowrap">
                        {connectUrl}
                    </div>

                    <div className="flex items-center gap-x-2">
                        <button
                            className="hover:cursor-pointer"
                            onClick={handleCopy}
                        >
                            <CopyIcon size="20px" />
                        </button>

                        <button className="hover:cursor-pointer">
                            <QrCodeIcon size="20px" />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    )
}
