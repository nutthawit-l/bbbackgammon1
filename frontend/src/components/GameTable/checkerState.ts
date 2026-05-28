export type CheckerColor = 'red' | 'white'

export interface PointState {
  // null means this point is empty.
  color: CheckerColor | null
  // Number of checkers currently on this point.
  count: number
}

// them = opponent (red), you = local player (white)
export interface SpecialZoneState {
  them: number
  you: number
}

export interface GameState {
  // 24 board points where index 0 = point 1 ... index 23 = point 24.
  points: PointState[]
  // Captured checkers waiting to re-enter.
  bar: SpecialZoneState
  // Checkers already borne off the board.
  bearOff: SpecialZoneState
}

// Shared immutable "empty point" object.
const E: PointState = { color: null, count: 0 }

export const INITIAL_STATE: GameState = {
  // Standard backgammon opening layout.
  points: [
    { color: 'red', count: 2 },   // [0] point 1
    E,
    E,
    E,
    E,
    { color: 'white', count: 5 }, // [5] point 6
    E,
    { color: 'white', count: 3 }, // [7] point 8
    E,
    E,
    E,
    { color: 'red', count: 5 },   // [11] point 12
    { color: 'white', count: 5 }, // [12] point 13
    E,
    E,
    E,
    { color: 'red', count: 3 },   // [16] point 17
    E,
    { color: 'red', count: 5 },   // [18] point 19
    E,
    E,
    E,
    E,
    { color: 'white', count: 2 }, // [23] point 24
  ],
  bar: { them: 0, you: 0 },
  bearOff: { them: 0, you: 0 },
}

export function applyMove(
  gs: GameState,
  fromIdx: number,
  toIdx: number,
): { nextState: GameState; hitColor: CheckerColor | null } {
  const pts = gs.points.map(p => ({ ...p }))
  const src = pts[fromIdx]

  // Move checker away from point (triangle)
  pts[fromIdx] = src.count === 1
    ? { color: null, count: 0 }
    : { color: src.color, count: src.count - 1 }

  // Define what color was hit red or white
  const dst = pts[toIdx]
  const hitColor: CheckerColor | null =
    dst.color !== null && dst.color !== src.color && dst.count === 1
      ? dst.color
      : null

  // Set destination point (triangle)
  // If opponent checker was hit, that point will be my checker instead
  // If not hit, it just increment the checker number and all original checkers
  // will be transfer to color of new one
  pts[toIdx] = {
    color: src.color!,
    count: hitColor !== null ? 1 : dst.count + 1,
  }

  return { nextState: { ...gs, points: pts }, hitColor }
}

export function applyBarHit(gs: GameState, hitColor: CheckerColor): GameState {
  return {
    ...gs,
    bar: {
      them: gs.bar.them + (hitColor === 'red' ? 1 : 0),
      you: gs.bar.you + (hitColor === 'white' ? 1 : 0),
    },
  }
}
