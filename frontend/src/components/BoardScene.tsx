import { useCallback } from 'react'
import { extend } from '@pixi/react'
import { Graphics } from 'pixi.js'

extend({ Graphics })

const BOARD_CONTAINER_WIDTH_PX = 389
const BOARD_CONTAINER_HEIGHT_PX = 328
const BOARD_BORDER_PX = 10
const BOARD_BORDER_COLOR = 0x5e3014
const BAR_WIDTH_PX = 18
const PLAYGROUND_COLOR = 0xc8924a
const CHECKER_TRAY_WIDTH_PX = 29
const TRIANGLE_WIDTH_PX = 27.65
const TRIANGLE_HEIGHT_PX = 114
const TRIANGLE_DARK = 0x7b2d10
const TRIANGLE_LIGHT = 0xc8501a

function drawBoard(g: Graphics) {
  g.clear()

  // Board container (brown, fully rounded 5px)
  g.roundRect(0, 0, BOARD_CONTAINER_WIDTH_PX, BOARD_CONTAINER_HEIGHT_PX, 5).fill(BOARD_BORDER_COLOR)
  
  // Playground
  const xPlayground = BOARD_BORDER_PX
  const yPlayground = BOARD_BORDER_PX
  const heightPlayground = BOARD_CONTAINER_HEIGHT_PX - 2 * BOARD_BORDER_PX
  const widthPlayground = BOARD_CONTAINER_WIDTH_PX - (BOARD_BORDER_PX + CHECKER_TRAY_WIDTH_PX)
  g.rect(xPlayground, yPlayground, widthPlayground, heightPlayground).fill(PLAYGROUND_COLOR)
  
  // 12 bottom triangles -- col 0-5 left of bar, col 6-11 right of bar
  for (let col = 0; col < 12; col++) {
    const xOffset = col >= 6 ? BAR_WIDTH_PX : 0
    
    const xLeft = BOARD_BORDER_PX + col * TRIANGLE_WIDTH_PX + xOffset
    const xRight = xLeft + TRIANGLE_WIDTH_PX
    const xTop = (xLeft + xRight) / 2
    const color = col % 2 === 0 ? TRIANGLE_DARK : TRIANGLE_LIGHT
    
    // bottom
    const yBottom = BOARD_BORDER_PX + heightPlayground
    g.poly([xLeft, yBottom, xRight, yBottom, xTop, (yBottom - TRIANGLE_HEIGHT_PX)]).fill(color)
  }
  
  // 12 top triangles -- col 0-5 left of bar, col 6-11 right of bar
  for (let col = 0; col < 12; col++) {
    const xOffset = col >= 6 ? BAR_WIDTH_PX : 0
    
    const xLeft = BOARD_BORDER_PX + col * TRIANGLE_WIDTH_PX + xOffset
    const xRight = xLeft + TRIANGLE_WIDTH_PX
    const xTop = (xLeft + xRight) / 2
    const color = col % 2 === 0 ? TRIANGLE_LIGHT : TRIANGLE_DARK
    
    // top
    const yTop = BOARD_BORDER_PX
    g.poly([xLeft, yTop, xRight, yTop, xTop, (yTop + TRIANGLE_HEIGHT_PX)]).fill(color)
  }
  
  // Bar
  const xBar = BOARD_BORDER_PX + 6 * TRIANGLE_WIDTH_PX
  const yBar = BOARD_BORDER_PX
  g.rect(xBar, yBar, BAR_WIDTH_PX, heightPlayground).fill(BOARD_BORDER_COLOR)
}

export default function BoardScene() {
  const draw = useCallback(drawBoard, [])
  return <pixiGraphics draw={draw} />
}