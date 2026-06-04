# Blot-Hit Animation Design

## Problem

When a checker move lands on an opponent's blot (a point with exactly one
opposing checker), the hit should play as **two chained animations**:

1. The attacking checker moves from its source point to the blot point.
2. When that first animation ends — and *before* the point's checker changes to
   the new color — the blot checker moves from the point to the bar.
3. After the second animation ends, the attacker is placed on the now-empty
   point.

The current animation system (`BoardScene.tsx` + `state.ts`) supports only a
single animation (`animRef: AnimState | null`) with one hardcoded commit, so it
cannot express this sequence.

## Decisions

- **Sequencing model:** a general animation queue (`AnimState[]`) where each
  step carries its own commit. Normal moves become a 1-element queue; blot hits
  a 2-element queue.
- **Bar:** built properly now — real target coordinate, vertical stacking, and
  bar-checker rendering; the blot is committed into `bars` state.
- **Bar layout:** the two colors split from the vertical center of the bar
  strip — white stacks **downward** (toward the bottom), red stacks **upward**
  (toward the top). Pile mapping: `bars[0] = white`, `bars[1] = red`.
- **Held checker:** because a `PointState` holds only one color, the attacker
  cannot live in `gameState` while the blot is still flying to the bar. It is
  drawn as a "held" floating checker by the animation layer until the queue
  empties.

## Data Model Changes (`game/state.ts`)

Replace the index-based commit fields on `AnimState` with a per-step commit and
an optional held checker:

```ts
export interface AnimState {
  srcPoint: Coord
  destPoint: Coord
  checker: CheckerColor
  t: number
  onEnd: (gs: GameState) => GameState   // commit run when this step finishes
  hold?: Checker                        // floating checker drawn until queue empties
}
```

`srcPointIndex` / `destPointIndex` are removed — the commit logic they fed now
lives inside each step's `onEnd`.

Bar helpers:

- `getBarCenterX(): number`
  = `BOARD_BORDER_PX + QUARTER_POINT_NUM * POINT_WIDTH_PX + BAR_WIDTH_PX / 2`
- `getBarCheckerY(color: CheckerColor, stackIndex: number): number`
  — measured from the vertical center `BOARD_BORDER_PX + PG_HEIGHT_PX / 2`;
  white grows downward (+), red grows upward (−).
- `barIndexForColor(color): number` → white = 0, red = 1.
- `addCheckerToBar(bars, color)` — commit helper mirroring
  `addCheckerToPoint`.

## Rendering (`game/checker.ts`)

`drawCheckers` additionally iterates `gs.bars` (both piles) and draws each pile
using `getBarCenterX` / `getBarCheckerY`.

The animation layer in `BoardScene` draws **all held checkers plus the current
moving checker** every frame (today it draws only the single moving checker).

## Tick Loop (`components/BoardScene.tsx`)

Replace `animRef: AnimState | null` with `animQueueRef: AnimState[]`, and add
`heldRef: Checker[]`.

Each frame:

1. `cur = queue[0]`; advance `cur.t` by `ticker.deltaTime / ANIM_DURATION`.
2. Clear the anim graphics; draw every `heldRef` checker at its rest position,
   then the `cur` moving checker at its eased interpolated position.
3. When `cur.t >= 1`: run `cur.onEnd(gs)` via `setGameState`, push `cur.hold`
   into `heldRef` if present, and `shift()` the queue.
4. When the queue becomes empty: clear `heldRef` and stop animating.

## The Two Flows (`handleClick`)

### Normal move (1-element queue)

`onEnd` = today's commit (remove checker from src point, add to dest point). No
`hold`. This routes the existing behavior through the new queue.

### Blot hit (2-element queue)

Attacker color `X` from src; blot color `Y` from dest.

- **Step 1 — attacker `src → dest`**, landing at the lone-checker slot
  `getCheckerY(pDest, 0, 1)`.
  - `onEnd`: set the dest point empty (remove the blot from committed state).
  - `hold`: the attacker resting at the dest lone-checker slot.
- **Step 2 — blot `dest (lone slot) → bar`**, target
  `{ x: getBarCenterX(), y: getBarCheckerY(Y, bars[barIndexForColor(Y)].count) }`.
  - `onEnd`: `src.count − 1`; `dest = { checker: X, count: 1 }`;
    `addCheckerToBar(bars, Y)`. The attacker is now committed, so when the queue
    empties `heldRef` clears with no double-draw.

## Assumptions

- **No pause** between step 1 and step 2 — step 2 begins the frame step 1
  completes.
- The existing one-frame commit/clear pattern, and the source "top checker
  double-draw" during a move, are acceptable and kept as-is for consistency.
- Single source checker per move (no multi-checker / dice-stack moves in scope).

## Out of Scope

- Re-entering checkers from the bar.
- Legal-move validation / dice.
- Multiple simultaneous hits.
