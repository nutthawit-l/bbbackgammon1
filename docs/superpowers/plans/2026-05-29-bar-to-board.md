# Bar-to-Board Re-entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable players to click a bar checker to select it, then click a board point to animate the checker from the bar onto the board.

**Architecture:** Extend `checkerState.ts` with `applyBarEntry`, then update `BoardScene.tsx` — widen the `selected` type to include bar sentinels, add `handleBarClick`, extend `handleClick` and the tick handler to handle bar-entry, extend `drawCheckers` for selection highlight, and add two invisible bar hit areas to the JSX.

**Tech Stack:** React, Pixi.js (`@pixi/react`), TypeScript, Vitest

---

## File Map

| File | Change |
|---|---|
| `frontend/src/components/GameTable/checkerState.ts` | Add `applyBarEntry` export |
| `frontend/src/components/GameTable/__tests__/checkerState.test.ts` | Add tests for `applyBarEntry` |
| `frontend/src/components/GameTable/BoardScene.tsx` | Extend `Selected` type, `drawCheckers`, `handleBarClick`, `handleClick`, tick handler, JSX |

---

## Task 1: `applyBarEntry` state helper (TDD)

**Files:**
- Modify: `frontend/src/components/GameTable/__tests__/checkerState.test.ts`
- Modify: `frontend/src/components/GameTable/checkerState.ts`

- [ ] **Step 1: Add failing tests**

Append to `frontend/src/components/GameTable/__tests__/checkerState.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { INITIAL_STATE, applyMove, applyBarHit, applyBarEntry, type GameState } from '../checkerState'
```

Replace the existing import line (only the import line — add `applyBarEntry`), then append at the bottom of the file:

```ts
describe('applyBarEntry', () => {
  it('decrements bar.you when white enters an empty point', () => {
    const gs: GameState = {
      ...INITIAL_STATE,
      bar: { them: 0, you: 2 },
      points: INITIAL_STATE.points.map((p, i) => i === 3 ? { color: null, count: 0 } : p),
    }
    const { nextState, hitColor } = applyBarEntry(gs, 'white', 3)
    expect(nextState.bar.you).toBe(1)
    expect(nextState.bar.them).toBe(0)
    expect(nextState.points[3]).toEqual({ color: 'white', count: 1 })
    expect(hitColor).toBeNull()
  })

  it('decrements bar.them when red enters an empty point', () => {
    const gs: GameState = {
      ...INITIAL_STATE,
      bar: { them: 2, you: 0 },
      points: INITIAL_STATE.points.map((p, i) => i === 20 ? { color: null, count: 0 } : p),
    }
    const { nextState, hitColor } = applyBarEntry(gs, 'red', 20)
    expect(nextState.bar.them).toBe(1)
    expect(nextState.bar.you).toBe(0)
    expect(nextState.points[20]).toEqual({ color: 'red', count: 1 })
    expect(hitColor).toBeNull()
  })

  it('stacks onto own-color checkers', () => {
    const gs: GameState = {
      ...INITIAL_STATE,
      bar: { them: 0, you: 1 },
      points: INITIAL_STATE.points.map((p, i) => i === 3 ? { color: 'white', count: 2 } : p),
    }
    const { nextState, hitColor } = applyBarEntry(gs, 'white', 3)
    expect(nextState.points[3]).toEqual({ color: 'white', count: 3 })
    expect(hitColor).toBeNull()
  })

  it('hits an opponent blot and returns hitColor', () => {
    const gs: GameState = {
      ...INITIAL_STATE,
      bar: { them: 0, you: 1 },
      points: INITIAL_STATE.points.map((p, i) => i === 3 ? { color: 'red', count: 1 } : p),
    }
    const { nextState, hitColor } = applyBarEntry(gs, 'white', 3)
    expect(nextState.points[3]).toEqual({ color: 'white', count: 1 })
    expect(hitColor).toBe('red')
    expect(nextState.bar.you).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --prefix frontend test -- --reporter=verbose 2>&1 | grep -A3 'applyBarEntry'
```

Expected: `applyBarEntry` is not a function / not exported — 4 tests fail.

- [ ] **Step 3: Implement `applyBarEntry` in `checkerState.ts`**

Append to `frontend/src/components/GameTable/checkerState.ts` (after `applyBarHit`):

```ts
export function applyBarEntry(
  gs: GameState,
  color: CheckerColor,
  toIdx: number,
): { nextState: GameState; hitColor: CheckerColor | null } {
  const pts = gs.points.map(p => ({ ...p }))
  const dst = pts[toIdx]
  const hitColor: CheckerColor | null =
    dst.color !== null && dst.color !== color && dst.count === 1
      ? dst.color
      : null
  pts[toIdx] = {
    color,
    count: hitColor !== null ? 1 : dst.count + 1,
  }
  return {
    nextState: {
      ...gs,
      bar: {
        them: gs.bar.them - (color === 'red' ? 1 : 0),
        you:  gs.bar.you  - (color === 'white' ? 1 : 0),
      },
      points: pts,
    },
    hitColor,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --prefix frontend test -- --reporter=verbose 2>&1 | grep -A3 'applyBarEntry'
```

Expected: 4 tests pass under `applyBarEntry`.

- [ ] **Step 5: Commit**

```bash
cd /path/to/bbbackgammon1
git add frontend/src/components/GameTable/checkerState.ts \
        frontend/src/components/GameTable/__tests__/checkerState.test.ts
git commit -m "feat: add applyBarEntry state helper"
```

---

## Task 2: Update `BoardScene.tsx`

**Files:**
- Modify: `frontend/src/components/GameTable/BoardScene.tsx`

### Step 1 — Update import and add `Selected` type

- [ ] **Step 1a: Add `applyBarEntry` to the import**

In `BoardScene.tsx`, change the `checkerState` import line from:

```ts
import {
  INITIAL_STATE, type GameState, type CheckerColor, applyMove, applyBarHit
} from './checkerState'
```

to:

```ts
import {
  INITIAL_STATE, type GameState, type CheckerColor, applyMove, applyBarHit, applyBarEntry
} from './checkerState'
```

- [ ] **Step 1b: Add `Selected` type and update `useState`**

After the `AnimState` interface (around line 29), add:

```ts
type Selected = number | 'bar-you' | 'bar-them' | null
```

Then in the component, change:

```ts
const [selected, setSelected] = useState<number | null>(null)
```

to:

```ts
const [selected, setSelected] = useState<Selected>(null)
```

- [ ] **Step 1c: Update `drawCheckers` signature**

Change the function signature from:

```ts
function drawCheckers(
  g: Graphics,
  gameState: GameState,
  selected: number | null,
  animFromPoint: number | null,
) {
```

to:

```ts
function drawCheckers(
  g: Graphics,
  gameState: GameState,
  selected: Selected,
  animFromPoint: number | null,
) {
```

- [ ] **Step 1d: Extend bar checker rendering to support highlight**

In `drawCheckers`, replace the two bar-rendering loops:

```ts
  // Bar checkers are rendered in the center strip.
  for (let s = 0; s < gameState.bar.them; s++) {
    drawChecker(g, BAR_CX, BAR_THEM_ANCHOR_Y + (-1) * s * CHECKER_R * 2, 'red')
  }
  for (let s = 0; s < gameState.bar.you; s++) {
    drawChecker(g, BAR_CX, BAR_YOU_ANCHOR_Y + s * CHECKER_R * 2, 'white')
  }
```

with:

```ts
  // Bar checkers are rendered in the center strip.
  for (let s = 0; s < gameState.bar.them; s++) {
    const isTop = s === gameState.bar.them - 1
    drawChecker(g, BAR_CX, BAR_THEM_ANCHOR_Y + (-1) * s * CHECKER_R * 2, 'red', isTop && selected === 'bar-them')
  }
  for (let s = 0; s < gameState.bar.you; s++) {
    const isTop = s === gameState.bar.you - 1
    drawChecker(g, BAR_CX, BAR_YOU_ANCHOR_Y + s * CHECKER_R * 2, 'white', isTop && selected === 'bar-you')
  }
```

- [ ] **Step 2: Add `handleBarClick`**

After the `handleClick` definition (around line 214), add:

```ts
  const handleBarClick = useCallback((color: CheckerColor) => {
    if (animRef.current) return
    const barCount = color === 'red' ? gameState.bar.them : gameState.bar.you
    if (barCount === 0) return
    const sentinel: Selected = color === 'red' ? 'bar-them' : 'bar-you'
    setSelected(prev => prev === sentinel ? null : sentinel)
  }, [gameState])
```

- [ ] **Step 3: Extend `handleClick` with bar-entry branch**

Inside `handleClick`, at the very top of the `setSelected(prev => { ... })` callback — before `if (prev === null)` — insert:

```ts
      // Bar-entry: animate the selected bar checker to the clicked point.
      if (prev === 'bar-you' || prev === 'bar-them') {
        const color: CheckerColor = prev === 'bar-you' ? 'white' : 'red'
        const barCount = prev === 'bar-you' ? gameState.bar.you : gameState.bar.them
        const anchor = prev === 'bar-you' ? BAR_YOU_ANCHOR_Y : BAR_THEM_ANCHOR_Y
        const dir = prev === 'bar-you' ? 1 : -1
        const fromY = anchor + dir * (barCount - 1) * CHECKER_R * 2
        const to = POINT_LAYOUT[pointIdx]
        const toStackPos = Math.min((gameState.points[pointIdx]?.count ?? 0), MAX_STACK - 1)
        const toY = checkerY(pointIdx, toStackPos)
        const destPt = gameState.points[pointIdx]
        const isHit = destPt.color !== null && destPt.color !== color && destPt.count === 1
        animRef.current = {
          fromX: BAR_CX, fromY,
          toX: to.cx, toY,
          color,
          fromPoint: -1, toPoint: pointIdx,
          t: 0,
          hitColor: isHit ? destPt.color : null,
        }
        setIsAnimating(true)
        return null
      }
```

- [ ] **Step 4: Extend tick handler to dispatch bar-entry commit**

In `useTick`, in the `else` branch (the animation-complete path), change:

```ts
    } else {
      // Commit move to state
      setGameState(gs => applyMove(gs, anim.fromPoint, anim.toPoint).nextState)
```

to:

```ts
    } else {
      // Commit move — bar-entry (fromPoint === -1) or point-to-point.
      setGameState(gs => anim.fromPoint === -1
        ? applyBarEntry(gs, anim.color, anim.toPoint).nextState
        : applyMove(gs, anim.fromPoint, anim.toPoint).nextState
      )
```

- [ ] **Step 5: Add bar hit areas to JSX**

In the JSX return, after the `hitDrawCallbacks.map(...)` block and before the animated checker layer, add:

```tsx
      {/* Bar hit areas — top half for red, bottom half for white. */}
      <pixiGraphics
        draw={(g) => { g.clear(); g.rect(176, 10, 18, 154).fill({ color: 0, alpha: 0.001 }) }}
        eventMode="static"
        cursor="pointer"
        onPointerDown={() => handleBarClick('red')}
      />
      <pixiGraphics
        draw={(g) => { g.clear(); g.rect(176, 164, 18, 154).fill({ color: 0, alpha: 0.001 }) }}
        eventMode="static"
        cursor="pointer"
        onPointerDown={() => handleBarClick('white')}
      />
```

- [ ] **Step 6: Verify no TypeScript errors**

```bash
pnpm --prefix frontend build 2>&1 | tail -20
```

Expected: build succeeds with no type errors.

- [ ] **Step 7: Run all tests to confirm no regressions**

```bash
pnpm --prefix frontend test
```

Expected: all existing tests pass.

- [ ] **Step 8: Commit**

```bash
cd /path/to/bbbackgammon1
git add frontend/src/components/GameTable/BoardScene.tsx
git commit -m "feat: bar-to-board re-entry — click bar checker then click destination point"
```

---

## Manual Smoke Test

After both tasks are complete, run `make dev` and verify:

1. Hit a checker to get it on the bar.
2. Click the bar checker — it shows a highlight ring.
3. Click the same bar area again — deselects (highlight gone).
4. Click the bar checker again, then click a board point — checker animates from bar to the point.
5. If the destination is a blot, the hit checker animates to the bar in turn.
6. Repeat with the other color.
