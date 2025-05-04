import { Character } from "@/character";
import { Application } from "pixi.js";

export async function initializeGame(canvasElement: HTMLCanvasElement) {
  const pixiApp = new Application();

  await pixiApp.init({
    canvas: canvasElement,
    resizeTo: window,
    backgroundColor: "#FFFFFF",
  });

  const character = new Character(pixiApp.canvas.height, pixiApp.ticker);
  pixiApp.stage.addChild(await character.initializeSprite());
}
