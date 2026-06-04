import { Graphics } from 'pixi.js'

import type { 
  Coord, 
  Checker, 
  GameState, 
  CheckerSelected, 
  CheckerColor,
  Point 
} from '../game/state'
import { TOTAL_POINT_NUMBER, getPoint, getPointState } from '../game/state'

const RADIUS_PX = 10
const DIAMETER_PX = RADIUS_PX * 2
const HIGHTLIGHT_PX = 4
const HIGHTLIGHT_STYLE = { color: 0x4499ff, alpha: 0.6 }
const WHITE_COLOR = 0xe0dcd5
const WHITE_STROKE_STYLE = { color: 0x9a9490, width: 1 }
const RED_COLOR = 0xd42200
const RED_STROKE_STYLE = { color: 0x8a1200, width: 1 }
const LOOSE_STACK = 5
const COMPACT_STACK = 10
const DENSE_STACK = 17

export function newChecker(
  coord: Coord, color: CheckerColor, hightlight: boolean): Checker {
    return { coord: coord, color: color, hightlight: hightlight }
  }

// Returns the canvas Y coordinate for a checker at the given stack position,
// adjusting spacing based on how many checkers are stacked on the point.
export function getCheckerY(
  p: Point, stackCount: number, totalCount: number): number {
  const { coord, direction } = p
  if (totalCount <= LOOSE_STACK) {
    return coord.y + direction * (RADIUS_PX + stackCount * DIAMETER_PX)
  } else if (totalCount <= COMPACT_STACK) {
    return coord.y + direction * (RADIUS_PX + stackCount * (DIAMETER_PX / 2))
  } else if (totalCount <= DENSE_STACK) {
    return coord.y + direction * (RADIUS_PX + stackCount * (DIAMETER_PX / 3.5))
  } else {
    return coord.y + direction * (RADIUS_PX + stackCount * (DIAMETER_PX / 5))
  }
}

export function drawChecker(gfx: Graphics, c: Checker) {
  const { coord, color, hightlight } = c 
  const { x, y } = coord
  if (hightlight) {
    gfx.circle(x, y, (RADIUS_PX + HIGHTLIGHT_PX)).fill(HIGHTLIGHT_STYLE)
  }
  const fill = color === 'red' ? RED_COLOR : WHITE_COLOR
  const stroke = color === 'red' ? RED_STROKE_STYLE : WHITE_STROKE_STYLE
  gfx.circle(x, y, RADIUS_PX).fill(fill).stroke(stroke)
}

export function drawCheckers(
  gfx: Graphics, gs: GameState, sel: CheckerSelected ) {
    gfx.clear()
    
    for (let pIdx = 0; pIdx < TOTAL_POINT_NUMBER; pIdx++) {
      const ps = getPointState(gs, pIdx)
    
      // If point is empty, nothing is draw.
      if (ps.checker === null || ps.count === 0) continue

      const p = getPoint(pIdx)

      const isSel = sel === pIdx 
      for (let sc = 0; sc < ps.count; sc++) {
        const y = getCheckerY(p, sc, ps.count)
        const isTop = sc === ps.count - 1
        const checker = newChecker(
          { x: p.coord.x, y: y }, ps.checker, (isSel && isTop)
        )
        drawChecker(gfx, checker)
      }
    }
  }