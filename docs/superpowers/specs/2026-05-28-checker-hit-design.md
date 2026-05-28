# Checker Hit Design

**Date:** 2026-05-28
**Figma:** [GameTableCheckerHit](https://www.figma.com/design/7or2mH8PehFfpR7d8y2c4N/bbbackgammon?node-id=68-828&m=dev) (`68:828`)
**Scope:** Hit mechanic — when a checker lands on a point with exactly one opponent checker (a "blot"), that checker is sent to the center bar with a sequential animation.

## Decisions (approved)

| Topic | Choice |
|-------|--------|
| Hit detection | Any color can hit any opponent blot (bidirectional, free-move context) |
| Move blocking | Not added — moves to 2+ opponent checkers still allowed (free-move demo) |
| Animation | Sequential: main checker lands first, then hit checker animates to bar |
| Approach | Extend `AnimState` with two optional fields; branch in `useTick` commit handler |

## Out of scope

- Turn order enforcement
- Move validation (2+ opponent stack blocking)
- Bearing off
- Re-entering from bar (checkers accumulate on bar but can't re-enter yet)

## Architecture

### File changes

| Action | Path | Purpose |
|--------|------|---------|
| Edit | `components/GameTable/BoardScene.tsx` | Add `hitColor`/`isBarFly` to `AnimState`, hit detection in `handleClick`, two-phase commit in `useTick` |

No changes to `checkerState.ts`, `boardLayout.ts`, or any other file.

## Types

`AnimState` gains two optional fields:

```ts
interface AnimState {
  fromX: number; fromY: number
  toX: number; toY: number
  color: CheckerColor
  fromPoint: number; toPoint: number
  t: number
  // Set on the main-move animation when the destination is a blot.
  // Carries the color of the checker being hit.
  hitColor?: CheckerColor
  // Set on the bar-fly animation (phase 2).
  // On commit: increment bar count for `color` only; do not touch `points`.
  isBarFly?: true
}
```

`GameState`, `PointState`, and `SpecialZoneState` in `checkerState.ts` are **unchanged**.

## Hit detection (`handleClick`)

After selecting a source and clicking a destination, before starting the animation:

```ts
const destPt = gameState.points[pointIdx]
const moverColor = fromPt.color!
const isHit = destPt.color !== null
           && destPt.color !== moverColor
           && destPt.count === 1

animRef.current = {
  fromX: from.cx, fromY,
  toX: to.cx, toY,
  color: moverColor,
  fromPoint: prev, toPoint: pointIdx,
  t: 0,
  hitColor: isHit ? destPt.color : undefined,
}
```

## Two-phase commit (`useTick`)

When `t >= 1`, three cases replace the current single commit:

### Case 1 — normal move (no `hitColor`, no `isBarFly`)
Identical to current behavior: decrement source point, increment destination point, clear `animRef`.

### Case 2 — main move hits a blot (`hitColor` is set)
1. Commit state: decrement `fromPoint` count; set `toPoint` to `{ color: moverColor, count: 1 }` (blot overwritten).
2. Compute bar landing Y for the hit checker:
   - Red (opponent/them): `BAR_THEM_ANCHOR_Y + (-1) * barThemCount * CHECKER_R * 2`
   - White (you): `BAR_YOU_ANCHOR_Y + barYouCount * CHECKER_R * 2`
   - Read the bar count from inside the `setGameState` updater callback (after committing the point changes) to avoid a stale closure.
3. Start phase 2 by setting `animRef.current` to a new `AnimState`:
   - `fromX` = `POINT_LAYOUT[toPoint].cx`, `fromY` = `checkerY(toPoint, 0)` (blot was at stack pos 0)
   - `toX` = `BAR_CX`, `toY` = computed landing Y
   - `color` = `hitColor`
   - `fromPoint` = `toPoint` (the point the blot was on), `toPoint` = `-1` (sentinel, bar)
   - `isBarFly: true`, `t: 0`
4. Do **not** set `isAnimating(false)` — animation continues.

### Case 3 — bar-fly completes (`isBarFly` is set)
1. Commit state: increment `bar.them` (if `color === 'red'`) or `bar.you` (if `color === 'white'`).
2. Clear `animRef.current = null`, set `isAnimating(false)`.

### Rendering during phase 2
- `drawCheckers` receives `animFromPoint = animRef.current?.fromPoint ?? null`.
- During phase 2, `animFromPoint = toPoint` (the hit point). But the blot was already removed from state in the Case 2 commit — that point now has `{ color: moverColor, count: 1 }`. Subtracting 1 renders it as empty while the in-flight anim layer shows the hit checker moving.
- The in-flight anim layer (`animGfxRef`) draws the hit checker each tick as normal.

## Bar stacking coordinates

Already established constants (unchanged):

```ts
BAR_CX = 185
BAR_THEM_ANCHOR_Y = 152  // opponent hit checkers, stack upward (dir = -1)
BAR_YOU_ANCHOR_Y  = 176  // your hit checkers,     stack downward (dir = +1)
```

Bar checker Y: `anchor + dir * stackPos * CHECKER_R * 2`

The `toY` for the bar-fly animation uses `stackPos = current bar count` (bar count before increment).

## Verification plan

| Step | Check |
|------|-------|
| 1 | Move a white checker onto a point with 1 red checker → white lands, then red checker animates to bar |
| 2 | Move a red checker onto a point with 1 white checker → white appears on bar after animation |
| 3 | Bar count accumulates correctly with multiple hits |
| 4 | Move onto a point with 0 checkers → no hit, normal behavior unchanged |
| 5 | Move onto a point with 2+ own-color checkers → stack grows, no hit |
| 6 | Clicks during either phase of animation are ignored |
| 7 | `make build` exits 0, no TypeScript errors |
