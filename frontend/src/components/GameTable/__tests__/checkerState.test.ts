import { describe, it, expect } from 'vitest'
import { INITIAL_STATE, applyMove, applyBarHit, type GameState } from '../checkerState'

describe('applyMove', () => {
  it('normal move: decrements source, increments destination', () => {
    const gs: GameState = {
      ...INITIAL_STATE,
      points: INITIAL_STATE.points.map((p, i) =>
        i === 5 ? { color: 'white', count: 5 } :
        i === 4 ? { color: null, count: 0 } : p
      ),
    }
    const { nextState, hitColor } = applyMove(gs, 5, 4)
    expect(nextState.points[5]).toEqual({ color: 'white', count: 4 })
    expect(nextState.points[4]).toEqual({ color: 'white', count: 1 })
    expect(hitColor).toBeNull()
    expect(nextState.bar).toEqual(gs.bar)
  })

  it('stacks onto own-color checkers', () => {
    const gs: GameState = {
      ...INITIAL_STATE,
      points: INITIAL_STATE.points.map((p, i) =>
        i === 5 ? { color: 'white', count: 3 } :
        i === 4 ? { color: 'white', count: 2 } : p
      ),
    }
    const { nextState, hitColor } = applyMove(gs, 5, 4)
    expect(nextState.points[4]).toEqual({ color: 'white', count: 3 })
    expect(hitColor).toBeNull()
  })

  it('hit: overwrites blot and returns hitColor', () => {
    const gs: GameState = {
      ...INITIAL_STATE,
      points: INITIAL_STATE.points.map((p, i) =>
        i === 5 ? { color: 'white', count: 3 } :
        i === 4 ? { color: 'red', count: 1 } : p
      ),
    }
    const { nextState, hitColor } = applyMove(gs, 5, 4)
    expect(nextState.points[5]).toEqual({ color: 'white', count: 2 })
    expect(nextState.points[4]).toEqual({ color: 'white', count: 1 })
    expect(hitColor).toBe('red')
    // var not incremented here -- applyBarHit handles that
    expect(nextState.bar).toEqual(gs.bar)
  })

  it('no hit when landing on 2+ opponent checkers', () => {
    const gs: GameState = {
      ...INITIAL_STATE,
      points: INITIAL_STATE.points.map((p, i) =>
        i === 5 ? { color: 'white', count: 3 } :
        i === 4 ? { color: 'red',   count: 2 } : p
      ),
    }
    const { nextState, hitColor } = applyMove(gs, 5, 4)
    // Free-move: color overwritten, count incremented
    expect(nextState.points[4]).toEqual({ color: 'white', count: 3 })
    expect(hitColor).toBeNull()
  })
})

describe('applyBarHit', () => {
  it('increment bar.them for red', () => {
    const next = applyBarHit(INITIAL_STATE, 'red')
    expect(next.bar.them).toBe(1)
    expect(next.bar.you).toBe(0)
  })

  it('increment bar.them for white', () => {
    const next = applyBarHit(INITIAL_STATE, 'white')
    expect(next.bar.them).toBe(0)
    expect(next.bar.you).toBe(1)
  })

  it('accumulates multiple hits', () => {
    let gs = INITIAL_STATE
    gs = applyBarHit(gs, 'red')
    gs = applyBarHit(gs, 'red')
    gs = applyBarHit(gs, 'white')
    expect(gs.bar.them).toBe(2)
    expect(gs.bar.you).toBe(1)
  })
})

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
