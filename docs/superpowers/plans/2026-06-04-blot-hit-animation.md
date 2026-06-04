# Blot-Hit Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play a blot hit as two chained animations — the attacker slides onto the point, then the hit blot slides to the bar — driven by a generic animation queue.

**Architecture:** Replace the single `animRef: AnimState | null` with a queue `animQueueRef: AnimState[]` where each step carries its own `onEnd` commit and an optional `hold` checker that the animation layer keeps drawing until the queue empties. A normal move becomes a 1-element queue; a blot hit a 2-element queue. The bar gets a real coordinate, vertical stacking, and rendering.

**Tech Stack:** React 19, `@pixi/react` v8, pixi.js v8, TypeScript, Vite, pnpm.

**Verification approach:** No test framework exists and this feature is visual. Each task ends with a typecheck/build (`make build`) and, where applicable, a described manual browser check (`make dev`).

---

## File Structure

- `frontend/src/game/state.ts` — add bar geometry/commit helpers; change the `AnimState` interface to carry `onEnd` + `hold`.
- `frontend/src/game/checker.ts` — render the two bar piles in `drawCheckers`.
- `frontend/src/components/BoardScene.tsx` — queue-based tick loop, held-checker rendering, normal-move flow, blot-hit flow.

---

## Task 1: Bar geometry & commit helpers (additive)

Purely additive — no existing code changes, so the build stays green.

**Files:**
- Modify: `frontend/src/game/state.ts`

- [ ] **Step 1: Add bar helpers**

Insert after the `getPoint` function (after line 88, before the commented-out `getBarCenterX` block). These reference constants already defined at the top of the file (`BOARD_BORDER_PX`, `QUARTER_POINT_NUM`, `POINT_WIDTH_PX`, `BAR_WIDTH_PX`, `PG_HEIGHT_PX`, `CHECKER_RADIUS_PX`).

```ts
export function getBarCenterX(): number {
  return BOARD_BORDER_PX + QUARTER_POINT_NUM * POINT_WIDTH_PX + BAR_WIDTH_PX / 2
}

export function barIndexForColor(color: CheckerColor): number {
  return color === 'white' ? 0 : 1
}

export function getBarCheckerY(color: CheckerColor, stackIndex: number): number {
  const centerY = BOARD_BORDER_PX + PG_HEIGHT_PX / 2
  const dir = color === 'white' ? 1 : -1
  return centerY + dir * (CHECKER_RADIUS_PX + stackIndex * 2 * CHECKER_RADIUS_PX)
}

export function addCheckerToBar(bars: PointState[], color: CheckerColor): PointState[] {
  const idx = barIndexForColor(color)
  const next = bars.map(b => ({ ...b }))
  next[idx] = { checker: color, count: next[idx].count + 1 }
  return next
}
```

Leave the existing commented-out `getBarCenterX` block as-is (pre-existing dead code).

- [ ] **Step 2: Typecheck/build**

Run: `make build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/game/state.ts
git commit -m "feat: add bar geometry and commit helpers"
```

---

## Task 2: Render the bar piles

**Files:**
- Modify: `frontend/src/game/checker.ts`

- [ ] **Step 1: Import bar helpers**

Add `getBarCenterX` and `getBarCheckerY` to the existing import from `../game/state` (currently `import { TOTAL_POINT_NUMBER, getPoint, getPointState } from '../game/state'`):

```ts
import {
  TOTAL_POINT_NUMBER,
  getPoint,
  getPointState,
  getBarCenterX,
  getBarCheckerY,
} from '../game/state'
```

- [ ] **Step 2: Draw both bar piles in `drawCheckers`**

Append this loop inside `drawCheckers`, after the existing points loop (after the `for (let pIdx ...)` block, before the function's closing brace):

```ts
    // Bar piles: bars[0] = white (stacks downward), bars[1] = red (stacks upward)
    for (let bIdx = 0; bIdx < gs.bars.length; bIdx++) {
      const bs = gs.bars[bIdx]
      if (bs.checker === null || bs.count === 0) continue
      const x = getBarCenterX()
      for (let sc = 0; sc < bs.count; sc++) {
        const y = getBarCheckerY(bs.checker, sc)
        drawChecker(gfx, newChecker({ x, y }, bs.checker, false))
      }
    }
```

- [ ] **Step 3: Typecheck/build**

Run: `make build`
Expected: build succeeds, no TypeScript errors. (Visual verification of the pile happens in Task 4, when a hit puts a checker on the bar — `bars` is empty until then.)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/game/checker.ts
git commit -m "feat: render bar piles in drawCheckers"
```

---

## Task 3: Queue-based tick loop + normal move

Changes the `AnimState` interface and rewrites the tick loop and the normal-move flow together, so the build stays green in one atomic commit.

**Files:**
- Modify: `frontend/src/game/state.ts:56-63` (the `AnimState` interface)
- Modify: `frontend/src/components/BoardScene.tsx`

- [ ] **Step 1: Replace the `AnimState` interface**

In `frontend/src/game/state.ts`, replace the current interface:

```ts
export interface AnimState {
  srcPoint: Coord
  destPoint: Coord
  srcPointIndex: PointIndex
  destPointIndex: PointIndex
  checker: CheckerColor
  t: number
}
```

with:

```ts
export interface AnimState {
  srcPoint: Coord
  destPoint: Coord
  checker: CheckerColor
  t: number
  onEnd: (gs: GameState) => GameState
  hold?: Checker
}
```

(`Checker` and `GameState` are already defined in this file. `PointIndex` is still used by `getPoint`/`getPointState`, so leave that type in place.)

- [ ] **Step 2: Update BoardScene imports**

In `frontend/src/components/BoardScene.tsx`, change the type import on line 4 to also import `Checker`:

```ts
import type { GameState, CheckerSelected, Checker } from '../game/state'
```

- [ ] **Step 3: Replace the animation refs**

Replace line 22 (`const animRef = useRef<AnimState | null>(null)`) with:

```ts
  const animQueueRef = useRef<AnimState[]>([])
  const heldRef = useRef<Checker[]>([])
```

- [ ] **Step 4: Rewrite the tick loop**

Replace the entire `useTick(...)` block (lines 26-62) with:

```ts
  // Animation tick -- runs every frame, advances the front of the queue
  useTick((ticker) => {
    const queue = animQueueRef.current
    const gfx = animGfxRef.current

    if (queue.length === 0 || !gfx) return

    const cur = queue[0]
    cur.t = Math.min(1, cur.t + ticker.deltaTime / ANIM_DURATION)
    const eased = cur.t * cur.t * (3 - 2 * cur.t)
    const x = cur.srcPoint.x + (cur.destPoint.x - cur.srcPoint.x) * eased
    const y = cur.srcPoint.y + (cur.destPoint.y - cur.srcPoint.y) * eased

    gfx.clear()

    // Held (arrived but uncommitted) checkers
    for (const h of heldRef.current) drawChecker(gfx, h)

    if (cur.t < 1) {
      drawChecker(gfx, newChecker({ x, y }, cur.checker, false))
    } else {
      // Commit this step, promote its hold, advance the queue
      setGameState(prev => cur.onEnd(prev))
      if (cur.hold) heldRef.current = [...heldRef.current, cur.hold]
      queue.shift()

      if (queue.length === 0) {
        heldRef.current = []
        setIsAnimating(false)
      }
    }
  })
```

- [ ] **Step 5: Convert the normal-move flow to a 1-element queue**

In `handleClick`, replace the `else` block (the `// Handle normal move` section, lines 88-106) with:

```ts
        } else {
          // Handle normal move (1-element queue)
          const pSrc = getPoint(prev)
          const pDest = getPoint(pIdx)
          const srcY = getCheckerY(pSrc, psSrc.count - 1, psSrc.count)
          const destY = getCheckerY(pDest, psDest.count, psDest.count + 1)
          const color = psSrc.checker
          const fromIdx = prev
          const toIdx = pIdx

          animQueueRef.current = [{
            srcPoint: { x: pSrc.coord.x, y: srcY },
            destPoint: { x: pDest.coord.x, y: destY },
            checker: color,
            t: 0,
            onEnd: (gs) => {
              const pss = gs.points.map(ps => ({ ...ps }))
              pss[fromIdx] = rmCheckerFromPoint(pss[fromIdx])
              pss[toIdx] = addCheckerToPoint(pss[toIdx], color)
              return { ...gs, points: pss }
            },
          }]

          setIsAnimating(true)
        }
```

- [ ] **Step 6: Typecheck/build**

Run: `make build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 7: Manual check — normal move still works**

Run: `make dev`, open the printed local URL. Click a point with checkers (e.g. point 1, the red stack), then click an empty point. Expected: the top checker animates over and lands; the stack updates. Confirms the queue refactor preserved existing behavior.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/game/state.ts frontend/src/components/BoardScene.tsx
git commit -m "refactor: drive animations through an AnimState queue"
```

---

## Task 4: Blot-hit two-step flow

**Files:**
- Modify: `frontend/src/components/BoardScene.tsx`

- [ ] **Step 1: Import bar helpers in BoardScene**

Add `getBarCenterX`, `getBarCheckerY`, `barIndexForColor`, and `addCheckerToBar` to the existing value import from `../game/state` (the block on lines 5-12). The resulting import:

```ts
import {
  INITIAL_STATE,
  getPoint,
  AnimState,
  rmCheckerFromPoint,
  addCheckerToPoint,
  ANIM_DURATION,
  getBarCenterX,
  getBarCheckerY,
  barIndexForColor,
  addCheckerToBar,
} from '../game/state'
```

- [ ] **Step 2: Implement the blot-hit branch**

In `handleClick`, replace the `if (isBlotHit) { ... console.log('hit') ... }` body with the two-step queue:

```ts
        if (isBlotHit) {
          // Blot hit: attacker -> point, then the blot -> bar
          const attacker = psSrc.checker
          const blot = psDest.checker
          const pSrc = getPoint(prev)
          const pDest = getPoint(pIdx)
          const srcY = getCheckerY(pSrc, psSrc.count - 1, psSrc.count)
          const loneY = getCheckerY(pDest, 0, 1)
          const barX = getBarCenterX()
          const barY = getBarCheckerY(blot, gameState.bars[barIndexForColor(blot)].count)
          const fromIdx = prev
          const toIdx = pIdx

          animQueueRef.current = [
            {
              // Step 1: attacker slides onto the blot point
              srcPoint: { x: pSrc.coord.x, y: srcY },
              destPoint: { x: pDest.coord.x, y: loneY },
              checker: attacker,
              t: 0,
              onEnd: (gs) => {
                const pss = gs.points.map(ps => ({ ...ps }))
                pss[toIdx] = { checker: null, count: 0 }
                return { ...gs, points: pss }
              },
              hold: newChecker({ x: pDest.coord.x, y: loneY }, attacker, false),
            },
            {
              // Step 2: the blot slides from the point to the bar
              srcPoint: { x: pDest.coord.x, y: loneY },
              destPoint: { x: barX, y: barY },
              checker: blot,
              t: 0,
              onEnd: (gs) => {
                const pss = gs.points.map(ps => ({ ...ps }))
                pss[fromIdx] = rmCheckerFromPoint(pss[fromIdx])
                pss[toIdx] = { checker: attacker, count: 1 }
                const bars = addCheckerToBar(gs.bars, blot)
                return { ...gs, points: pss, bars }
              },
            },
          ]

          setIsAnimating(true)
        } else {
```

(The `} else {` line continues into the existing normal-move block from Task 3 — do not duplicate it.)

- [ ] **Step 3: Typecheck/build**

Run: `make build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 4: Manual check — blot hit plays both animations**

Run: `make dev`, open the local URL, then perform this sequence to create and hit a blot:

1. Click **point 6** (the white stack, index 5), then click the **adjacent empty point 5** (index 4). One white checker animates over, leaving a white blot (count 1) on point 5.
2. Click **point 1** (the red stack, index 0), then click **point 5** (index 4, now the white blot).

Expected:
- The red attacker slides from point 1 onto point 5 and waits there.
- Then the white blot slides from point 5 to the bar and stops near the vertical center, on the **lower (white) half**.
- Point 5 ends showing one red checker; point 1 shows one red; one white checker sits on the bar.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/BoardScene.tsx
git commit -m "feat: animate blot hit as attacker-then-blot-to-bar"
```

---

## Self-Review

**Spec coverage:**
- Two chained animations (attacker→point, then blot→bar) — Task 4.
- Generic `AnimState[]` queue with per-step `onEnd` — Task 3 (interface) + Tasks 3/4 (usage).
- Held attacker drawn until the queue empties — Task 3 tick loop (`heldRef`) + Task 4 `hold`.
- Bar built properly (coordinate, stacking, rendering, committed state) — Task 1 (`getBarCenterX`/`getBarCheckerY`/`barIndexForColor`/`addCheckerToBar`) + Task 2 (rendering) + Task 4 (`addCheckerToBar` commit).
- Bar layout: split from center, white downward / red upward, `bars[0]=white`/`bars[1]=red` — Task 1.
- Normal move unified through the queue — Task 3.

**Placeholder scan:** No TBD/TODO; every code step shows complete code.

**Type consistency:** `getBarCenterX()`, `getBarCheckerY(color, stackIndex)`, `barIndexForColor(color)`, `addCheckerToBar(bars, color)`, `AnimState.onEnd: (gs) => GameState`, `AnimState.hold?: Checker`, `animQueueRef`, `heldRef` — names and signatures match across Tasks 1–4.
