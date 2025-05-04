export interface KeyBinding {
  key: string;
  doOnKeyDown?: VoidFunction;
  doOnKeyUp?: VoidFunction;
}

export class KeyBindings {
  private readonly keyHandlersAbortController = new AbortController();

  constructor(private readonly keyBindings: KeyBinding[]) {}
  initializeEventListeners() {
    this.keyBindings.forEach((keyBinding) => {
      document.addEventListener(
        "keydown",
        (event) =>
          event.key === keyBinding.key && keyBinding.doOnKeyDown
            ? keyBinding.doOnKeyDown()
            : null,
        { signal: this.keyHandlersAbortController.signal },
      );

      document.addEventListener(
        "keyup",
        (event) =>
          event.key === keyBinding.key && keyBinding.doOnKeyUp
            ? keyBinding.doOnKeyUp()
            : null,
        { signal: this.keyHandlersAbortController.signal },
      );
    });
  }

  disposeEventListeners() {
    this.keyHandlersAbortController.abort();
  }
}
