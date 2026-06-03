import { Graphics } from 'pixi.js'

// Board container
const BOARD_CONTAINER_WIDTH_PX = 389
const BOARD_CONTAINER_HEIGHT_PX = 328
const BOARD_BORDER_PX = 10
const BOARD_ROUNDED = 5
const BOARD_BORDER_COLOR = 0x5e3014

// Playground 
const BAR_WIDTH_PX = 18
const CHECKER_TRAY_WIDTH_PX = 29
const PG_COLOR = 0xc8924a
const PG_HEIGHT_PX = BOARD_CONTAINER_HEIGHT_PX - 2 * BOARD_BORDER_PX
const PG_WIDTH_PX = 
  BOARD_CONTAINER_WIDTH_PX - BOARD_BORDER_PX - CHECKER_TRAY_WIDTH_PX 

// Point
const POINT_DARK_COLOR = 0x7b2d10
const POINT_LIGHT_COLOR = 0xc8501a
const POINT_WIDTH_PX = 27.65
const POINT_HEIGHT_PX = 114
const POINT_CENTER_PX = POINT_WIDTH_PX / 2 
const TOTAL_POINT_NUM = 24
const HALF_POINT_NUM = TOTAL_POINT_NUM / 2
const QUARTER_POINT_NUM = HALF_POINT_NUM / 2

function drawBar(gfx: Graphics) {
  // Bar
  const x = BOARD_BORDER_PX + (QUARTER_POINT_NUM * POINT_WIDTH_PX)
  const y = BOARD_BORDER_PX
  gfx.rect(x, y, BAR_WIDTH_PX, PG_HEIGHT_PX).fill(BOARD_BORDER_COLOR)
}

function drawPoints(gfx: Graphics, pos: 'bottom' | 'top') {
  for (let i = 0; i < HALF_POINT_NUM; i++) {
    const xOffset = i >= QUARTER_POINT_NUM ? BAR_WIDTH_PX : 0
    const xLeft = BOARD_BORDER_PX + i * POINT_WIDTH_PX + xOffset
    const xRight = xLeft + POINT_WIDTH_PX
    const xTop = (xLeft + xRight) / 2
    
    if (pos === 'bottom') {
      const color = i % 2 === 0 ? POINT_DARK_COLOR : POINT_LIGHT_COLOR
      const y = BOARD_BORDER_PX + PG_HEIGHT_PX
      gfx.poly([xLeft, y, xRight, y, xTop, y - POINT_HEIGHT_PX]).fill(color)
    } else {
      const color = i % 2 === 0 ? POINT_LIGHT_COLOR : POINT_DARK_COLOR 
      const y = BOARD_BORDER_PX
      gfx.poly([xLeft, y, xRight, y, xTop, y + POINT_HEIGHT_PX]).fill(color)
    }
  }
}

function drawPlayground(gfx: Graphics) {
  const x = BOARD_BORDER_PX
  const y = BOARD_BORDER_PX
  const h = PG_HEIGHT_PX
  const w = PG_WIDTH_PX
  gfx.rect(x, y, w, h).fill(PG_COLOR)
}

export function drawBoard(gfx: Graphics) {
  gfx.clear()

  // Board container (brown, fully rounded 5px)
  gfx.roundRect(
    0, 0,
    BOARD_CONTAINER_WIDTH_PX, 
    BOARD_CONTAINER_HEIGHT_PX,
    BOARD_ROUNDED,
  ).fill(BOARD_BORDER_COLOR)
  
  // Playground
  drawPlayground(gfx)
  
  // 24 Points
  drawPoints(gfx, 'bottom')
  drawPoints(gfx, 'top')
  
  // Bar
  drawBar(gfx)
}