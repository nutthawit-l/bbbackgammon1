export const CHECKER_R = 10
export const ANIM_DURATION = 20       // ticks (~0.33s at 60fps)
export const BAR_CX = 185             // bar strip center x in canvas coords
export const BAR_THEM_ANCHOR_Y = 152  // opponent hit checkers anchor y (stack upward)
export const BAR_YOU_ANCHOR_Y = 176   // your hit checkers anchor y (stack downward)

export interface PointLayout {
  cx: number      // center x in canvas coords
  anchorY: number // board edge y where checkers start stacking
  dir: 1 | -1     // 1 = stack downward (topp points 13-24), -1 = stack upward (bottom 1-12)
}

const colCx = (col: number): number =>
  10 + col * 27.65 + 13.83 + (col >= 6 ? 18 : 0)

// POINT_LAYOUT[i] = layout for point (i+1)
// Top row (left->right): 13,14,15,16,17,18 | bar | 19,20,21,22,23,24
// Bottom row (left->right): 12,11,10,9,8,7 | bar | 6,5,4,3,2,1
export const POINT_LAYOUT: PointLayout[] = [
  // Point 1-12: bottom row, right to left (col 11 -> col 0)
  { cx: colCx(11), anchorY: 318, dir: -1 }, // point 1
  { cx: colCx(10), anchorY: 318, dir: -1 }, // point 2
  { cx: colCx(9),  anchorY: 318, dir: -1 }, // point 3
  { cx: colCx(8),  anchorY: 318, dir: -1 }, // point 4
  { cx: colCx(7),  anchorY: 318, dir: -1 }, // point 5
  { cx: colCx(6),  anchorY: 318, dir: -1 }, // point 6
  { cx: colCx(5),  anchorY: 318, dir: -1 }, // point 7
  { cx: colCx(4),  anchorY: 318, dir: -1 }, // point 8
  { cx: colCx(3),  anchorY: 318, dir: -1 }, // point 9
  { cx: colCx(2),  anchorY: 318, dir: -1 }, // point 10
  { cx: colCx(1),  anchorY: 318, dir: -1 }, // point 11
  { cx: colCx(0),  anchorY: 318, dir: -1 }, // point 12
  // Points 13–24: top row, left to right (col 0 → col 11)
  { cx: colCx(0),  anchorY: 10, dir: 1 }, // point 13
  { cx: colCx(1),  anchorY: 10, dir: 1 }, // point 14
  { cx: colCx(2),  anchorY: 10, dir: 1 }, // point 15
  { cx: colCx(3),  anchorY: 10, dir: 1 }, // point 16
  { cx: colCx(4),  anchorY: 10, dir: 1 }, // point 17
  { cx: colCx(5),  anchorY: 10, dir: 1 }, // point 18
  { cx: colCx(6),  anchorY: 10, dir: 1 }, // point 19
  { cx: colCx(7),  anchorY: 10, dir: 1 }, // point 20
  { cx: colCx(8),  anchorY: 10, dir: 1 }, // point 21
  { cx: colCx(9),  anchorY: 10, dir: 1 }, // point 22
  { cx: colCx(10), anchorY: 10, dir: 1 }, // point 23
  { cx: colCx(11), anchorY: 10, dir: 1 }, // point 24
]

export function checkerY(pointIdx: number, stackPos: number): number {
  const { anchorY, dir } = POINT_LAYOUT[pointIdx]
  return anchorY + dir * (CHECKER_R + stackPos * CHECKER_R * 2)
}
