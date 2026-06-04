export const POINT_WIDTH_PX = 27.65
export const POINT_HEIGHT_PX = 114
export const POINT_CENTER_PX = POINT_WIDTH_PX / 2 
export const BAR_WIDTH_PX = 18
export const TOTAL_POINT_NUM = 24
export const HALF_POINT_NUM = TOTAL_POINT_NUM / 2
export const QUARTER_POINT_NUM = HALF_POINT_NUM / 2
export const BOARD_CONTAINER_WIDTH_PX = 389
export const BOARD_CONTAINER_HEIGHT_PX = 328
export const BOARD_BORDER_PX = 10
export const TOTAL_CHECKER_NUMBER = 30
export const CHECKER_RADIUS_PX = 10
export const LOOSE_CHECKER_STACK = 5
export const COMPACT_CHECKER_STACK = 10
export const DENSE_CHECKER_STACK = 17
export const ANIM_DURATION = 20
export const CHECKER_TRAY_WIDTH_PX = 29
export const PG_HEIGHT_PX = BOARD_CONTAINER_HEIGHT_PX - 2 * BOARD_BORDER_PX
export const PG_WIDTH_PX = BOARD_CONTAINER_WIDTH_PX - BOARD_BORDER_PX - CHECKER_TRAY_WIDTH_PX
export const TOTAL_POINT_NUMBER = 24

export type CheckerColor = 'red' | 'white' | null
export type CheckerSelected = number | null
export type PointIndex = number

export interface Coord { x: number, y: number }

export interface Checker {
  coord: Coord
  color: CheckerColor
  hightlight: boolean
}

export interface Point {
  coord: Coord
  // direction of stacking along Y axis:
  // -1 -> grown upward use for bottom points (1..12)
  // 1 -> grown downward use for top points (13..24)
  direction: -1 | 1
}

export interface PointState {
  // Indicate this point have checkers or empty.
  checker: CheckerColor | null
  // Number of checkers currently on this point.
  count: number
}

export interface GameState {
  // 24 points where index 0 = point 1 ... index 23 = point 24.
  points: PointState[]
  // 2 bars
  bars: PointState[]
}

export interface AnimState {
  srcPoint: Coord
  destPoint: Coord
  srcPointIndex: PointIndex
  destPointIndex: PointIndex
  checker: CheckerColor
  t: number
}

export function rmCheckerFromPoint(ps: PointState): PointState {
  ps.count -= 1
  if (ps.count == 0) ps.checker = null
  return ps
}

export function addCheckerToPoint(ps: PointState, checker: CheckerColor): PointState {
  ps.count += 1
  ps.checker = checker
  return ps
}

// export function isPointEmpty(ps: PointState): boolean {
//   return ps.checker === null || ps.count === 0;
// }

export function getPointState(gs: GameState, pIdx: PointIndex): PointState {
  return gs.points[pIdx]
}


export function getPoint(pIdx: PointIndex): Point {
  return POINTS[pIdx]
}

function getPointCenterX(pIdx: PointIndex): number {
  const shiftPx = pIdx >= QUARTER_POINT_NUM ? BAR_WIDTH_PX : 0
  return pIdx * POINT_WIDTH_PX + POINT_CENTER_PX + BOARD_BORDER_PX + shiftPx
}

/* function getBarCenterX(): number {
  return PG_WIDTH_PX / 2
} */

const BOTTOM_Y = BOARD_CONTAINER_HEIGHT_PX - BOARD_BORDER_PX

export const POINTS: Point[] = [
  // Point 1-12: bottom row, right to left
  { coord: {x: getPointCenterX(11), y: BOTTOM_Y}, direction: -1 }, // point 1
  { coord: {x: getPointCenterX(10), y: BOTTOM_Y}, direction: -1 }, // point 2
  { coord: {x: getPointCenterX(9),  y: BOTTOM_Y}, direction: -1 }, // point 3
  { coord: {x: getPointCenterX(8),  y: BOTTOM_Y}, direction: -1 }, // point 4
  { coord: {x: getPointCenterX(7),  y: BOTTOM_Y}, direction: -1 }, // point 5
  { coord: {x: getPointCenterX(6),  y: BOTTOM_Y}, direction: -1 }, // point 6
  { coord: {x: getPointCenterX(5),  y: BOTTOM_Y}, direction: -1 }, // point 7
  { coord: {x: getPointCenterX(4),  y: BOTTOM_Y}, direction: -1 }, // point 8
  { coord: {x: getPointCenterX(3),  y: BOTTOM_Y}, direction: -1 }, // point 9
  { coord: {x: getPointCenterX(2),  y: BOTTOM_Y}, direction: -1 }, // point 10
  { coord: {x: getPointCenterX(1),  y: BOTTOM_Y}, direction: -1 }, // point 11
  { coord: {x: getPointCenterX(0),  y: BOTTOM_Y}, direction: -1 }, // point 12
  // Point 13-24: top row, left to right
  { coord: {x: getPointCenterX(0), y: BOARD_BORDER_PX}, direction: 1 },
  { coord: {x: getPointCenterX(1), y: BOARD_BORDER_PX}, direction: 1 },
  { coord: {x: getPointCenterX(2), y: BOARD_BORDER_PX}, direction: 1 },
  { coord: {x: getPointCenterX(3), y: BOARD_BORDER_PX}, direction: 1 },
  { coord: {x: getPointCenterX(4), y: BOARD_BORDER_PX}, direction: 1 },
  { coord: {x: getPointCenterX(5), y: BOARD_BORDER_PX}, direction: 1 }, 
  { coord: {x: getPointCenterX(6), y: BOARD_BORDER_PX}, direction: 1 },
  { coord: {x: getPointCenterX(7), y: BOARD_BORDER_PX}, direction: 1 },
  { coord: {x: getPointCenterX(8), y: BOARD_BORDER_PX}, direction: 1 },
  { coord: {x: getPointCenterX(9), y: BOARD_BORDER_PX}, direction: 1 },
  { coord: {x: getPointCenterX(10), y: BOARD_BORDER_PX}, direction: 1 },
  { coord: {x: getPointCenterX(11), y: BOARD_BORDER_PX}, direction: 1 },
]

const E: PointState = { checker: null, count: 0 }

export const INITIAL_STATE: GameState = {
  // Standard backgammon opening layout.
  points: [
  { checker: 'red', count: 2 },   // [0] point 1
  E,
  E,
  E,
  E,
  { checker: 'white', count: 5 }, // [5] point 6
  E,
  { checker: 'white', count: 3 }, // [7] point 8
  E,
  E,
  E,
  { checker: 'red', count: 5 },   // [11] point 12
  { checker: 'white', count: 5 }, // [12] point 13
  E,
  E,
  E,
  { checker: 'red', count: 3 },   // [16] point 17
  E,
  { checker: 'red', count: 5 },   // [18] point 19
  E,
  E,
  E,
  E,
  { checker: 'white', count: 2 }, // [23] point 24
  ],

  bars: [
    E,
    E
  ],
}