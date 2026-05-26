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
    backgroundAlpha: 0,
  })
  return app
}
