export class Emits<TEvents extends Record<string, { (...args: any): void }>> {
    private listeners: Partial<Record<keyof TEvents, Function[]>> = {}

    addEventListener<TEvent extends keyof TEvents>(
        event: TEvent,
        handler: TEvents[TEvent],
        signal?: AbortSignal,
    ) {
        if (!(event in this.listeners)) {
            this.listeners[event] = []
        }

        this.listeners[event]?.push(handler)

        const remove = () => {
            if (!this.listeners[event]) {
                return
            }

            this.listeners[event] = this.listeners[event].filter(
                (listener) => listener !== handler,
            )
        }

        signal?.addEventListener('abort', remove)

        return { remove }
    }

    removeAllListeners() {
        this.listeners = {}
    }

    protected emit<TEvent extends keyof TEvents>(
        event: TEvent,
        ...args: Parameters<TEvents[TEvent]>
    ) {
        this.listeners[event]?.forEach((listener) => listener(...args))
    }
}
