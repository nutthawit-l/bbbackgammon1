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

function drawCheckers(
  g: Graphics,
  gameState: GameState,
  selected: number | null,
  animFromPoint: number | null,
) {
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
      g.circle(layout.cx, checkerY(i, 4), CHECKER_R).fill({ color: 0x000000, alpha: 0.5 })
    }
  }
  for (let s = 0; s < gameState.bar.them; s++) {
    drawChecker(g, BAR_CX, BAR_THEM_ANCHOR_Y + (-1) * s * CHECKER_R * 2, 'red')
  }
  for (let s = 0; s < gameState.bar.you; s++) {
    drawChecker(g, BAR_CX, BAR_THEM_ANCHOR_Y + s * CHECKER_R * 2, 'white')
  }
}

// Hit area draw helper -- transparent react that captures pointer events
function makeHitDraw(x: number, y: number, w: number, h: number) {
  return (g: Graphics) => {
    g.clear()
    g.rect(x, y, w, h).fill({ color: 0, alpha: 0.001 })
  }
}

// Precompute hit area rects for all 24 points (full colum, split at midpoint y=164)
const HIT_AREAS = POINT_LAYOUT.map((layout, i) => {
  const xOff = POINT_LAYOUT.indexOf(layout) >= 0 ? 0 : 0 // unused, kept for clarity
  const col = (() => {
    // Reverse-compute column from cx
    const inner = layout.cx - 10
    const col6plus = inner >= 165.9 + 18
    return col6plus
      ? Math.round((inner - 18 - 13.83) / 27.65)
      : Math.round((inner - 13.83) / 27.65)
  })()
  const xOff2 = col >= 6 ? 18 : 0
  const xL = 10 + col * 27.65 + xOff2
  const isTop = layout.dir === 1   // top points (13–24)
  const x = xL
  const w = 27.65
  const y = isTop ? 10 : 164
  const h = isTop ? 154 : 154  // both halves are 154px (164-10 or 318-164)
  return { x, y: isTop ? 10 : 164, w, h }
})

export default function BoardScene() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE)
  const [selected, setSelected] = useState<number | null>(null)
  const animFromPointRef = useRef<number | null>(null)

  const handleClick = useCallback((pointIdx: number) => {
    if (animFromPointRef.current !== null) return

    setSelected(prev => {
      if (prev === null) {
        // Select if has checkers
        if (gameState.points[pointIdx]?.count > 0) return pointIdx
        return null
      }
      if (prev === pointIdx) return null // deselect
      // Move: update game state
      setGameState(gs => {
        const pts = gs.points.map(p => ({ ...p }))
        const from = pts[prev]
        const to = pts[pointIdx]
        pts[prev] = { ...from, count: from.count - 1 }
        if (pts[prev].count === 0) pts[prev] = { color: null, count: 0 }
        pts[pointIdx] = { color: from.color!, count: to.count + 1 }
        return { ...gs, points: pts }
      })
      return null
    })
  }, [gameState])

  const drawBoardCb = useCallback(drawBoard, [])
  const drawCheckersCb = useCallback(
    (g: Graphics) => drawCheckers(g, gameState, selected, animFromPointRef.current),
    [gameState, selected],
  )

  return (
    <>
      <pixiGraphics draw={drawBoardCb} />
      <pixiGraphics draw={drawCheckersCb} />
      {HIT_AREAS.map((area, i) => (
        <pixiGraphics
          key={i}
          draw={useCallback(makeHitDraw(area.x, area.y, area.w, area.h), [])}
          eventMode="static"
          cursor="pointer"
          onPointerDown={() => handleClick(i)}
        />
      ))}
    </>
  )
}
