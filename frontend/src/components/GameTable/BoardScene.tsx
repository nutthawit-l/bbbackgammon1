import { useCallback, useRef, useState } from 'react'
import type { Graphics } from 'pixi.js'
import {
  POINT_LAYOUT, CHECKER_R, BAR_CX, BAR_THEM_ANCHOR_Y, BAR_YOU_ANCHOR_Y, checkerY,
} from './boardLayout'
import { INITIAL_STATE, type GameState, type CheckerColor } from './checkerState'

const TRIANGLE_DARK = 0x7b2d10
const TRIANGLE_LIGHT = 0xc8501a

function drawBoard(g: Graphics) {
  g.clear()
  g.roundRect(0, 0, 389, 328, 5).fill(0x5e3014)
  g.rect(10, 10, 350, 308).fill(0xc8924a)
  for (let col = 0; col < 12; col++) {
    const xOff = col >= 6 ? 18 : 0
    const xL = 10 + col * 27.65 + xOff
    const xR = xL + 27.65
    const xT = (xL + xR) / 2
    const color = col % 2 === 0 ? TRIANGLE_DARK : TRIANGLE_LIGHT
    g.poly([xL, 10, xR, 10, xT, 124]).fill(color)
    g.poly([xL, 318, xR, 318, xT, 204]).fill(color)
  }
  g.rect(176, 10, 18, 308).fill(0x351b0b)
}

function drawChecker(g: Graphics, cx: number, cy: number, color: CheckerColor, highlight = false) {
  if (highlight) {
    g.circle(cx, cy, CHECKER_R + 4).fill({ color: 0x4499ff, alpha: 0.6 })
  }
  const fill   = color === 'red' ? 0xd42200 : 0xe0dcd5
  const stroke = color === 'red' ? 0x8a1200 : 0x9a9490
  g.circle(cx, cy, CHECKER_R).fill(fill).stroke({ color: stroke, width: 1 })
}

function drawCheckers(g: Graphics, gameState: GameState, selected: number | null) {
  g.clear()

  for (let i = 0; i < 24; i++) {
    const pt = gameState.points[i]
    if (!pt.color || pt.count === 0) continue
    const layout = POINT_LAYOUT[i]
    const display = Math.min(pt.count, 5)
    for (let s = 0; s < display; s++) {
      const y = checkerY(i, s)
      const isTop = s === display - 1
      drawChecker(g, layout.cx, y, pt.color, isTop && selected === i)
    }
    if (pt.count > 5) {
      // Draw count badge on topmost checker (darker overlay + number rendered via separate Text in future)
      g.circle(layout.cx, checkerY(i, 4), CHECKER_R).fill({ color: 0x000000, alpha: 0.5 })
    }
  }

  // Bar checkers
  for (let s = 0; s < gameState.bar.them; s++) {
    drawChecker(g, BAR_CX, BAR_THEM_ANCHOR_Y + (-1) * s * CHECKER_R * 2, 'red')
  }
  for (let s = 0; s < gameState.bar.you; s++) {
    drawChecker(g, BAR_CX, BAR_THEM_ANCHOR_Y + s * CHECKER_R * 2, 'white')
  }
}

export default function BoardScene() {
  const [gameState] = useState<GameState>(INITIAL_STATE)
  const [selected, setSelected] = useState<number | null>(null)
  const _ = setSelected // will be used in next task

  const drawBoardCb = useCallback(drawBoard, [])
  const drawCheckersCb = useCallback(
    (g: Graphics) => drawCheckers(g, gameState, selected),
    [gameState, selected],
  )

  return (
    <>
      <pixiGraphics draw={drawBoardCb} />
      <pixiGraphics draw={drawCheckersCb} />
    </>
  )
}
