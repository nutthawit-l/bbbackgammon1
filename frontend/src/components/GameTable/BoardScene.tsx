import { useCallback, useMemo, useRef, useState } from 'react'
import { useTick } from '@pixi/react'
import type { Graphics } from 'pixi.js'
import {
  POINT_LAYOUT, CHECKER_R, BAR_CX, BAR_THEM_ANCHOR_Y, BAR_YOU_ANCHOR_Y,
  checkerY, ANIM_DURATION,
} from './boardLayout'
import {
  INITIAL_STATE, type GameState, type CheckerColor, applyMove, applyBarHit
} from './checkerState'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnimState {
  // Start position (pixel coordinates) of the moving checker.
  fromX: number; fromY: number
  // End position (pixel coordinates) where the checker should land.
  toX: number; toY: number
  // Checker color being animated (used while drawing in-flight piece).
  color: CheckerColor
  // Logical board move: source point index -> destination point index.
  fromPoint: number; toPoint: number
  // Normalized animation progress in [0, 1].
  t: number
  // Set when destination is a blot
  hitColor: CheckerColor | null
  // Set when this is the hit checker flying to the bar
  isBarFly?: true
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────

const MAX_STACK = 7

const TRIANGLE_DARK = 0x7b2d10
const TRIANGLE_LIGHT = 0xc8501a

function drawBoard(g: Graphics) {
  // Pixi `Graphics` is immediate-mode: each draw call redraws full geometry.
  g.clear()
  // Board background and play surface.
  g.roundRect(0, 0, 389, 328, 5).fill(0x5e3014)
  g.rect(10, 10, 350, 308).fill(0xc8924a)
  // Draw 12 triangle columns on top and bottom (24 points total).
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
  // Optional glow to indicate selected point's top checker.
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
  // Point checkers (1..24). While animating, hide one checker from source stack.
  for (let i = 0; i < 24; i++) {
    const pt = gameState.points[i]
    if (!pt.color || pt.count === 0) continue
    const layout = POINT_LAYOUT[i]
    const count = animFromPoint === i ? pt.count - 1 : pt.count
    if (count <= 0) continue
    const display = Math.min(count, MAX_STACK)
    for (let s = 0; s < display; s++) {
      drawChecker(g, layout.cx, checkerY(i, s), pt.color, s === display - 1 && selected === i)
    }
    if (count > MAX_STACK) {
      g.circle(layout.cx, checkerY(i, MAX_STACK - 1), CHECKER_R).fill({ color: 0x000000, alpha: 0.5 })
    }
  }
  // Bar checkers are rendered in the center strip.
  for (let s = 0; s < gameState.bar.them; s++) {
    drawChecker(g, BAR_CX, BAR_THEM_ANCHOR_Y + (-1) * s * CHECKER_R * 2, 'red')
  }
  for (let s = 0; s < gameState.bar.you; s++) {
    drawChecker(g, BAR_CX, BAR_YOU_ANCHOR_Y + s * CHECKER_R * 2, 'white')
  }
}

// ─── Hit areas (stable, computed once outside component) ─────────────────────

// Create a clickable area for each point (triangle column) from data in POINT_LAYOUT.
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
    // Invisible rectangles still receive pointer events in Pixi.
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

  // `useTick` subscribes to Pixi's render loop (roughly once per frame).
  // We keep animation state in a ref so frame updates avoid React re-renders.
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
      // Draw only the in-flight checker on a dedicated top layer.
      drawChecker(g, x, y, anim.color)
    } else if (anim.isBarFly) {
      // Hit checker reached bar -- increment bar count.
      setGameState(gs => applyBarHit(gs, anim.color))
      animRef.current = null
      setIsAnimating(false)
    } else {
      // Commit move to state
      setGameState(gs => applyMove(gs, anim.fromPoint, anim.toPoint).nextState)

      if (anim.hitColor) {
        // Animate the hit checker from the destination point to the bar.
        const barCount = anim.hitColor === 'red' ? gameState.bar.them : gameState.bar.you
        const dir = anim.hitColor === 'red' ? -1 : 1
        const anchor = anim.hitColor === 'red' ? BAR_THEM_ANCHOR_Y : BAR_YOU_ANCHOR_Y
        animRef.current = {
          fromX: POINT_LAYOUT[anim.toPoint].cx,
          fromY: checkerY(anim.toPoint, 0),
          toX: BAR_CX,
          toY: anchor + dir * barCount * CHECKER_R * 2,
          color: anim.hitColor,
          fromPoint: anim.toPoint,
          toPoint: -1,
          t: 0,
          hitColor: null,
          isBarFly: true,
        }
      } else {
        animRef.current = null
        setIsAnimating(false)
      }
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
      const stackPos = Math.min(fromPt.count - 1, MAX_STACK - 1)
      const fromY = checkerY(prev, stackPos)
      const toStackPos = Math.min((gameState.points[pointIdx]?.count ?? 0), MAX_STACK - 1)
      const toY = checkerY(pointIdx, toStackPos)
      const destPt = gameState.points[pointIdx]
      const moveColor = fromPt.color!
      const isHit =
        destPt.color !== null &&
        destPt.color !== moveColor &&
        destPt.count === 1
      animRef.current = {
        fromX: from.cx, fromY,
        toX: to.cx, toY,
        color: fromPt.color!,
        fromPoint: prev, toPoint: pointIdx,
        t: 0,
        hitColor: isHit ? destPt.color : null,
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
      {/* Layer 1: static board background. */}
      <pixiGraphics draw={drawBoardCb} />
      {/* Layer 2: stacked checkers bound to React state. */}
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
      {/* Layer 4: animated checker drawn imperatively each tick. */}
      <pixiGraphics ref={animGfxRef} draw={(g) => g.clear()} />
    </>
  )
}
