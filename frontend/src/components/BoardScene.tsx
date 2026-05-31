import { useCallback, useState } from 'react'
import { extend } from '@pixi/react'
import { Graphics } from 'pixi.js'
import * as game from '../gameState'

extend({ Graphics })

// Board
const BOARD_ROUNDED = 5
const BOARD_BORDER_COLOR = 0x5e3014
const PLAYGROUND_COLOR = 0xc8924a
const CHECKER_TRAY_WIDTH_PX = 29
const TRIANGLE_DARK = 0x7b2d10
const TRIANGLE_LIGHT = 0xc8501a

// Checker
const CHECKER_WHITE_COLOR = 0xe0dcd5
const CHECKER_WHITE_STROKE = { color: 0x9a9490, width: 1 }
const CHECKER_RED_COLOR = 0xd42200
const CHECKER_RED_STROKE = { color: 0x8a1200, width: 1 }
const CHECKER_HIGHTLIGHT = { color: 0x4499ff, alpha: 0.6 }

function drawBoard(g: Graphics) {
  g.clear()

  // Board container (brown, fully rounded 5px)
  g.roundRect(
    0, 0,
    game.BOARD_CONTAINER_WIDTH_PX, game.BOARD_CONTAINER_HEIGHT_PX,
    BOARD_ROUNDED,
  ).fill(BOARD_BORDER_COLOR)
  
  // Playground
  const xPlayground = game.BOARD_BORDER_PX
  const yPlayground = game.BOARD_BORDER_PX
  const heightPlayground =
    game.BOARD_CONTAINER_HEIGHT_PX - 2 * game.BOARD_BORDER_PX
  const widthPlayground =
    game.BOARD_CONTAINER_WIDTH_PX -
    (game.BOARD_BORDER_PX + CHECKER_TRAY_WIDTH_PX)
  g.rect(xPlayground, yPlayground, widthPlayground, heightPlayground)
    .fill(PLAYGROUND_COLOR)
  
  // 12 bottom triangles -- col 0-5 left of bar, col 6-11 right of bar
  for (let col = 0; col < 12; col++) {
    const xOffset = col >= 6 ? game.BAR_WIDTH_PX : 0
    
    const xLeft =
      game.BOARD_BORDER_PX + col * game.TRIANGLE_WIDTH_PX + xOffset
    const xRight = xLeft + game.TRIANGLE_WIDTH_PX
    const xTop = (xLeft + xRight) / 2
    const color = col % 2 === 0 ? TRIANGLE_DARK : TRIANGLE_LIGHT
    
    // bottom
    const yBottom = game.BOARD_BORDER_PX + heightPlayground
    g.poly([
      xLeft, yBottom, xRight, yBottom,
      xTop, yBottom - game.TRIANGLE_HEIGHT_PX,
    ]).fill(color)
  }
  
  // 12 top triangles -- col 0-5 left of bar, col 6-11 right of bar
  for (let col = 0; col < 12; col++) {
    const xOffset = col >= 6 ? game.BAR_WIDTH_PX : 0
    
    const xLeft =
      game.BOARD_BORDER_PX + col * game.TRIANGLE_WIDTH_PX + xOffset
    const xRight = xLeft + game.TRIANGLE_WIDTH_PX
    const xTop = (xLeft + xRight) / 2
    const color = col % 2 === 0 ? TRIANGLE_LIGHT : TRIANGLE_DARK
    
    // top
    const yTop = game.BOARD_BORDER_PX
    g.poly([
      xLeft, yTop, xRight, yTop,
      xTop, yTop + game.TRIANGLE_HEIGHT_PX,
    ]).fill(color)
  }
  
  // Bar
  const xBar = game.BOARD_BORDER_PX + 6 * game.TRIANGLE_WIDTH_PX
  const yBar = game.BOARD_BORDER_PX
  g.rect(xBar, yBar, game.BAR_WIDTH_PX, heightPlayground)
    .fill(BOARD_BORDER_COLOR)
}

function drawChecker(
  g: Graphics, x: number, y: number,
  checker: game.Checker, highlight = false,
) {
  if (highlight) {
    g.circle(x, y, (game.CHECKER_RADIUS_PX + 4)).fill(CHECKER_HIGHTLIGHT)
  }
  const fill = checker === 'red' ? CHECKER_RED_COLOR : CHECKER_WHITE_COLOR
  const stroke = checker === 'red' ? CHECKER_RED_STROKE : CHECKER_WHITE_STROKE
  g.circle(x, y, game.CHECKER_RADIUS_PX).fill(fill).stroke(stroke)
}

function drawCheckers(g: Graphics, gs: game.GameState) {
  g.clear()
  
  for (let i = 0; i < game.TOTAL_CHECKER_NUMBER; i++) {
    const ps = game.getPointState(gs, i)
    
    // If point is empty, nothing is draw.
    if (game.isPointEmpty(ps)) continue
    
    const p = game.getPoint(i)

    const stackSize = Math.min(ps.count, game.MAX_CHECKER_STACK)
    for (let sc = 0; sc < stackSize; sc++) {
      const y = game.getCheckerY(i, sc)
      drawChecker(g, p.x, y, ps.checker, false)
    }
  }
}

export default function BoardScene() {
  const [gameState] = useState<game.GameState>(game.INITIAL_STATE)

  return (
    <>
      <pixiGraphics draw={useCallback(drawBoard, [])} />
      <pixiGraphics
        draw={useCallback((g: Graphics) => drawCheckers(g, gameState), [])}
      />
    </>
  ) 
}