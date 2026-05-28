# Checker Hit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a checker lands on a point with exactly one opponent checker (a blot), that checker is hit and sent to the center bar with a sequential two-phase animation.

**Architecture:** Add two pure helpers (`applyMove`, `applyBarHit`) to `checkerState.ts` for testable state logic. Extend `AnimState` in `BoardScene.tsx` with two optional fields (`hitColor`, `isBarFly`) and replace the single commit branch in `useTick` with three cases: normal move, main-move-with-hit (starts phase 2), and bar-fly-complete (increments bar count).

**Tech Stack:** TypeScript, React, PixiJS (`@pixi/react`), Vitest

---

### Task 1: Add `applyMove` and `applyBarHit` to `checkerState.ts`

**Files:**
- Modify: `frontend/src/components/GameTable/checkerState.ts`
- Test: `frontend/src/components/GameTable/__tests__/checkerState.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `frontend/src/components/GameTable/__tests__/checkerState.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { INITIAL_STATE, applyMove, applyBarHit, type GameState } from '../checkerState'

describe('applyMove', () => {
  it('normal move: decrements source, increments destination', () => {
    const gs: GameState = {
      ...INITIAL_STATE,
      points: INITIAL_STATE.points.map((p, i) =>
        i === 5 ? { color: 'white', count: 5 } :
        i === 4 ? { color: null,  count: 0 } : p
      ),
    }
    const { nextState, hitColor } = applyMove(gs, 5, 4)
    expect(nextState.points[5]).toEqual({ color: 'white', count: 4 })
    expect(nextState.points[4]).toEqual({ color: 'white', count: 1 })
    expect(hitColor).toBeNull()
    expect(nextState.bar).toEqual(gs.bar)
  })

  it('clears source point when last checker moves', () => {
    const gs: GameState = {
      ...INITIAL_STATE,
      points: INITIAL_STATE.points.map((p, i) =>
        i === 5 ? { color: 'white', count: 1 } :
        i === 4 ? { color: null,  count: 0 } : p
      ),
    }
    const { nextState, hitColor } = applyMove(gs, 5, 4)
    expect(nextState.points[5]).toEqual({ color: null, count: 0 })
    expect(nextState.points[4]).toEqual({ color: 'white', count: 1 })
    expect(hitColor).toBeNull()
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
        i === 4 ? { color: 'red',   count: 1 } : p
      ),
    }
    const { nextState, hitColor } = applyMove(gs, 5, 4)
    expect(nextState.points[5]).toEqual({ color: 'white', count: 2 })
    expect(nextState.points[4]).toEqual({ color: 'white', count: 1 })
    expect(hitColor).toBe('red')
    // bar not incremented here — applyBarHit handles that
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
  it('increments bar.them for red', () => {
    const next = applyBarHit(INITIAL_STATE, 'red')
    expect(next.bar.them).toBe(1)
    expect(next.bar.you).toBe(0)
  })

  it('increments bar.you for white', () => {
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/tie/Projects/bbbackgammon1/frontend && pnpm test -- --reporter=verbose checkerState
```

Expected: new `applyMove` and `applyBarHit` describe blocks fail with `is not a function`.

- [ ] **Step 3: Implement the two helpers in `checkerState.ts`**

Append to the bottom of `frontend/src/components/GameTable/checkerState.ts`:

```ts
export function applyMove(
  gs: GameState,
  fromIdx: number,
  toIdx: number,
): { nextState: GameState; hitColor: CheckerColor | null } {
  const pts = gs.points.map(p => ({ ...p }))
  const src = pts[fromIdx]

  pts[fromIdx] = src.count === 1
    ? { color: null, count: 0 }
    : { color: src.color, count: src.count - 1 }

  const dst = pts[toIdx]
  const hitColor: CheckerColor | null =
    dst.color !== null && dst.color !== src.color && dst.count === 1
      ? dst.color
      : null

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
      them: gs.bar.them + (hitColor === 'red'   ? 1 : 0),
      you:  gs.bar.you  + (hitColor === 'white' ? 1 : 0),
    },
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/tie/Projects/bbbackgammon1/frontend && pnpm test -- --reporter=verbose checkerState
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/tie/Projects/bbbackgammon1
git add frontend/src/components/GameTable/checkerState.ts \
        frontend/src/components/GameTable/__tests__/checkerState.test.ts
git commit -m "feat: add applyMove and applyBarHit pure state helpers"
```

---

### Task 2: Extend `AnimState`, import helpers, update `handleClick`

**Files:**
- Modify: `frontend/src/components/GameTable/BoardScene.tsx`

- [ ] **Step 1: Add `hitColor` and `isBarFly` to `AnimState`**

In `BoardScene.tsx`, replace the `AnimState` interface (lines 12–23):

```ts
// Before:
interface AnimState {
  fromX: number; fromY: number
  toX: number; toY: number
  color: CheckerColor
  fromPoint: number; toPoint: number
  t: number
}

// After:
interface AnimState {
  fromX: number; fromY: number
  toX: number; toY: number
  color: CheckerColor
  fromPoint: number; toPoint: number
  t: number
  hitColor?: CheckerColor  // set when destination is a blot
  isBarFly?: true           // set when this is the hit checker flying to the bar
}
```

- [ ] **Step 2: Update the `checkerState` import to include the new helpers**

In `BoardScene.tsx`, replace the import from `./checkerState` (line 8):

```ts
// Before:
import { INITIAL_STATE, type GameState, type CheckerColor } from './checkerState'

// After:
import { INITIAL_STATE, type GameState, type CheckerColor, applyMove, applyBarHit } from './checkerState'
```

- [ ] **Step 3: Detect hits in `handleClick`**

In `handleClick`, find the `animRef.current = { ... }` assignment (around line 175). Replace it:

```ts
// Before:
animRef.current = {
  fromX: from.cx, fromY,
  toX: to.cx, toY,
  color: fromPt.color!,
  fromPoint: prev, toPoint: pointIdx,
  t: 0,
}

// After:
const destPt = gameState.points[pointIdx]
const moverColor = fromPt.color!
const isHit =
  destPt.color !== null &&
  destPt.color !== moverColor &&
  destPt.count === 1
animRef.current = {
  fromX: from.cx, fromY,
  toX: to.cx, toY,
  color: moverColor,
  fromPoint: prev, toPoint: pointIdx,
  t: 0,
  hitColor: isHit ? destPt.color : undefined,
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /home/tie/Projects/bbbackgammon1/frontend && pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
cd /home/tie/Projects/bbbackgammon1
git add frontend/src/components/GameTable/BoardScene.tsx
git commit -m "feat: extend AnimState for hit mechanic, detect blot in handleClick"
```

---

### Task 3: Two-phase commit in `useTick`

**Files:**
- Modify: `frontend/src/components/GameTable/BoardScene.tsx`

- [ ] **Step 1: Replace the commit `else` branch in `useTick`**

In `BoardScene.tsx`, find the block starting with `if (anim.t < 1) {` (around line 136). Replace the entire `else` branch (from `} else {` through `setIsAnimating(false)` and the closing `}`):

```ts
// Before:
} else {
  // Commit move to state
  setGameState(gs => {
    const pts = gs.points.map(p => ({ ...p }))
    const from = pts[anim.fromPoint]
    pts[anim.fromPoint] = { ...from, count: from.count - 1 }
    if (pts[anim.fromPoint].count === 0) pts[anim.fromPoint] = { color: null, count: 0 }
    const to = pts[anim.toPoint]
    pts[anim.toPoint] = { color: anim.color, count: to.count + 1 }
    return { ...gs, points: pts }
  })
  animRef.current = null
  setIsAnimating(false)
}

// After:
} else if (anim.isBarFly) {
  // Phase 2 complete: hit checker reached bar — increment bar count.
  setGameState(gs => applyBarHit(gs, anim.color))
  animRef.current = null
  setIsAnimating(false)
} else {
  // Phase 1 complete: commit the move.
  setGameState(gs => applyMove(gs, anim.fromPoint, anim.toPoint).nextState)

  if (anim.hitColor) {
    // Start phase 2: animate the hit checker from the destination point to the bar.
    const barCount = anim.hitColor === 'red' ? gameState.bar.them : gameState.bar.you
    const dir    = anim.hitColor === 'red' ? -1 : 1
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
      isBarFly: true,
    }
    // isAnimating stays true — phase 2 continues
  } else {
    animRef.current = null
    setIsAnimating(false)
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/tie/Projects/bbbackgammon1/frontend && pnpm tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Run all tests**

```bash
cd /home/tie/Projects/bbbackgammon1/frontend && pnpm test
```

Expected: all tests pass (no regressions).

- [ ] **Step 4: Smoke-test in browser**

```bash
cd /home/tie/Projects/bbbackgammon1/frontend && pnpm dev
```

Open the browser and verify:

1. Move a white checker onto a point with a **single red checker** → white lands on that point, then the red checker animates from that point to the bar's "Them" zone.
2. Move a red checker onto a point with a **single white checker** → white checker animates to the bar's "You" zone.
3. Make two consecutive hits → bar accumulates 2 checkers in the correct zone, stacked.
4. Move onto a point with **0 checkers** → no hit, normal move.
5. Move onto a point with **2+ own-color checkers** → stack grows, no hit animation.
6. Click during either phase of animation → ignored.

- [ ] **Step 5: Commit**

```bash
cd /home/tie/Projects/bbbackgammon1
git add frontend/src/components/GameTable/BoardScene.tsx
git commit -m "feat: implement checker hit with sequential bar-fly animation"
```
