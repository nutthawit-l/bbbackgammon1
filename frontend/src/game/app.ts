import { Application } from 'pixi.js'

export async function createPixiApp(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): Promise<Application> {
  const app = new Application()
  await app.init({
    canvas,
    width,
    height,
    background: 0x1a1a2e,
  })
  return app
}
