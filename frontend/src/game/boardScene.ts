import { Application, Assets, Sprite } from 'pixi.js'

const BOARD_WIDTH = 389
const BOARD_HEIGHT = 328
const BOARD_TEXTURE = '/assets/game-board/board.png'

export async function buildBoardScene(app: Application): Promise<void> {
  const texture = await Assets.load(BOARD_TEXTURE)
  const board = new Sprite(texture)
  board.width = BOARD_WIDTH
  board.height = BOARD_HEIGHT
  app.stage.addChild(board)
}
