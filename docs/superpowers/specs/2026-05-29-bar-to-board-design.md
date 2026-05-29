# Bar-to-Board Re-entry Design

**Date:** 2026-05-29  
**Scope:** `BoardScene.tsx`, `checkerState.ts`

## Overview

Enable players to move a checker from the center bar back onto the board by clicking the bar checker to select it, then clicking a destination point.

Dice-free (consistent with the current prototype). Both red and white checkers are supported.

---

## 1. Types & State

### `selected` type extension

```ts
// Before
const [selected, setSelected] = useState<number | null>(null)

// After
type Selected = number | 'bar-you' | 'bar-them' | null
const [selected, setSelected] = useState<Selected>(null)
```

No other state is added.

### New state helper — `applyBarEntry`

Added to `checkerState.ts`:

```ts
export function applyBarEntry(
  gs: GameState,
  color: CheckerColor,
  toIdx: number,
): { nextState: GameState; hitColor: CheckerColor | null }
```

- Decrements `bar.you` (white) or `bar.them` (red) by 1.
- Lands the checker on `points[toIdx]` using the same blot-hit logic as `applyMove` — returns `hitColor` when landing on an opponent blot.
- Returns `{ nextState, hitColor }` to match the existing `applyMove` signature so the hit animation chain is reused unchanged.

---

## 2. Hit Areas & Interaction

Two invisible rectangles are rendered over the bar strip (board x 176–194):

| Hit area | Y range | Handler |
|---|---|---|
| Top half | 10–164 | `handleBarClick('red')` |
| Bottom half | 164–318 | `handleBarClick('white')` |

### `handleBarClick(color: CheckerColor)`

1. If `bar[color === 'red' ? 'them' : 'you'] === 0` → do nothing.
2. If already selected (`selected === 'bar-them'` / `'bar-you'`) → deselect (`null`).
3. Otherwise → set `selected` to `'bar-them'` or `'bar-you'`, clearing any point selection.

### Valid destinations (dice-free)

Any point that is not blocked by 2+ opponent checkers is a valid destination. No entry-zone restriction is applied — the player may click any reachable point on the board.

### `handleClick(pointIdx)` — new branch

At the top of the existing handler, before point-to-point logic:

```
if selected is 'bar-you' or 'bar-them':
    color = 'white' or 'red'
    fromX = BAR_CX
    fromY = bar anchor Y for that color + stack offset for (barCount - 1)
    start AnimState with fromPoint = -1, toPoint = pointIdx
    setIsAnimating(true), setSelected(null)
    return
```

`fromPoint: -1` is safe because `drawCheckers` only hides one checker from the source when `animFromPoint` is 0–23.

The rest of `handleClick` (point-to-point) is untouched.

---

## 3. Animation & Rendering

### AnimState

No new fields required. Bar-entry reuses the existing shape:

- `fromX: BAR_CX`, `fromY`: derived from bar anchor + stack position of topmost checker
- `fromPoint: -1` (sentinel — tells `drawCheckers` not to hide any point checker)
- `toPoint: pointIdx`
- `hitColor`: set if destination is a blot

When `anim.t >= 1`, the tick handler dispatches as follows (order matters):

1. If `anim.isBarFly` → existing bar-hit commit (unchanged).
2. Else if `anim.fromPoint === -1` → call `applyBarEntry(gs, anim.color, anim.toPoint)` to commit the bar re-entry.
3. Else → existing `applyMove` (point-to-point, unchanged).

The `hitColor` / bar-fly chain for case 2 works identically to case 3 since `applyBarEntry` returns the same `{ nextState, hitColor }` shape.

### Selection highlight

`drawCheckers` already passes `highlight = true` to the topmost checker of a selected point. Extended:

- `selected === 'bar-them'` → highlight the topmost red bar checker (at `BAR_CX`, `BAR_THEM_ANCHOR_Y + (them-1) * -CHECKER_R * 2`)
- `selected === 'bar-you'` → highlight the topmost white bar checker (at `BAR_CX`, `BAR_YOU_ANCHOR_Y + (you-1) * CHECKER_R * 2`)

---

## Files Changed

| File | Change |
|---|---|
| `checkerState.ts` | Add `applyBarEntry` |
| `BoardScene.tsx` | Extend `selected` type, add `handleBarClick`, extend `handleClick`, extend `drawCheckers` highlight, add two bar hit areas in JSX |

No changes to `boardLayout.ts`, tests, or other files.
