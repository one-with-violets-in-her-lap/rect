import type { Game } from '@core/lib/game'

export class CharacterControls {
    private abortController: AbortController

    constructor(
        private readonly game: Game,
        private readonly handlers: {
            doOnRightButtonPressStart: () => void
            doOnRightButtonPressEnd: () => void
            doOnLeftButtonPressStart: () => void
            doOnLeftButtonPressEnd: () => void
            doOnJumpButtonClick: () => void
        },
    ) {
	this.abortController = new AbortController()
    }

    mount() {
        this.game.containerElement.insertAdjacentHTML(
            `beforeend`,
            `
	    <div id="characterControls" class="fixed bottom-8 left-1/2 -translate-x-1/2 items-center gap-5 flex-wrap flex">
		<button
		    id="moveLeftButton"
		    class="size-9 flex items-center justify-center bg-background-tinted/90 backdrop-blur-sm border-primary/30 border
			shadow-[0px_0px_12px_0px_rgba(0,0,0,0.05),inset_0px_0px_2px_0px_rgba(0,0,0,0.2)] text-stroke font-bold rounded-xl col-start-1
			col-end-4 row-start-2 active:bg-background-tinted-elevated active:scale-105 touch-none"
		>
		    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left-icon lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
		</button>

		<button
		    id="jumpButton"
		    class="size-12 flex items-center justify-center bg-background-tinted/90 backdrop-blur-sm border-primary/30
			border shadow-[0px_0px_12px_0px_rgba(0,0,0,0.05),inset_0px_0px_2px_0px_rgba(0,0,0,0.2)] text-stroke
			font-bold rounded-xl col-start-1 col-end-4 row-start-2 active:bg-background-tinted-elevated active:scale-105 touch-none"
		>
		    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-up-icon lucide-chevrons-up"><path d="m17 11-5-5-5 5"/><path d="m17 18-5-5-5 5"/></svg>
		</button>

		<button
		    id="moveRightButton"
		    class="size-9 flex items-center justify-center bg-background-tinted/90 backdrop-blur-sm border-primary/30
			border shadow-[0px_0px_12px_0px_rgba(0,0,0,0.05),inset_0px_0px_2px_0px_rgba(0,0,0,0.2)] text-stroke font-bold rounded-xl col-start-5
			col-span-4 row-start-2 active:bg-background-tinted-elevated active:scale-105 touch-none"
		>
		    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
		</button> 
	    </div>
	`,
        )

	document.getElementById('moveLeftButton')?.addEventListener('pointerdown', () => this.handlers.doOnLeftButtonPressStart(), { signal: this.abortController.signal })
	document.getElementById('moveLeftButton')?.addEventListener('pointerup', () => this.handlers.doOnLeftButtonPressEnd(), { signal: this.abortController.signal })

	document.getElementById('moveRightButton')?.addEventListener('pointerdown', () => this.handlers.doOnRightButtonPressStart(), { signal: this.abortController.signal })
	document.getElementById('moveRightButton')?.addEventListener('pointerup', () => this.handlers.doOnRightButtonPressEnd(), { signal: this.abortController.signal })

	document.getElementById('jumpButton')?.addEventListener('pointerdown', () => this.handlers.doOnJumpButtonClick(), { signal: this.abortController.signal })
    }

    destroy() {
	this.abortController.abort()

	document.getElementById('characterControls')?.remove()
    }
}
