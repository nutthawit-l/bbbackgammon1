# GameTable Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a static `GameTable` React layout matching Figma symbol `55:930`, with the full **389×328** `GameBoard` rendered in PixiJS via a composite texture.

**Architecture:** React + Tailwind own `GameTable`, `TopBar`, `MainContent`, `PlayerStatusRow`, and `BottomBar`. `GameBoard` owns a `<canvas>` ref and delegates Pixi lifecycle to `createPixiApp` + `buildBoardScene`. v1 uses one checked-in PNG for the entire board frame (points, checkers, dice, side panel) to match Figma quickly without game logic.

**Tech Stack:** Vite 6, React 19, TypeScript 5 (strict), Tailwind CSS v4, PixiJS v8, pnpm, Makefile (`make dev` / `make build`)

**Spec:** `docs/superpowers/specs/2026-05-26-game-table-design.md`

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `frontend/public/assets/game-board/board.png` | Create | 389×328 composite export of Figma `GameBoard` (`55:749`) |
| `frontend/src/game/boardScene.ts` | Create | Load board texture; add full-board sprite to Pixi stage |
| `frontend/src/game/app.ts` | Modify | Transparent canvas background for board overlay |
| `frontend/src/components/GameTable/GameBoard.tsx` | Create | Canvas ref; init Pixi + `buildBoardScene` |
| `frontend/src/components/GameTable/PlayerStatusRow.tsx` | Create | Them / You status + timer rows |
| `frontend/src/components/GameTable/TopBar.tsx` | Create | Home, help, settings buttons |
| `frontend/src/components/GameTable/BottomBar.tsx` | Create | Clock + "Online Game" footer |
| `frontend/src/components/GameTable/MainContent.tsx` | Create | Stacks status rows + `GameBoard` |
| `frontend/src/components/GameTable/GameTable.tsx` | Create | Root 393×852 layout + gradient |
| `frontend/src/App.tsx` | Modify | Mount `GameTable` centered on page |
| `frontend/src/components/GameCanvas.tsx` | Delete | Replaced by `GameBoard` |

---

## Task 1: Add GameBoard composite asset

**Files:**
- Create: `frontend/public/assets/game-board/board.png`

- [ ] **Step 1: Export `GameBoard` from Figma**

In Figma, select node **GameBoard** (`55:749`) — or use MCP `get_screenshot`:

```bash
# From repo root; implementer obtains PNG URL from Figma MCP get_screenshot
# fileKey=7or2mH8PehFfpR7d8y2c4N nodeId=55:749 maxDimension=4096
mkdir -p frontend/public/assets/game-board
curl -fsSL "<screenshot-url>" -o frontend/public/assets/game-board/board.png
```

Expected file: **389×328** px (accept ±2px from export scaling; sprite will scale to 389×328 in code).

- [ ] **Step 2: Verify asset dimensions**

```bash
file frontend/public/assets/game-board/board.png
# Expected: PNG image data, 389 x 328 (or proportional; note dimensions)
```

- [ ] **Step 3: Commit**

```bash
git add frontend/public/assets/game-board/board.png
git commit -m "chore: add GameBoard composite asset for Pixi"
```

---

## Task 2: Pixi board scene + transparent app background

**Files:**
- Create: `frontend/src/game/boardScene.ts`
- Modify: `frontend/src/game/app.ts`

- [ ] **Step 1: Update `createPixiApp` for transparent background**

Replace `frontend/src/game/app.ts` with:

```typescript
import { Application } from 'pixi.js'

export async function createPixiApp(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): Promise<Application> {
  const app = new Application()
  await app.init({
    canvas,
    width,
    height,
    backgroundAlpha: 0,
  })
  return app
}
```

- [ ] **Step 2: Create `boardScene.ts`**

Create `frontend/src/game/boardScene.ts`:

```typescript
import { Application, Assets, Sprite } from 'pixi.js'

const BOARD_WIDTH = 389
const BOARD_HEIGHT = 328
const BOARD_TEXTURE = '/assets/game-board/board.png'

export async function buildBoardScene(app: Application): Promise<void> {
  const texture = await Assets.load(BOARD_TEXTURE)
  const board = new Sprite(texture)
  board.width = BOARD_WIDTH
  board.height = BOARD_HEIGHT
  app.stage.addChild(board)
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
make build
```

Expected: exit code **0** (board scene is not imported yet; only checks `app.ts` change compiles).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/game/app.ts frontend/src/game/boardScene.ts
git commit -m "feat: add Pixi board scene loader and transparent canvas"
```

---

## Task 3: GameBoard React component (Pixi lifecycle)

**Files:**
- Create: `frontend/src/components/GameTable/GameBoard.tsx`

- [ ] **Step 1: Create `GameBoard.tsx`**

Create `frontend/src/components/GameTable/GameBoard.tsx`:

```typescript
import { useEffect, useRef } from 'react'
import { type Application } from 'pixi.js'
import { createPixiApp } from '../../game/app'
import { buildBoardScene } from '../../game/boardScene'

const BOARD_WIDTH = 389
const BOARD_HEIGHT = 328

export default function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false

    createPixiApp(canvas, BOARD_WIDTH, BOARD_HEIGHT).then(async (app) => {
      if (cancelled) {
        app.destroy()
        return
      }
      await buildBoardScene(app)
      appRef.current = app
    })

    return () => {
      cancelled = true
      appRef.current?.destroy()
      appRef.current = null
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={BOARD_WIDTH}
      height={BOARD_HEIGHT}
      className="block shrink-0"
    />
  )
}
```

- [ ] **Step 2: Temporary mount in `App.tsx` to verify board renders**

Modify `frontend/src/App.tsx` temporarily:

```typescript
import GameBoard from './components/GameTable/GameBoard'

export default function App() {
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-900">
      <GameBoard />
    </div>
  )
}
```

- [ ] **Step 3: Run dev and verify Pixi board**

```bash
make dev
```

Open http://localhost:5173 — Expected: backgammon board image (389×328) on dark page, no console errors.

- [ ] **Step 4: Revert `App.tsx` placeholder** (restored in Task 6)

Undo `App.tsx` to current `GameCanvas` import until Task 6, **or** leave as `GameBoard` if Task 6 immediately follows.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/GameTable/GameBoard.tsx
git commit -m "feat: add GameBoard Pixi canvas component"
```

---

## Task 4: React chrome — TopBar, PlayerStatusRow, BottomBar

**Files:**
- Create: `frontend/src/components/GameTable/TopBar.tsx`
- Create: `frontend/src/components/GameTable/PlayerStatusRow.tsx`
- Create: `frontend/src/components/GameTable/BottomBar.tsx`

- [ ] **Step 1: Create `TopBar.tsx`**

```typescript
import type { ReactNode } from 'react'

function IconButton({
  children,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  'aria-label': string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-black/60 shadow-lg"
    >
      {children}
    </button>
  )
}

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function TopBar() {
  return (
    <header className="flex w-full shrink-0 items-center justify-between px-6 py-4">
      <IconButton aria-label="Home">
        <HomeIcon />
      </IconButton>
      <div className="flex items-center gap-2">
        <IconButton aria-label="Help">
          <span className="text-xl font-bold leading-none text-white">?</span>
        </IconButton>
        <IconButton aria-label="Settings">
          <SettingsIcon />
        </IconButton>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create `PlayerStatusRow.tsx`**

```typescript
type Side = 'them' | 'you'

const config = {
  them: {
    name: 'Them',
    swatchClass: 'bg-[#d42200] border-[#a81800]',
    panelBorder: 'border border-[#e8d4b0]',
    align: 'items-end',
  },
  you: {
    name: 'You',
    swatchClass: 'bg-[#e0dcd5] border-[#9a9490]',
    panelBorder: '',
    align: 'items-start',
  },
} as const

export default function PlayerStatusRow({ side }: { side: Side }) {
  const { name, swatchClass, panelBorder, align } = config[side]

  return (
    <div className={`flex h-8 w-[389px] shrink-0 gap-6 ${align} justify-end`}>
      <div
        className={`flex items-center gap-2 rounded-lg bg-[#1c1c1c] px-2 py-1 shadow-[0_2px_4px_rgba(0,0,0,0.55)] ${panelBorder}`}
      >
        <span className={`size-3 shrink-0 rounded-md border ${swatchClass}`} />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold leading-3 text-white">{name}</span>
          <span className="text-[10px] leading-[10px] text-[#aaa]">PIP: 158 5:0 / 1</span>
        </div>
      </div>
      <div className="flex items-center rounded-lg bg-[#1c1c1c] px-2 py-1 shadow-[0_2px_4px_rgba(0,0,0,0.55)]">
        <span className="text-[10px] text-[#aaa]">Timer:&nbsp;</span>
        <span className="text-xs font-bold text-[#1c1c1c]">00:00</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `BottomBar.tsx`**

```typescript
export default function BottomBar() {
  return (
    <footer className="flex h-12 w-full shrink-0 items-center justify-between p-4">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-white">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
          <path d="M12 7v5l3 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>00:14</span>
      </div>
      <div className="flex items-center gap-2 text-[15px] font-semibold text-white">
        <span>Online Game</span>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="white" aria-hidden>
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l7.1-1.01L12 2z" />
        </svg>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Verify compile**

```bash
make build
```

Expected: PASS only if files are imported; otherwise run `pnpm --prefix frontend exec tsc -b` after adding imports in Task 5. Minimum: no syntax errors in new files.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/GameTable/TopBar.tsx \
        frontend/src/components/GameTable/PlayerStatusRow.tsx \
        frontend/src/components/GameTable/BottomBar.tsx
git commit -m "feat: add GameTable React chrome components"
```

---

## Task 5: MainContent + GameTable root

**Files:**
- Create: `frontend/src/components/GameTable/MainContent.tsx`
- Create: `frontend/src/components/GameTable/GameTable.tsx`

- [ ] **Step 1: Create `MainContent.tsx`**

```typescript
import GameBoard from './GameBoard'
import PlayerStatusRow from './PlayerStatusRow'

export default function MainContent() {
  return (
    <main className="flex w-full flex-col items-center">
      <PlayerStatusRow side="them" />
      <GameBoard />
      <PlayerStatusRow side="you" />
    </main>
  )
}
```

- [ ] **Step 2: Create `GameTable.tsx`**

```typescript
import BottomBar from './BottomBar'
import MainContent from './MainContent'
import TopBar from './TopBar'

const PAGE_GRADIENT =
  'linear-gradient(180deg, #3d6db5 0%, #3e6cb5 16.67%, #3f6bb5 33.33%, #406ab5 50%, #3d68b2 57.14%, #3b65af 64.29%, #3863ac 71.43%, #3561a8 78.57%, #325fa5 85.71%, #305ca2 92.86%, #2d5a9f 100%)'

export default function GameTable() {
  return (
    <div
      className="flex h-[852px] w-[393px] flex-col justify-between overflow-hidden"
      style={{ background: PAGE_GRADIENT }}
    >
      <TopBar />
      <MainContent />
      <BottomBar />
    </div>
  )
}
```

- [ ] **Step 3: Verify compile**

```bash
make build
```

Expected: exit code **0**.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/GameTable/MainContent.tsx \
        frontend/src/components/GameTable/GameTable.tsx
git commit -m "feat: compose GameTable layout from chrome and GameBoard"
```

---

## Task 6: Wire App, remove GameCanvas, final verification

**Files:**
- Modify: `frontend/src/App.tsx`
- Delete: `frontend/src/components/GameCanvas.tsx`

- [ ] **Step 1: Update `App.tsx`**

Replace `frontend/src/App.tsx` with:

```typescript
import GameTable from './components/GameTable/GameTable'

export default function App() {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gray-900">
      <GameTable />
    </div>
  )
}
```

- [ ] **Step 2: Delete unused `GameCanvas.tsx`**

```bash
rm frontend/src/components/GameCanvas.tsx
```

- [ ] **Step 3: Production build**

```bash
make build
```

Expected:

```
✓ built in ...
```

Exit code **0**.

- [ ] **Step 4: Dev visual check**

```bash
make dev
```

Open http://localhost:5173 — Expected:

- Blue gradient phone frame **393×852**
- TopBar: home + ? + settings on semi-transparent buttons
- Them / You status rows with PIP text and timers
- Pixi board **389×328** between rows (matches Figma `GameBoard`)
- BottomBar: `00:14` and `Online Game` with star

- [ ] **Step 5: Confirm canvas size in DevTools**

Select `<canvas>` — Expected attributes: `width="389"` `height="328"`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.tsx
git rm frontend/src/components/GameCanvas.tsx
git commit -m "feat: mount GameTable in App and remove GameCanvas placeholder"
```

---

## Spec Coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Pixi boundary 389×328 full GameBoard | Task 1 asset, Task 2–3 |
| React TopBar / MainContent / status / BottomBar | Task 4–5 |
| `GameTable` 393×852 gradient | Task 5 |
| Replace `GameCanvas` in App | Task 6 |
| Static demo data | Task 4 hardcoded strings |
| No game logic / no new deps | Entire plan |
| `make build` verification | Tasks 2, 5, 6 |

## Out of scope (confirmed not in plan)

- Game rules, drag-and-drop, animations, networking
- Other Figma variants / modals
- Vitest/unit tests (no test runner in repo; verification is `make build` + visual)

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-26-game-table.md`. Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — run tasks in this session with checkpoints (`executing-plans`)

Which approach do you want?
