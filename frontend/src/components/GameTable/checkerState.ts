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
