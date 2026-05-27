import { useCallback, useMemo, useRef, useState } from 'react'
import { useTick } from '@pixi/react'
import type { Graphics } from 'pixi.js'
import {
  POINT_LAYOUT, CHECKER_R, BAR_CX, BAR_THEM_ANCHOR_Y, BAR_YOU_ANCHOR_Y, checkerY,
  ANIM_DURATION,
} from './boardLayout'
import { INITIAL_STATE, type GameState, type CheckerColor } from './checkerState'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnimState {
  fromX: number; fromY: number
  toX: number; toY: number
  color: CheckerColor
  fromPoint: number; toPoint: number
  t: number
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────

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
    const count = animFromPoint === i ? pt.count - 1 : pt.count
    if (count <= 0) continue
    const display = Math.min(count, 5)
    for (let s = 0; s < display; s++) {
      drawChecker(g, layout.cx, checkerY(i, s), pt.color, s === display - 1 && selected === i)
    }
    if (count > 5) {
      g.circle(layout.cx, checkerY(i, 4), CHECKER_R).fill({ color: 0x000000, alpha: 0.5 })
    }
  }
  for (let s = 0; s < gameState.bar.them; s++) {
    drawChecker(g, BAR_CX, BAR_THEM_ANCHOR_Y + (-1) * s * CHECKER_R * 2, 'red')
  }
  for (let s = 0; s < gameState.bar.you; s++) {
    drawChecker(g, BAR_CX, BAR_YOU_ANCHOR_Y + s * CHECKER_R * 2, 'white')
  }
}

// ─── Hit areas (stable, computed once outside component) ─────────────────────

const HIT_DRAWS = POINT_LAYOUT.map((layout) => {
  // Reverse-compute column from cx
  const inner = layout.cx - 10
  const isRightOfBar = inner >= 165.9 + 18
  const col = isRightOfBar
    ? Math.round((inner - 18 - 13.83) / 27.65)
    : Math.round((inner - 13.83) / 27.65)
  const xOff = col >= 6 ? 18 : 0
  const xL = 10 + col * 27.65 + xOff
  const isTop = layout.dir === 1   // top points (13–24)
  const y = isTop ? 10 : 164
  return (g: Graphics) => {
    g.clear()
    g.rect(xL, y, 27.65, 154).fill({ color: 0, alpha: 0.001 })
  }
})

// ─── Component ───────────────────────────────────────────────────────────────

export default function BoardScene() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE)
  const [selected, setSelected] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const animRef = useRef<AnimState | null>(null)
  const animGfxRef = useRef<Graphics>(null)

  // Animation tick -- runs every frame, update animRef and imperatively redraws animGfx
  useTick((ticker) => {
    const anim = animRef.current
    if (!anim || !animGfxRef.current) return

    anim.t = Math.min(1, anim.t + ticker.deltaTime / ANIM_DURATION)
    const eased = anim.t * anim.t * (3 - 2 * anim.t)
    const x = anim.fromX + (anim.toX - anim.fromX) * eased
    const y = anim.fromY + (anim.toY - anim.fromY) * eased

    const g = animGfxRef.current
    g.clear()

    if (anim.t < 1) {
      drawChecker(g, x, y, anim.color)
    } else {
      // Commit move to state
      setGameState(gs => {
        const pts = gs.points.map(p => ({ ...p }))
        const from = pts[anim.fromPoint]
        pts[anim.fromPoint] = { ...from, count: from.count - 1 }
        if (pts[anim.fromPoint].count === 0) pts[anim.fromPoint] = { color: null, count: 0 }
        const to = pts[anim.toPoint]
        pts[anim.toPoint] = { color: anim.color, count: to.count + 1 }
        return { ...gs, points: pts }
      })
      animRef.current = null
      setIsAnimating(false)
    }
  })

  const handleClick = useCallback((pointIdx: number) => {
    if (animRef.current) return // ignore during animation

    setSelected(prev => {
      if (prev === null) {
        // Select if has checkers
        if ((gameState.points[pointIdx]?.count ?? 0) > 0) return pointIdx
        return null
      }
      if (prev === pointIdx) return null // deselect

      // Start animation
      const from = POINT_LAYOUT[prev]
      const to = POINT_LAYOUT[pointIdx]
      const fromPt = gameState.points[prev]
      const stackPos = Math.min(fromPt.count - 1, 4)
      const fromY = checkerY(prev, stackPos)
      const toStackPos = Math.min((gameState.points[pointIdx]?.count ?? 0), 4)
      const toY = checkerY(pointIdx, toStackPos)

      animRef.current = {
        fromX: from.cx, fromY,
        toX: to.cx, toY,
        color: fromPt.color!,
        fromPoint: prev, toPoint: pointIdx,
        t: 0,
      }
      setIsAnimating(true)
      return null
    })
  }, [gameState, isAnimating])

  const drawBoardCb = useCallback(drawBoard, [])
  const drawCheckersCb = useCallback(
    (g: Graphics) => drawCheckers(g, gameState, selected, animRef.current?.fromPoint ?? null),
    [gameState, selected, isAnimating],
  )
  const hitDrawCallbacks = useMemo(
    () => HIT_DRAWS.map(fn => (g: Graphics) => fn(g)),
    [],
  )

  return (
    <>
      <pixiGraphics draw={drawBoardCb} />
      <pixiGraphics draw={drawCheckersCb} />
      {hitDrawCallbacks.map((draw, i) => (
        <pixiGraphics
          key={i}
          draw={draw}
          eventMode="static"
          cursor="pointer"
          onPointerDown={() => handleClick(i)}
        />
      ))}
      <pixiGraphics ref={animGfxRef} draw={(g) => g.clear()} />
    </>
  )
}
