# Checker Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `board.png` in `BoardScene` with a fully procedural Pixi board that renders 30 checkers in standard starting positions, supports click-to-select / click-to-place movement, and animates the moving checker with a smooth lerp.

**Architecture:** `boardLayout.ts` exports coordinate constants and the 24-point layout array; `checkerState.ts` exports types and the initial game state; `BoardScene.tsx` owns all state, draws four Pixi layers (static board, dynamic checkers, hit areas, animation), and drives the animation via `useTick`.

**Tech Stack:** React 19, @pixi/react v8, pixi.js v8, TypeScript, Vite, Vitest (added for pure-function tests), pnpm

---

## File Map

| Action | Path |
|--------|------|
| Edit | `frontend/src/main.tsx` |
| Create | `frontend/src/components/GameTable/boardLayout.ts` |
| Create | `frontend/src/components/GameTable/checkerState.ts` |
| Rewrite | `frontend/src/components/GameTable/BoardScene.tsx` |
| Delete | `frontend/public/assets/game-board/board.png` |
| Create | `frontend/src/components/GameTable/__tests__/boardLayout.test.ts` |
| Create | `frontend/src/components/GameTable/__tests__/checkerState.test.ts` |

---

## Task 1: Add Vitest

**Files:**
- Edit: `frontend/package.json`
- Create: `frontend/vite.config.ts` (add test block)

- [ ] **Step 1: Install vitest**

```bash
pnpm --prefix frontend add -D vitest
```

Expected: vitest added to devDependencies.

- [ ] **Step 2: Add test script to `frontend/package.json`**

Add inside `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 3: Add test block to `frontend/vite.config.ts`**

Read the file first, then add the `test` block. If the file is:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Change it to:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Verify vitest runs**

```bash
cd /home/tie/Projects/bbbackgammon1 && make build
```

Expected: build passes (no tests yet to fail).

- [ ] **Step 5: Commit**

```bash
git -C /home/tie/Projects/bbbackgammon1 add frontend/package.json frontend/vite.config.ts frontend/pnpm-lock.yaml
git -C /home/tie/Projects/bbbackgammon1 commit -m "chore: add vitest for unit tests"
```

---

## Task 2: `boardLayout.ts` — Coordinates & Constants

**Files:**
- Create: `frontend/src/components/GameTable/boardLayout.ts`
- Create: `frontend/src/components/GameTable/__tests__/boardLayout.test.ts`

**Board coordinate notes:**
- Canvas: 389×328. Board playing area: x=10, y=10, w=350, h=308.
- Each of the 12 columns is 27.65px wide (7.9% of 350px).
- Col 0–5 are left of the bar; col 6–11 are right (add 18px gap for bar).
- Top row (anchorY=10, dir=1): points 13–24, columns 0–11 left-to-right.
- Bottom row (anchorY=318, dir=-1): points 12–1, columns 0–11 left-to-right.

- [ ] **Step 1: Write failing tests**

Create `frontend/src/components/GameTable/__tests__/boardLayout.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { POINT_LAYOUT, checkerY, CHECKER_R, BAR_CX, BAR_THEM_ANCHOR_Y, BAR_YOU_ANCHOR_Y } from '../boardLayout'

describe('POINT_LAYOUT', () => {
  it('has 24 entries', () => {
    expect(POINT_LAYOUT).toHaveLength(24)
  })

  it('point 1 (index 0) is bottom-right, stacks upward', () => {
    expect(POINT_LAYOUT[0].dir).toBe(-1)
    expect(POINT_LAYOUT[0].anchorY).toBe(318)
    // rightmost bottom column (col 11): cx = 10 + 11*27.65 + 13.83 + 18 = 345.98
    expect(POINT_LAYOUT[0].cx).toBeCloseTo(345.98, 1)
  })

  it('point 13 (index 12) is top-left, stacks downward', () => {
    expect(POINT_LAYOUT[12].dir).toBe(1)
    expect(POINT_LAYOUT[12].anchorY).toBe(10)
    // leftmost top column (col 0): cx = 10 + 0 + 13.83 = 23.83
    expect(POINT_LAYOUT[12].cx).toBeCloseTo(23.83, 1)
  })

  it('point 24 (index 23) is top-right, stacks downward', () => {
    expect(POINT_LAYOUT[23].dir).toBe(1)
    expect(POINT_LAYOUT[23].anchorY).toBe(10)
    expect(POINT_LAYOUT[23].cx).toBeCloseTo(345.98, 1)
  })
})

describe('checkerY', () => {
  it('first checker on top point stacks at anchorY + CHECKER_R', () => {
    // point 13 (index 12), stackPos=0: 10 + 1*(10+0) = 20
    expect(checkerY(12, 0)).toBe(20)
  })

  it('second checker on top point is 2*CHECKER_R below first', () => {
    expect(checkerY(12, 1)).toBe(40)
  })

  it('first checker on bottom point stacks at anchorY - CHECKER_R', () => {
    // point 1 (index 0), stackPos=0: 318 + (-1)*(10+0) = 308
    expect(checkerY(0, 0)).toBe(308)
  })

  it('second checker on bottom point is 2*CHECKER_R above first', () => {
    expect(checkerY(0, 1)).toBe(288)
  })
})

describe('bar constants', () => {
  it('BAR_CX is midpoint of bar strip', () => {
    expect(BAR_CX).toBe(185)
  })

  it('BAR_THEM_ANCHOR_Y is above gap center', () => {
    expect(BAR_THEM_ANCHOR_Y).toBeLessThan(164)
  })

  it('BAR_YOU_ANCHOR_Y is below gap center', () => {
    expect(BAR_YOU_ANCHOR_Y).toBeGreaterThan(164)
  })
})
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
pnpm --prefix frontend test
```

Expected: FAIL with "Cannot find module '../boardLayout'"

- [ ] **Step 3: Create `frontend/src/components/GameTable/boardLayout.ts`**

```ts
export const CHECKER_R = 10
export const ANIM_DURATION = 20      // ticks (~0.33s at 60fps)
export const BAR_CX = 185            // bar strip center x in canvas coords
export const BAR_THEM_ANCHOR_Y = 152 // opponent hit checkers anchor y (stack upward)
export const BAR_YOU_ANCHOR_Y = 176  // your hit checkers anchor y (stack downward)

export interface PointLayout {
  cx: number       // center x in canvas coords
  anchorY: number  // board edge y where checkers start stacking
  dir: 1 | -1     // 1 = stack downward (top points 13–24), -1 = stack upward (bottom 1–12)
}

const colCx = (col: number): number =>
  10 + col * 27.65 + 13.83 + (col >= 6 ? 18 : 0)

// POINT_LAYOUT[i] = layout for point (i+1)
// Top row (left→right): 13,14,15,16,17,18 | bar | 19,20,21,22,23,24
// Bottom row (left→right): 12,11,10,9,8,7 | bar | 6,5,4,3,2,1
export const POINT_LAYOUT: PointLayout[] = [
  // Points 1–12: bottom row, right to left (col 11 → col 0)
  { cx: colCx(11), anchorY: 318, dir: -1 }, // point 1
  { cx: colCx(10), anchorY: 318, dir: -1 }, // point 2
  { cx: colCx(9),  anchorY: 318, dir: -1 }, // point 3
  { cx: colCx(8),  anchorY: 318, dir: -1 }, // point 4
  { cx: colCx(7),  anchorY: 318, dir: -1 }, // point 5
  { cx: colCx(6),  anchorY: 318, dir: -1 }, // point 6
  { cx: colCx(5),  anchorY: 318, dir: -1 }, // point 7
  { cx: colCx(4),  anchorY: 318, dir: -1 }, // point 8
  { cx: colCx(3),  anchorY: 318, dir: -1 }, // point 9
  { cx: colCx(2),  anchorY: 318, dir: -1 }, // point 10
  { cx: colCx(1),  anchorY: 318, dir: -1 }, // point 11
  { cx: colCx(0),  anchorY: 318, dir: -1 }, // point 12
  // Points 13–24: top row, left to right (col 0 → col 11)
  { cx: colCx(0),  anchorY: 10, dir: 1 }, // point 13
  { cx: colCx(1),  anchorY: 10, dir: 1 }, // point 14
  { cx: colCx(2),  anchorY: 10, dir: 1 }, // point 15
  { cx: colCx(3),  anchorY: 10, dir: 1 }, // point 16
  { cx: colCx(4),  anchorY: 10, dir: 1 }, // point 17
  { cx: colCx(5),  anchorY: 10, dir: 1 }, // point 18
  { cx: colCx(6),  anchorY: 10, dir: 1 }, // point 19
  { cx: colCx(7),  anchorY: 10, dir: 1 }, // point 20
  { cx: colCx(8),  anchorY: 10, dir: 1 }, // point 21
  { cx: colCx(9),  anchorY: 10, dir: 1 }, // point 22
  { cx: colCx(10), anchorY: 10, dir: 1 }, // point 23
  { cx: colCx(11), anchorY: 10, dir: 1 }, // point 24
]

export function checkerY(pointIdx: number, stackPos: number): number {
  const { anchorY, dir } = POINT_LAYOUT[pointIdx]
  return anchorY + dir * (CHECKER_R + stackPos * CHECKER_R * 2)
}
```

- [ ] **Step 4: Run test — verify PASS**

```bash
pnpm --prefix frontend test
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git -C /home/tie/Projects/bbbackgammon1 add frontend/src/components/GameTable/boardLayout.ts frontend/src/components/GameTable/__tests__/boardLayout.test.ts
git -C /home/tie/Projects/bbbackgammon1 commit -m "feat: add boardLayout coordinates and checkerY formula"
```

---

## Task 3: `checkerState.ts` — Types & Initial State

**Files:**
- Create: `frontend/src/components/GameTable/checkerState.ts`
- Create: `frontend/src/components/GameTable/__tests__/checkerState.test.ts`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/components/GameTable/__tests__/checkerState.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { INITIAL_STATE } from '../checkerState'

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
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
pnpm --prefix frontend test
```

Expected: FAIL with "Cannot find module '../checkerState'"

- [ ] **Step 3: Create `frontend/src/components/GameTable/checkerState.ts`**

```ts
export type CheckerColor = 'red' | 'white'

export interface PointState {
  color: CheckerColor | null
  count: number
}

// them = opponent (red), you = local player (white)
export interface SpecialZoneState {
  them: number
  you: number
}

export interface GameState {
  points: PointState[]       // 24 elements, [0]=point1 … [23]=point24
  bar: SpecialZoneState
  bearOff: SpecialZoneState
}

const E: PointState = { color: null, count: 0 }

export const INITIAL_STATE: GameState = {
  points: [
    { color: 'red',   count: 2 }, // [0]  point 1
    E,                             // [1]  point 2
    E,                             // [2]  point 3
    E,                             // [3]  point 4
    E,                             // [4]  point 5
    { color: 'white', count: 5 }, // [5]  point 6
    E,                             // [6]  point 7
    { color: 'white', count: 3 }, // [7]  point 8
    E,                             // [8]  point 9
    E,                             // [9]  point 10
    E,                             // [10] point 11
    { color: 'red',   count: 5 }, // [11] point 12
    { color: 'white', count: 5 }, // [12] point 13
    E,                             // [13] point 14
    E,                             // [14] point 15
    E,                             // [15] point 16
    { color: 'red',   count: 3 }, // [16] point 17
    E,                             // [17] point 18
    { color: 'red',   count: 5 }, // [18] point 19
    E,                             // [19] point 20
    E,                             // [20] point 21
    E,                             // [21] point 22
    E,                             // [22] point 23
    { color: 'white', count: 2 }, // [23] point 24
  ],
  bar: { them: 0, you: 0 },
  bearOff: { them: 0, you: 0 },
}
```

- [ ] **Step 4: Run test — verify PASS**

```bash
pnpm --prefix frontend test
```

Expected: all 15 tests PASS (8 boardLayout + 7 checkerState).

- [ ] **Step 5: Commit**

```bash
git -C /home/tie/Projects/bbbackgammon1 add frontend/src/components/GameTable/checkerState.ts frontend/src/components/GameTable/__tests__/checkerState.test.ts
git -C /home/tie/Projects/bbbackgammon1 commit -m "feat: add checkerState types and standard starting position"
```

---

## Task 4: Extend Graphics & Draw Static Board

**Files:**
- Edit: `frontend/src/main.tsx`
- Rewrite: `frontend/src/components/GameTable/BoardScene.tsx`

- [ ] **Step 1: Add Graphics to extend in `frontend/src/main.tsx`**

```ts
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { extend } from '@pixi/react'
import { Container, Sprite, Graphics } from 'pixi.js'
import './index.css'
import App from './App'

extend({ Container, Sprite, Graphics })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 2: Rewrite `frontend/src/components/GameTable/BoardScene.tsx` — static board only**

```tsx
import { useCallback } from 'react'
import type { Graphics } from 'pixi.js'

const TRIANGLE_DARK  = 0x7b2d10
const TRIANGLE_LIGHT = 0xc8501a

function drawBoard(g: Graphics) {
  g.clear()

  // Outer container (brown, fully rounded 5px)
  g.roundRect(0, 0, 389, 328, 5).fill(0x5e3014)

  // Playing surface
  g.rect(10, 10, 350, 308).fill(0xc8924a)

  // 24 triangles — col 0–5 left of bar, col 6–11 right (+18px gap)
  for (let col = 0; col < 12; col++) {
    const xOff = col >= 6 ? 18 : 0
    const xL = 10 + col * 27.65 + xOff
    const xR = xL + 27.65
    const xT = (xL + xR) / 2
    const color = col % 2 === 0 ? TRIANGLE_DARK : TRIANGLE_LIGHT
    // top triangle (base at y=10, tip at y=124)
    g.poly([xL, 10, xR, 10, xT, 124]).fill(color)
    // bottom triangle (base at y=318, tip at y=204)
    g.poly([xL, 318, xR, 318, xT, 204]).fill(color)
  }

  // Center bar (dark brown)
  g.rect(176, 10, 18, 308).fill(0x351b0b)
}

export default function BoardScene() {
  const draw = useCallback(drawBoard, [])

  return <pixiGraphics draw={draw} />
}
```

- [ ] **Step 3: Start dev server and visually verify**

```bash
make -C /home/tie/Projects/bbbackgammon1 dev
```

Open http://localhost:5173. Expected: backgammon board visible — brown border, tan playing surface, 24 alternating triangles pointing toward center, dark center bar. No checkers yet.

- [ ] **Step 4: Verify build passes**

```bash
make -C /home/tie/Projects/bbbackgammon1 build
```

Expected: exit 0, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git -C /home/tie/Projects/bbbackgammon1 add frontend/src/main.tsx frontend/src/components/GameTable/BoardScene.tsx
git -C /home/tie/Projects/bbbackgammon1 commit -m "feat: replace board.png with procedural Pixi board"
```

---

## Task 5: Render Checkers in Starting Position

**Files:**
- Edit: `frontend/src/components/GameTable/BoardScene.tsx`

- [ ] **Step 1: Replace `BoardScene.tsx` with checker rendering added**

```tsx
import { useCallback, useRef, useState } from 'react'
import type { Graphics } from 'pixi.js'
import {
  POINT_LAYOUT, CHECKER_R, checkerY,
  BAR_CX, BAR_THEM_ANCHOR_Y, BAR_YOU_ANCHOR_Y,
} from './boardLayout'
import { INITIAL_STATE, type GameState, type CheckerColor } from './checkerState'

const TRIANGLE_DARK  = 0x7b2d10
const TRIANGLE_LIGHT = 0xc8501a

function drawBoard(g: Graphics) {
  g.clear()
  g.roundRect(0, 0, 389, 328, 5).fill(0x5e3014)
  g.rect(10, 10, 350, 308).fill(0xc8924a)
  for (let col = 0; col < 12; col++) {
    const xOff = col >= 6 ? 18 : 0
    const xL = 10 + col * 27.65 + xOff
    const xR = xL + 27.65
    const xT = (xL + xR) / 2
    const color = col % 2 === 0 ? TRIANGLE_DARK : TRIANGLE_LIGHT
    g.poly([xL, 10, xR, 10, xT, 124]).fill(color)
    g.poly([xL, 318, xR, 318, xT, 204]).fill(color)
  }
  g.rect(176, 10, 18, 308).fill(0x351b0b)
}

function drawChecker(g: Graphics, cx: number, cy: number, color: CheckerColor, highlight = false) {
  if (highlight) {
    g.circle(cx, cy, CHECKER_R + 4).fill({ color: 0x4499ff, alpha: 0.6 })
  }
  const fill   = color === 'red' ? 0xd42200 : 0xe0dcd5
  const stroke = color === 'red' ? 0x8a1200 : 0x9a9490
  g.circle(cx, cy, CHECKER_R).fill(fill).stroke({ color: stroke, width: 1 })
}

function drawCheckers(g: Graphics, gameState: GameState, selected: number | null) {
  g.clear()

  for (let i = 0; i < 24; i++) {
    const pt = gameState.points[i]
    if (!pt.color || pt.count === 0) continue
    const layout = POINT_LAYOUT[i]
    const display = Math.min(pt.count, 5)
    for (let s = 0; s < display; s++) {
      const y = checkerY(i, s)
      const isTop = s === display - 1
      drawChecker(g, layout.cx, y, pt.color, isTop && selected === i)
    }
    if (pt.count > 5) {
      // Draw count badge on topmost checker (darker overlay + number rendered via separate Text in future)
      g.circle(layout.cx, checkerY(i, 4), CHECKER_R).fill({ color: 0x000000, alpha: 0.5 })
    }
  }

  // Bar checkers
  for (let s = 0; s < gameState.bar.them; s++) {
    drawChecker(g, BAR_CX, BAR_THEM_ANCHOR_Y + (-1) * s * CHECKER_R * 2, 'red')
  }
  for (let s = 0; s < gameState.bar.you; s++) {
    drawChecker(g, BAR_CX, BAR_YOU_ANCHOR_Y + s * CHECKER_R * 2, 'white')
  }
}

export default function BoardScene() {
  const [gameState] = useState<GameState>(INITIAL_STATE)
  const [selected, setSelected] = useState<number | null>(null)
  const _ = setSelected  // will be used in next task

  const drawBoardCb = useCallback(drawBoard, [])
  const drawCheckersCb = useCallback(
    (g: Graphics) => drawCheckers(g, gameState, selected),
    [gameState, selected],
  )

  return (
    <>
      <pixiGraphics draw={drawBoardCb} />
      <pixiGraphics draw={drawCheckersCb} />
    </>
  )
}
```

- [ ] **Step 2: Verify visually**

Open http://localhost:5173. Expected: 30 checkers in standard starting positions on the procedural board — 5 white on point 13 (top-left), 2 white on point 24 (top-right), etc.

- [ ] **Step 3: Build check**

```bash
make -C /home/tie/Projects/bbbackgammon1 build
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git -C /home/tie/Projects/bbbackgammon1 add frontend/src/components/GameTable/BoardScene.tsx
git -C /home/tie/Projects/bbbackgammon1 commit -m "feat: render 30 checkers in starting positions"
```

---

## Task 6: Click Interaction & Highlight

**Files:**
- Edit: `frontend/src/components/GameTable/BoardScene.tsx`

- [ ] **Step 1: Replace `BoardScene.tsx` — add hit areas, selection state, `setSelected` wired up**

```tsx
import { useCallback, useRef, useState } from 'react'
import type { Graphics } from 'pixi.js'
import {
  POINT_LAYOUT, CHECKER_R, checkerY,
  BAR_CX, BAR_THEM_ANCHOR_Y, BAR_YOU_ANCHOR_Y,
} from './boardLayout'
import { INITIAL_STATE, type GameState, type CheckerColor } from './checkerState'

const TRIANGLE_DARK  = 0x7b2d10
const TRIANGLE_LIGHT = 0xc8501a

function drawBoard(g: Graphics) {
  g.clear()
  g.roundRect(0, 0, 389, 328, 5).fill(0x5e3014)
  g.rect(10, 10, 350, 308).fill(0xc8924a)
  for (let col = 0; col < 12; col++) {
    const xOff = col >= 6 ? 18 : 0
    const xL = 10 + col * 27.65 + xOff
    const xR = xL + 27.65
    const xT = (xL + xR) / 2
    const color = col % 2 === 0 ? TRIANGLE_DARK : TRIANGLE_LIGHT
    g.poly([xL, 10, xR, 10, xT, 124]).fill(color)
    g.poly([xL, 318, xR, 318, xT, 204]).fill(color)
  }
  g.rect(176, 10, 18, 308).fill(0x351b0b)
}

function drawChecker(g: Graphics, cx: number, cy: number, color: CheckerColor, highlight = false) {
  if (highlight) {
    g.circle(cx, cy, CHECKER_R + 4).fill({ color: 0x4499ff, alpha: 0.6 })
  }
  const fill   = color === 'red' ? 0xd42200 : 0xe0dcd5
  const stroke = color === 'red' ? 0x8a1200 : 0x9a9490
  g.circle(cx, cy, CHECKER_R).fill(fill).stroke({ color: stroke, width: 1 })
}

function drawCheckers(
  g: Graphics,
  gameState: GameState,
  selected: number | null,
  animFromPoint: number | null,
) {
  g.clear()
  for (let i = 0; i < 24; i++) {
    const pt = gameState.points[i]
    if (!pt.color || pt.count === 0) continue
    const layout = POINT_LAYOUT[i]
    const count = animFromPoint === i ? pt.count - 1 : pt.count
    if (count <= 0) continue
    const display = Math.min(count, 5)
    for (let s = 0; s < display; s++) {
      const y = checkerY(i, s)
      const isTop = s === display - 1
      drawChecker(g, layout.cx, y, pt.color, isTop && selected === i)
    }
    if (count > 5) {
      g.circle(layout.cx, checkerY(i, 4), CHECKER_R).fill({ color: 0x000000, alpha: 0.5 })
    }
  }
  for (let s = 0; s < gameState.bar.them; s++) {
    drawChecker(g, BAR_CX, BAR_THEM_ANCHOR_Y + (-1) * s * CHECKER_R * 2, 'red')
  }
  for (let s = 0; s < gameState.bar.you; s++) {
    drawChecker(g, BAR_CX, BAR_YOU_ANCHOR_Y + s * CHECKER_R * 2, 'white')
  }
}

// Hit area draw helper — transparent rect that captures pointer events
function makeHitDraw(x: number, y: number, w: number, h: number) {
  return (g: Graphics) => {
    g.clear()
    g.rect(x, y, w, h).fill({ color: 0, alpha: 0.001 })
  }
}

// Precompute hit area rects for all 24 points (full column, split at midpoint y=164)
const HIT_AREAS = POINT_LAYOUT.map((layout, i) => {
  const xOff = POINT_LAYOUT.indexOf(layout) >= 0 ? 0 : 0 // unused, kept for clarity
  const col = (() => {
    // Reverse-compute column from cx
    const inner = layout.cx - 10
    const col6plus = inner >= 165.9 + 18
    return col6plus
      ? Math.round((inner - 18 - 13.83) / 27.65)
      : Math.round((inner - 13.83) / 27.65)
  })()
  const xOff2 = col >= 6 ? 18 : 0
  const xL = 10 + col * 27.65 + xOff2
  const isTop = layout.dir === 1   // top points (13–24)
  const x = xL
  const w = 27.65
  const y = isTop ? 10 : 164
  const h = isTop ? 154 : 154  // both halves are 154px (164-10 or 318-164)
  return { x, y: isTop ? 10 : 164, w, h }
})

export default function BoardScene() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE)
  const [selected, setSelected] = useState<number | null>(null)
  const animFromPointRef = useRef<number | null>(null)

  const handleClick = useCallback((pointIdx: number) => {
    if (animFromPointRef.current !== null) return  // ignore during animation

    setSelected(prev => {
      if (prev === null) {
        // Select if has checkers
        if (gameState.points[pointIdx]?.count > 0) return pointIdx
        return null
      }
      if (prev === pointIdx) return null  // deselect
      // Move: update game state
      setGameState(gs => {
        const pts = gs.points.map(p => ({ ...p }))
        const from = pts[prev]
        const to = pts[pointIdx]
        pts[prev] = { ...from, count: from.count - 1 }
        if (pts[prev].count === 0) pts[prev] = { color: null, count: 0 }
        pts[pointIdx] = { color: from.color!, count: to.count + 1 }
        return { ...gs, points: pts }
      })
      return null
    })
  }, [gameState])

  const drawBoardCb = useCallback(drawBoard, [])
  const drawCheckersCb = useCallback(
    (g: Graphics) => drawCheckers(g, gameState, selected, animFromPointRef.current),
    [gameState, selected],
  )

  return (
    <>
      <pixiGraphics draw={drawBoardCb} />
      <pixiGraphics draw={drawCheckersCb} />
      {HIT_AREAS.map((area, i) => (
        <pixiGraphics
          key={i}
          draw={useCallback(makeHitDraw(area.x, area.y, area.w, area.h), [])}
          eventMode="static"
          cursor="pointer"
          onPointerDown={() => handleClick(i)}
        />
      ))}
    </>
  )
}
```

> **Note on `useCallback` in JSX map:** The inner `useCallback` inside `.map()` will warn in React — refactor after verifying functionality. The correct approach is to move `HIT_AREAS` draw functions to a stable array outside the component. See Task 7 for cleanup.

- [ ] **Step 2: Verify interaction visually**

Open http://localhost:5173. Expected:
- Click a checker → blue glow appears on top checker of that point
- Click again → deselects
- Click another point → checker moves instantly (no animation yet)

- [ ] **Step 3: Build check**

```bash
make -C /home/tie/Projects/bbbackgammon1 build
```

Expected: exit 0 (there may be a React warning about hooks in loops — acceptable for now, fixed in Task 7).

- [ ] **Step 4: Commit**

```bash
git -C /home/tie/Projects/bbbackgammon1 add frontend/src/components/GameTable/BoardScene.tsx
git -C /home/tie/Projects/bbbackgammon1 commit -m "feat: add click-to-select and checker movement"
```

---

## Task 7: Animation with `useTick`

**Files:**
- Edit: `frontend/src/components/GameTable/BoardScene.tsx`

- [ ] **Step 1: Replace `BoardScene.tsx` — final version with animation and hook cleanup**

```tsx
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTick } from '@pixi/react'
import type { Graphics } from 'pixi.js'
import {
  POINT_LAYOUT, CHECKER_R, ANIM_DURATION, checkerY,
  BAR_CX, BAR_THEM_ANCHOR_Y, BAR_YOU_ANCHOR_Y,
} from './boardLayout'
import { INITIAL_STATE, type GameState, type CheckerColor } from './checkerState'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnimState {
  fromX: number; fromY: number
  toX: number;   toY: number
  color: CheckerColor
  fromPoint: number; toPoint: number
  t: number
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────

const TRIANGLE_DARK  = 0x7b2d10
const TRIANGLE_LIGHT = 0xc8501a

function drawBoard(g: Graphics) {
  g.clear()
  g.roundRect(0, 0, 389, 328, 5).fill(0x5e3014)
  g.rect(10, 10, 350, 308).fill(0xc8924a)
  for (let col = 0; col < 12; col++) {
    const xOff = col >= 6 ? 18 : 0
    const xL = 10 + col * 27.65 + xOff
    const xR = xL + 27.65
    const xT = (xL + xR) / 2
    const color = col % 2 === 0 ? TRIANGLE_DARK : TRIANGLE_LIGHT
    g.poly([xL, 10, xR, 10, xT, 124]).fill(color)
    g.poly([xL, 318, xR, 318, xT, 204]).fill(color)
  }
  g.rect(176, 10, 18, 308).fill(0x351b0b)
}

function drawChecker(g: Graphics, cx: number, cy: number, color: CheckerColor, highlight = false) {
  if (highlight) {
    g.circle(cx, cy, CHECKER_R + 4).fill({ color: 0x4499ff, alpha: 0.6 })
  }
  const fill   = color === 'red' ? 0xd42200 : 0xe0dcd5
  const stroke = color === 'red' ? 0x8a1200 : 0x9a9490
  g.circle(cx, cy, CHECKER_R).fill(fill).stroke({ color: stroke, width: 1 })
}

function drawCheckers(
  g: Graphics,
  gameState: GameState,
  selected: number | null,
  animFromPoint: number | null,
) {
  g.clear()
  for (let i = 0; i < 24; i++) {
    const pt = gameState.points[i]
    if (!pt.color || pt.count === 0) continue
    const layout = POINT_LAYOUT[i]
    const count = animFromPoint === i ? pt.count - 1 : pt.count
    if (count <= 0) continue
    const display = Math.min(count, 5)
    for (let s = 0; s < display; s++) {
      drawChecker(g, layout.cx, checkerY(i, s), pt.color, s === display - 1 && selected === i)
    }
    if (count > 5) {
      g.circle(layout.cx, checkerY(i, 4), CHECKER_R).fill({ color: 0x000000, alpha: 0.5 })
    }
  }
  for (let s = 0; s < gameState.bar.them; s++) {
    drawChecker(g, BAR_CX, BAR_THEM_ANCHOR_Y + (-1) * s * CHECKER_R * 2, 'red')
  }
  for (let s = 0; s < gameState.bar.you; s++) {
    drawChecker(g, BAR_CX, BAR_YOU_ANCHOR_Y + s * CHECKER_R * 2, 'white')
  }
}

// ─── Hit areas (stable, computed once outside component) ─────────────────────

const HIT_DRAWS = POINT_LAYOUT.map((layout) => {
  // Reverse-compute column index from cx
  const inner = layout.cx - 10
  const isRightOfBar = inner > 165.9 + 18
  const col = isRightOfBar
    ? Math.round((inner - 18 - 13.83) / 27.65)
    : Math.round((inner - 13.83) / 27.65)
  const xOff = col >= 6 ? 18 : 0
  const xL = 10 + col * 27.65 + xOff
  const isTop = layout.dir === 1
  const y = isTop ? 10 : 164
  return (g: Graphics) => {
    g.clear()
    g.rect(xL, y, 27.65, 154).fill({ color: 0, alpha: 0.001 })
  }
})

// ─── Component ───────────────────────────────────────────────────────────────

export default function BoardScene() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE)
  const [selected, setSelected] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const animRef = useRef<AnimState | null>(null)
  const animGfxRef = useRef<Graphics>(null)

  // Animation tick — runs every frame, updates animRef and imperatively redraws animGfx
  useTick((ticker) => {
    const anim = animRef.current
    if (!anim || !animGfxRef.current) return

    anim.t = Math.min(1, anim.t + ticker.deltaTime / ANIM_DURATION)
    const eased = anim.t * anim.t * (3 - 2 * anim.t)
    const x = anim.fromX + (anim.toX - anim.fromX) * eased
    const y = anim.fromY + (anim.toY - anim.fromY) * eased

    const g = animGfxRef.current
    g.clear()

    if (anim.t < 1) {
      drawChecker(g, x, y, anim.color)
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
  })

  const handleClick = useCallback((pointIdx: number) => {
    if (animRef.current) return  // ignore during animation

    setSelected(prev => {
      if (prev === null) {
        if ((gameState.points[pointIdx]?.count ?? 0) > 0) return pointIdx
        return null
      }
      if (prev === pointIdx) return null

      // Start animation
      const from = POINT_LAYOUT[prev]
      const to   = POINT_LAYOUT[pointIdx]
      const fromPt = gameState.points[prev]
      const stackPos = Math.min(fromPt.count - 1, 4)
      const fromY = checkerY(prev, stackPos)
      const toStackPos = Math.min((gameState.points[pointIdx]?.count ?? 0), 4)
      const toY = checkerY(pointIdx, toStackPos)

      animRef.current = {
        fromX: from.cx, fromY,
        toX: to.cx,     toY,
        color: fromPt.color!,
        fromPoint: prev, toPoint: pointIdx,
        t: 0,
      }
      setIsAnimating(true)
      return null
    })
  }, [gameState, isAnimating])

  const drawBoardCb    = useCallback(drawBoard, [])
  const drawCheckersCb = useCallback(
    (g: Graphics) => drawCheckers(g, gameState, selected, animRef.current?.fromPoint ?? null),
    [gameState, selected, isAnimating],
  )
  const hitDrawCallbacks = useMemo(
    () => HIT_DRAWS.map(fn => (g: Graphics) => fn(g)),
    [],
  )

  return (
    <>
      <pixiGraphics draw={drawBoardCb} />
      <pixiGraphics draw={drawCheckersCb} />
      {hitDrawCallbacks.map((draw, i) => (
        <pixiGraphics
          key={i}
          draw={draw}
          eventMode="static"
          cursor="pointer"
          onPointerDown={() => handleClick(i)}
        />
      ))}
      <pixiGraphics ref={animGfxRef} draw={(g) => g.clear()} />
    </>
  )
}
```

- [ ] **Step 2: Verify animation visually**

Open http://localhost:5173. Expected:
- Click a checker → blue glow appears
- Click another point → checker slides smoothly in ~0.33s, lands on destination, stacks correctly
- Clicks during animation are ignored
- Deselect by clicking same point again

- [ ] **Step 3: Build check**

```bash
make -C /home/tie/Projects/bbbackgammon1 build
```

Expected: exit 0, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git -C /home/tie/Projects/bbbackgammon1 add frontend/src/components/GameTable/BoardScene.tsx
git -C /home/tie/Projects/bbbackgammon1 commit -m "feat: animate checker movement with Pixi useTick"
```

---

## Task 8: Cleanup — Remove `board.png`

**Files:**
- Delete: `frontend/public/assets/game-board/board.png`

- [ ] **Step 1: Delete board.png**

```bash
rm /home/tie/Projects/bbbackgammon1/frontend/public/assets/game-board/board.png
```

- [ ] **Step 2: Verify nothing imports board.png**

```bash
grep -r "board.png" /home/tie/Projects/bbbackgammon1/frontend/src/
```

Expected: no output (no remaining references).

- [ ] **Step 3: Final build check**

```bash
make -C /home/tie/Projects/bbbackgammon1 build
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git -C /home/tie/Projects/bbbackgammon1 add -u
git -C /home/tie/Projects/bbbackgammon1 commit -m "chore: remove board.png replaced by procedural Pixi rendering"
```

---

## Verification Checklist

| Check | Command / Action |
|-------|-----------------|
| All unit tests pass | `pnpm --prefix frontend test` |
| Board renders procedurally | `make dev` → visual match to Figma |
| 30 checkers in starting positions | Visual check |
| Click → blue glow on selection | Manual test |
| Click same point → deselects | Manual test |
| Click another point → smooth animation | Manual test |
| Clicks during animation ignored | Manual test |
| Build clean | `make build` → exit 0 |
