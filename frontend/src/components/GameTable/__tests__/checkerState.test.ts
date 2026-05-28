import { describe, it, expect } from 'vitest'
import { INITIAL_STATE } from '../checkerState'

describe('INITIAL_STATE', () => {
  it('has 24 point entries', () => {
    expect(INITIAL_STATE.points).toHaveLength(24)
  })

  it('has 30 total checkers across all points', () => {
    const total = INITIAL_STATE.points.reduce((sum, pt) => sum + pt.count, 0)
    expect(total).toBe(30)
  })

  it('point 1 (index 0) has 2 red checkers', () => {
    expect(INITIAL_STATE.points[0]).toEqual({ color: 'red', count: 2 })
  })

  it('point 6 (index 5) has 5 white checkers', () => {
    expect(INITIAL_STATE.points[5]).toEqual({ color: 'white', count: 5 })
  })

  it('point 13 (index 12) has 5 white checkers', () => {
    expect(INITIAL_STATE.points[12]).toEqual({ color: 'white', count: 5 })
  })

  it('point 24 (index 23) has 2 white checkers', () => {
    expect(INITIAL_STATE.points[23]).toEqual({ color: 'white', count: 2 })
  })

  it('bar and bearOff start empty', () => {
    expect(INITIAL_STATE.bar).toEqual({ them: 0, you: 0 })
    expect(INITIAL_STATE.bearOff).toEqual({ them: 0, you: 0 })
  })
})
