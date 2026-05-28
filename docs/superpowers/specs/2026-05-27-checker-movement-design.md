# Checker Movement Design

**Date:** 2026-05-27
**Figma:** [GameTableHighlight](https://www.figma.com/design/7or2mH8PehFfpR7d8y2c4N/bbbackgammon?node-id=55-932) (`55:932`), [CheckerHighlight](https://www.figma.com/design/7or2mH8PehFfpR7d8y2c4N/bbbackgammon?node-id=54-821) (`54:821`)
**Scope:** Procedural Pixi board + checker movement (free-move demo) + selection highlight

## Decisions (approved)

| Topic | Choice |
|-------|--------|
| Board rendering | Fully procedural Pixi (`Graphics`) — replaces `board.png` |
| Interaction | Click-to-select, click-to-place (free-move, no rules) |
| Starting layout | Standard backgammon starting position |
| Checker stacking | Stacked vertically along triangle axis |
| Animation | Pixi `useTick` smooth lerp, ~0.33s duration |
| Highlight style | Blue glow ring (`0x4499ff`, alpha 0.6) around selected checker (from Figma `54:821`) |

## Out of scope

- Backgammon rules, move validation, turn order
- Dice rolling
- Bar mechanics (hit checkers)
- Doubling cube
- Networking, state persistence

## Architecture

### File changes

| Action | Path | Purpose |
|--------|------|---------|
| Edit | `components/GameTable/BoardScene.tsx` | State, rendering, interaction, animation |
| Create | `components/GameTable/boardLayout.ts` | 24-point coordinates + constants |
| Create | `components/GameTable/checkerState.ts` | Initial starting layout constant |
| Delete | `public/assets/game-board/board.png` | Replaced by procedural drawing |

No new npm dependencies. No changes outside `BoardScene` and its two new siblings.

### Layers

| Layer | Technology |
|-------|------------|
| `GameTable`, `TopBar`, `MainContent`, `PlayerStatusRow`, `BottomBar` | React + Tailwind (unchanged) |
| `GameBoard` (389×328) | `@pixi/react` `<Application>` (unchanged) |
| `BoardScene` | Procedural Pixi `Graphics` — board + checkers + interaction |

## Board layout (`boardLayout.ts`)

### Coordinate system (canvas: 389×328)

```
Canvas: 389×328
├── BoardBorder: x=0, w=360, h=328   bg: #5e3014, border-radius: 5px left
│   └── Board (playing area): x=10, y=10, w=350, h=308   bg: #c8924a
│       ├── Bar: x=175, w=18, h=308   bg: #351b0b
│       ├── Top 12 triangles: y=10, height=114, tips pointing down  (y_tip=124)
│       └── Bottom 12 triangles: y=204, height=114, tips pointing up (y_tip=204)
└── SideBoard: x=360, w=29, h=328   bg: #5e3014
    ├── Top zone: Opponent (Them) hit checkers — stacking upward from my view, downward from their view
    ├── Center: DoubleClub icon
    └── Bottom zone: My (You) hit checkers — stacking downward from my view, upward from their view
```

### Point layout (points 1–24 only)

Each triangle is ~27.65px wide (7.9% of 350px). Points 13–24 run left→right along the top row; points 12–1 run left→right along the bottom row.

Column x-centers (within 350px playing area, 0-indexed):
- Columns 0–5 (left of bar): `col × 27.65 + 13.83`
- Columns 6–11 (right of bar): `(col × 27.65) + 13.83 + 18` (skip bar gap)

Add 10px board offset for canvas coordinates.

```ts
interface PointLayout {
  cx: number       // center x in canvas coords (389×328 space)
  anchorY: number  // board edge y where checkers start stacking
                   // top points: anchorY=10 (board top), bottom points: anchorY=318 (board bottom)
  dir: 1 | -1     // 1 = stack downward (top points 13–24)
                  // -1 = stack upward  (bottom points 1–12)
}

export const POINT_LAYOUT: PointLayout[]  // 24 entries, [0]=point1 … [23]=point24
export const CHECKER_R = 10              // checker radius px
export const ANIM_DURATION = 20          // ticks (~0.33s at 60fps)
```

### Bar & bear-off constants (special-cased)

Bar (state index 0) and bear-off (state index 25) are **not** in `POINT_LAYOUT` — rendered with dedicated constants.

**Bar** — hit checkers sit on the board center bar strip. From Figma `68:828`, the bar gap (canvas y=124–204) is split into two color zones:

```ts
export const BAR_CX = 185              // center x of bar strip in canvas coords

// Opponent (Them) hit checkers: top of bar gap, stack upward (from my view)
export const BAR_THEM_ANCHOR_Y = 152   // canvas y, dir = -1
// My (You) hit checkers: bottom of bar gap, stack downward (from my view)
export const BAR_YOU_ANCHOR_Y = 176    // canvas y, dir = 1
```

Stacking: `y = anchor + dir * stackPos * CHECKER_R * 2`
- Them: 152, 132, 112… (growing upward)
- You: 176, 196, 216… (growing downward)

**Bear-off (state index 25)** — rendered in the SideBoard as horizontal count bars (5×21px each), not as circles. Not implemented in this scope; tracked as a count only.

### Triangle colors

Triangles alternate two colors (verify exact values from screenshot):
- Dark: `#7b2d10`
- Light: `#c8501a`

## State model (`checkerState.ts`)

Position index convention: **0 = bar, 1–24 = points, 25 = bear-off.**

```ts
type CheckerColor = 'red' | 'white'

// For points 1–24: single color per point
interface PointState {
  color: CheckerColor | null
  count: number
}

// For bar (index 0) and bear-off (index 25): both colors tracked separately
interface SpecialZoneState {
  them: number   // opponent hit checkers (top zone)
  you: number    // my hit checkers (bottom zone)
}

interface GameState {
  points: PointState[]        // 24 elements, index 0 = point 1 … index 23 = point 24
  bar: SpecialZoneState       // state index 0
  bearOff: SpecialZoneState   // state index 25
}

export const INITIAL_STATE: GameState
```

### Standard starting layout

| Point | Color | Count |
|-------|-------|-------|
| 1     | red   | 2     |
| 6     | white | 5     |
| 8     | white | 3     |
| 12    | red   | 5     |
| 13    | white | 5     |
| 17    | red   | 3     |
| 19    | red   | 5     |
| 24    | white | 2     |

All other 16 points: `{ color: null, count: 0 }`. Bar and bear-off start at `{ them: 0, you: 0 }`.

## Rendering (`BoardScene.tsx`)

### React state

```ts
const [points, setPoints] = useState<PointState[]>(INITIAL_POINTS)
const [selected, setSelected] = useState<number | null>(null)
const animRef = useRef<AnimState | null>(null)
```

`animRef` uses a ref (not state) to avoid React re-renders on every animation frame.

### `AnimState`

```ts
interface AnimState {
  fromX: number; fromY: number
  toX: number;   toY: number
  color: CheckerColor
  fromPoint: number; toPoint: number
  t: number  // 0 → 1
}
```

### Drawing order

1. BoardBorder rect (`#5e3014`, rounded-left 5px)
2. Board surface rect (`#c8924a`)
3. 24 triangle polys — alternating dark/light colors via `Graphics.poly()`
4. Bar rect (`#351b0b`)
5. SideBoard rect (`#5e3014`)
6. Hit areas — invisible rects over each triangle column for click detection
7. Checkers — stacked along triangle axis per `points` state
8. Highlight ring — on top checker of selected point (blue glow)
9. In-flight checker — drawn on top during animation

Two `<pixiGraphics>` refs: one for the static board (drawn once), one for checkers + highlights (redrawn on state change).

### Checker stacking

```ts
checkerY(pointIndex: number, stackPos: number): number {
  const { anchorY, dir } = POINT_LAYOUT[pointIndex]
  return anchorY + dir * (CHECKER_R + stackPos * CHECKER_R * 2)
  // top:    10 + 1  × (10 + stackPos×20) → 20, 40, 60 ...
  // bottom: 318 + (-1) × (10 + stackPos×20) → 308, 288, 268 ...
}
```

- Up to 5 checkers rendered individually
- If `count > 5`: render 5 circles, show count badge on topmost

### Checker colors

| Color  | Fill       | Stroke     |
|--------|------------|------------|
| red    | `#d42200`  | `#8a1200`  |
| white  | `#e0dcd5`  | `#9a9490`  |

### Highlight ring (Figma `54:821`)

```ts
// Drawn under the checker
graphics.circle(cx, cy, CHECKER_R + 4)
graphics.fill({ color: 0x4499ff, alpha: 0.6 })
// Then draw checker on top normally
```

Applied to the topmost checker of the selected point only.

## Interaction

### Click logic

```
onClick(pointIndex):
  if animRef.current → ignore (animation running)
  if selected === null:
    if points[pointIndex].count > 0 → setSelected(pointIndex)
  else if pointIndex === selected:
    setSelected(null)         // deselect
  else:
    startAnimation(selected, pointIndex)
    setSelected(null)
```

Click targets are invisible rects spanning the full triangle column (from board edge to the center gap), registered with `eventMode="static"` and `onPointerDown`.

### Animation (`useTick`)

Each tick:
1. `t += delta / ANIM_DURATION`
2. Ease: `eased = t² × (3 − 2t)` (smooth-step)
3. `x = lerp(fromX, toX, eased)`, `y = lerp(fromY, toY, eased)`
4. Draw in-flight checker at `(x, y)` on top layer
5. When `t ≥ 1`:
   - Commit: `points[fromPoint].count--`, `points[toPoint] = { color, count: count+1 }`
   - `setPoints(newPoints)`
   - `animRef.current = null`

During animation, source point renders `count - 1` checkers (one is in-flight).

## Design tokens

| Token | Value | Usage |
|-------|-------|-------|
| Board surface | `#c8924a` | Playing area bg |
| Board border | `#5e3014` | BoardBorder + SideBoard |
| Bar | `#351b0b` | Center bar |
| Red checker fill | `#d42200` | Red checker |
| Red checker stroke | `#8a1200` | Red checker border |
| White checker fill | `#e0dcd5` | White checker |
| White checker stroke | `#9a9490` | White checker border |
| Highlight blue | `0x4499ff` @ 0.6 alpha | Selected checker glow |

## Verification plan

| Step | Check |
|------|-------|
| 1 | `make dev` — board renders procedurally, matches Figma screenshot visually |
| 2 | Standard 30 checkers appear in correct starting positions |
| 3 | Click checker → blue glow appears; click destination → checker moves with smooth animation |
| 4 | Click same point again → deselects |
| 5 | Clicks during animation are ignored |
| 6 | `make build` — exits 0, no TypeScript errors |
