import { CopyIcon, QrCodeIcon } from 'lucide-react'
import { useState } from 'react'
import { toast, Toaster } from 'sonner'
import { createMultiPlayerSession } from 'rect'
import { AppButton } from '@frontend/components/ui/AppButton'
import { buildClassName } from '@frontend/utils/class-names'

type MultiPlayerSetupStatus =
    | {
          status: 'idle'
      }
    | {
          status: 'waiting-for-another-player'
          connectUrl: string
      }
    | {
          status: 'complete'
      }

function App() {
    const [loading, setLoading] = useState(false)

    const [multiPlayerStatus, setMultiPlayerStatus] =
        useState<MultiPlayerSetupStatus>({
            status: 'idle',
        })

    async function handleStart() {
        setLoading(true)

        try {
            const { sessionId, waitForOtherPlayerConnection } =
                await createMultiPlayerSession()

            const connectUrl = new URL(window.location.href)
            connectUrl.searchParams.set('connect', sessionId)

            setMultiPlayerStatus({
                status: 'waiting-for-another-player',
                connectUrl: connectUrl.toString(),
            })

            await waitForOtherPlayerConnection()

            setMultiPlayerStatus({
                status: 'complete',
            })
        } catch (error) {
            toast.error('An unknown error occurred')
            setMultiPlayerStatus({
                status: 'idle',
            })
            throw error
        } finally {
            setLoading(false)
        }
    }

    async function handleCopy() {
        if (multiPlayerStatus.status === 'waiting-for-another-player') {
            try {
                await navigator.clipboard.writeText(
                    multiPlayerStatus.connectUrl,
                )
                toast.success('Copied')
            } catch (error) {
                toast.error('Failed to copy')
            }
        }
    }

    return (
        <>
            <Toaster
                richColors
                className="text-xl"
                toastOptions={{
                    style: { fontSize: '18px' },
                    closeButton: true,
                }}
            />

            <div className="mx-auto max-w-4xl px-6 py-46">
                <section
                    className={buildClassName(
                        'transition-all',
                        'duration-700',
                        multiPlayerStatus.status ===
                            'waiting-for-another-player' &&
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
                        multiPlayerStatus.status ===
                            'waiting-for-another-player' &&
                            'translate-x-0 opacity-100',
                    )}
                >
                    <h2 className="mb-7 text-5xl font-semibold">
                        Waiting for another player to connect
                    </h2>

                    <p className="mb-5 text-xl">Give your friend this link:</p>

                    <div className="text-primary flex max-w-lg items-center gap-x-4 rounded-lg bg-pink-50 px-4 py-3">
                        <div className="grow overflow-x-hidden text-nowrap">
                            {multiPlayerStatus.status ===
                            'waiting-for-another-player'
                                ? multiPlayerStatus.connectUrl
                                : ''}
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
        </>
    )
}

export default App
