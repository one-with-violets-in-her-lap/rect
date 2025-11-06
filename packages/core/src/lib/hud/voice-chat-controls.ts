import type { Game } from '@core/lib/game'

const ELEMENT_IDS = {
    container: 'voiceChatControls',
    voiceChatButton: 'voiceChatButton',
}

export class VoiceChatControls {
    private abortController: AbortController

    constructor(
        private readonly game: Game,
        private readonly handlers: {
            doOnVoiceButtonPressStart: () => void
            doOnVoiceButtonPressEnd: () => void
        },
    ) {
        this.abortController = new AbortController()
    }

    mount() {
        this.game.containerElement.insertAdjacentHTML(
            `beforeend`,
            `
	    <div id="${ELEMENT_IDS.container}" class="fixed bottom-8 right-8 items-center gap-5 flex-wrap flex">
		<button
		    id="${ELEMENT_IDS.voiceChatButton}"
		    class="size-9 flex items-center justify-center bg-background-tinted/90 backdrop-blur-sm border-primary/30 border
			shadow-[0px_0px_12px_0px_rgba(0,0,0,0.05),inset_0px_0px_2px_0px_rgba(0,0,0,0.2)] text-stroke font-bold rounded-xl col-start-1
			col-end-4 row-start-2 active:bg-background-tinted-elevated active:scale-105 touch-none"
		>
		    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic-icon lucide-mic"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg>
		</button>
	    </div>
	`,
        )

        document
            .getElementById(ELEMENT_IDS.voiceChatButton)
            ?.addEventListener(
                'pointerdown',
                () => this.handlers.doOnVoiceButtonPressStart(),
                { signal: this.abortController.signal },
            )

        document
            .getElementById(ELEMENT_IDS.voiceChatButton)
            ?.addEventListener(
                'pointerup',
                () => this.handlers.doOnVoiceButtonPressEnd(),
                { signal: this.abortController.signal },
            )
    }

    destroy() {
        this.abortController.abort()

        document.getElementById(ELEMENT_IDS.container)?.remove()
    }
}
