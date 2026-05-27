import { describe, it, expect } from 'vitest'
import { POINT_LAYOUT, checkerY, BAR_CX, BAR_THEM_ANCHOR_Y, BAR_YOU_ANCHOR_Y } from '../boardLayout'

describe('POINT_LAYOUT', () => {
  it('has 24 entries', () => {
    expect(POINT_LAYOUT).toHaveLength(24)
  })

  it('point 1 (index 0) is bottom-right, stacks upward', () => {
    expect(POINT_LAYOUT[0].dir).toBe(-1)
    expect(POINT_LAYOUT[0].anchorY).toBe(318)
    // rightmost bottom column (col 11): cx = 10 + 11*27.65 + 13.83 + 18 = 345.98
    expect(POINT_LAYOUT[0].cx).toBeCloseTo(345.98, 1)
  })

  it('point 13 (index 12) is top-left, stacks downward', () => {
    expect(POINT_LAYOUT[12].dir).toBe(1)
    expect(POINT_LAYOUT[12].anchorY).toBe(10)
    // leftmost top column (col 0): cx = 10 + 0 + 13.83 = 23.83
    expect(POINT_LAYOUT[12].cx).toBeCloseTo(23.83, 1)
  })

  it('point 24 (index 23) is top-right, stacks downward', () => {
    expect(POINT_LAYOUT[23].dir).toBe(1)
    expect(POINT_LAYOUT[23].anchorY).toBe(10)
    expect(POINT_LAYOUT[23].cx).toBeCloseTo(345.98, 1)
  })
})

describe('checkerY', () => {
  it('first checker on top point stacks at anchorY + CHECKER_R', () => {
    // point 13 (index 12), stackPos=0: 10 + 1*(10+0) = 20
    expect(checkerY(12, 0)).toBe(20)
  })

  it('second checker on top point is 2*CHECKER_R below first', () => {
    expect(checkerY(12, 1)).toBe(40)
  })

  it('first checker on bottom point stacks at anchorY - CHECKER_R', () => {
    // point 1 (index 0), stackPos=0: 318 + (-1)*(10+0) = 308
    expect(checkerY(0, 0)).toBe(308)
  })

  it('second checker on bottom point is 2*CHECKER_R above first', () => {
    expect(checkerY(0, 1)).toBe(288)
  })
})

describe('bar constants', () => {
  it('BAR_CX is midpoint of bar strip', () => {
    expect(BAR_CX).toBe(185)
  })

  it('BAR_THEM_ANCHOR_Y is above gap center', () => {
    expect(BAR_THEM_ANCHOR_Y).toBeLessThan(164)
  })

  it('BAR_YOU_ANCHOR_Y is below gap center', () => {
    expect(BAR_YOU_ANCHOR_Y).toBeGreaterThan(164)
  })
})
