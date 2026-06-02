// Board
export const BOARD_CONTAINER_WIDTH_PX = 389
export const BOARD_CONTAINER_HEIGHT_PX = 328
export const BOARD_BORDER_PX = 10
export const BAR_WIDTH_PX = 18
export const TRIANGLE_WIDTH_PX = 27.65
export const TRIANGLE_HEIGHT_PX = 114

// Checker
export const TOTAL_CHECKER_NUMBER = 24
export const CHECKER_RADIUS_PX = 10

export type Checker = 'red' | 'white' | null

export interface PointState {
  // Indicate this point have checkers or empty.
  checker: Checker
  // Number of checkers currently on this point.
  count: number
}

export function isPointEmpty(ps: PointState): boolean {
  return ps.checker === null || ps.count === 0;
}

export interface GameState {
  // 24 points (triangles) where index 0 = point 1 ... index 23 = point 24.
  points: PointState[]
}

export function getPointState(gs: GameState, idx: number): PointState {
  return gs.points[idx]
}

export interface Point {
  // Center x coordinates for each point in canvas
  x: number 
  // Board border y where checkers start stacking
  y: number
  // direction of stacking along Y axis:
  // -1 -> grown upward use for bottom points (1..12)
  // 1 -> grown downward use for top points (13..24)
  direction: -1 | 1
}

const BOTTOM_Y = BOARD_CONTAINER_HEIGHT_PX - BOARD_BORDER_PX

export const POINTS: Point[] = [
  // Point 1-12: bottom row, right to left
  { x: getTriangleCenterX(11), y: BOTTOM_Y, direction: -1 }, // point 1
  { x: getTriangleCenterX(10), y: BOTTOM_Y, direction: -1 }, // point 2
  { x: getTriangleCenterX(9),  y: BOTTOM_Y, direction: -1 }, // point 3
  { x: getTriangleCenterX(8),  y: BOTTOM_Y, direction: -1 }, // point 4
  { x: getTriangleCenterX(7),  y: BOTTOM_Y, direction: -1 }, // point 5
  { x: getTriangleCenterX(6),  y: BOTTOM_Y, direction: -1 }, // point 6
  { x: getTriangleCenterX(5),  y: BOTTOM_Y, direction: -1 }, // point 7
  { x: getTriangleCenterX(4),  y: BOTTOM_Y, direction: -1 }, // point 8
  { x: getTriangleCenterX(3),  y: BOTTOM_Y, direction: -1 }, // point 9
  { x: getTriangleCenterX(2),  y: BOTTOM_Y, direction: -1 }, // point 10
  { x: getTriangleCenterX(1),  y: BOTTOM_Y, direction: -1 }, // point 11
  { x: getTriangleCenterX(0),  y: BOTTOM_Y, direction: -1 }, // point 12
  // Point 13-24: top row, left to right
  { x: getTriangleCenterX(0), y: BOARD_BORDER_PX, direction: 1 }, // point 13
  { x: getTriangleCenterX(1), y: BOARD_BORDER_PX, direction: 1 }, // point 14
  { x: getTriangleCenterX(2), y: BOARD_BORDER_PX, direction: 1 }, // point 15
  { x: getTriangleCenterX(3), y: BOARD_BORDER_PX, direction: 1 }, // point 16
  { x: getTriangleCenterX(4), y: BOARD_BORDER_PX, direction: 1 }, // point 17
  { x: getTriangleCenterX(5), y: BOARD_BORDER_PX, direction: 1 }, // point 18
  { x: getTriangleCenterX(6), y: BOARD_BORDER_PX, direction: 1 }, // point 19
  { x: getTriangleCenterX(7), y: BOARD_BORDER_PX, direction: 1 }, // point 20
  { x: getTriangleCenterX(8), y: BOARD_BORDER_PX, direction: 1 }, // point 21
  { x: getTriangleCenterX(9), y: BOARD_BORDER_PX, direction: 1 }, // point 22
  { x: getTriangleCenterX(10), y: BOARD_BORDER_PX, direction: 1 }, // point 23
  { x: getTriangleCenterX(11), y: BOARD_BORDER_PX, direction: 1 }, // point 24
]

export function getPoint(idx: number): Point {
  return POINTS[idx]
}

// Returns the canvas Y coordinate for a checker at the given stack position on a point.
export function getCheckerY(p: Point, stackCount: number): number {
  const checkerDiameter = CHECKER_RADIUS_PX * 2
  return p.y + p.direction * (CHECKER_RADIUS_PX + stackCount * checkerDiameter)
}

function getTriangleCenterX(column: number): number {
  const shiftPx = column >= (TOTAL_CHECKER_NUMBER / 4) ? BAR_WIDTH_PX : 0
  const triangleCenter = TRIANGLE_WIDTH_PX / 2
  return column * TRIANGLE_WIDTH_PX + triangleCenter + BOARD_BORDER_PX + shiftPx
}

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
  ]
}