# GameTable Component Design

**Date:** 2026-05-26  
**Figma:** [GameTable symbol](https://www.figma.com/design/7or2mH8PehFfpR7d8y2c4N/bbbackgammon?node-id=55-930) (`55:930`)  
**Scope:** Implement `GameTable` only — static visual match to the base `GameTable` symbol

## Decisions (approved)

| Topic | Choice |
|-------|--------|
| Pixi boundary | **A** — entire Figma `GameBoard` frame (**389×328**): `BoardBorder` + inner `Board` + `SideBoard` |
| Rendering strategy | **Pixi composite** — Figma-exported assets/sprites at design coordinates (v1) |
| Interactivity | None in v1 (no drag, rules, or networking) |
| Data | Hardcoded demo values from the `GameTable` symbol (PIPs, timers, checker layout) |

## Assumptions

1. Target viewport matches the symbol size: **393×852** (mobile frame); no responsive scaling in v1.
2. `GameCanvas` is superseded by `GameBoard` inside `GameTable`; `App` mounts `GameTable` instead of the dev placeholder.
3. Figma MCP asset URLs (or copies checked into `frontend/public/`) are used for board imagery; assets are refreshed manually when design changes.

## Out of scope

- Game logic, move validation, animations, board input
- Other Figma symbols (`GameTableHighlight`, `GameTableDiceFade`, modals, `Starter`, etc.)
- Routing, state management, backend
- Refactors outside `GameTable` / `GameBoard` wiring
- New npm dependencies

## Figma structure (reference)

```
GameTable (393×852) — node 55:930
├── TopBar (55:720)
├── MainContent (55:736)
│   ├── Them (55:737) — status + timer
│   ├── GameBoard (55:749) — 389×328 → PIXI
│   │   ├── BoardBorder (55:750)
│   │   │   └── Board (55:751) — 350×308
│   │   └── SideBoard (55:893) — 29×328
│   └── You (55:905) — status + timer
└── BottomBar (55:917)
```

## Component architecture

```
frontend/src/components/GameTable/
  GameTable.tsx           # Root: gradient bg, flex column, 393×852
  TopBar.tsx              # React
  MainContent.tsx         # React wrapper
  PlayerStatusRow.tsx     # React — props: side 'them' | 'you'
  GameBoard.tsx           # Canvas ref + Pixi lifecycle
  BottomBar.tsx           # React

frontend/src/game/
  app.ts                  # createPixiApp (existing; board bg if needed)
  boardScene.ts           # NEW — build GameBoard display tree from assets
```

### React vs Pixi

| Layer | Technology | Notes |
|-------|------------|--------|
| `GameTable`, `TopBar`, `MainContent`, `PlayerStatusRow`, `BottomBar` | React + Tailwind | Match Figma typography, colors, spacing |
| `GameBoard` (389×328) | PixiJS v8 | Single canvas; `boardScene.ts` owns all board-layer visuals |

### `GameBoard.tsx`

Same lifecycle pattern as current `GameCanvas.tsx`:

- `useRef` for `<canvas>`
- On mount: `createPixiApp(canvas, 389, 328)` then `buildBoardScene(app)` (or pass stage into factory)
- On unmount: `app.destroy()`

### `boardScene.ts`

- Export `buildBoardScene(app: Application): void` (or returns cleanup).
- Load textures from `public/assets/game-board/` (downloaded from Figma export) **or** from bundled imports.
- Place sprites/containers at Figma-relative positions for:
  - Board frame (`#5e3014` border, `#c8924a` surface)
  - 24 points (vector images)
  - Checker groups (red/white)
  - Bar doubling cube on board (`2`)
  - Dice (2 and 4)
  - `SideBoard`: bear-off trays, cube `64`, horizontal bars
- v1 may use a **single flattened board texture** plus separate sprites only where layering matters; prefer simplest approach that passes visual check.

### `GameTable.tsx`

- Fixed size container matching symbol: `w-[393px] h-[852px]` (or `max-w` centered on larger screens).
- Background: CSS linear gradient from Figma (`55:930` style).
- `justify-between` column: TopBar → MainContent → BottomBar.

### `PlayerStatusRow.tsx`

Props: `side: 'them' | 'you'`, optional future `pip`, `timer` strings.

v1 hardcodes copy from design:

- Them: red swatch, `PIP: 158 5:0 / 1`, `Timer: 00:00`
- You: white swatch, same PIP line, `Timer: 00:00`

## Design tokens (from Figma)

| Token | Value | Usage |
|-------|-------|--------|
| Page gradient | `#3d6db5` → `#2d5a9f` (11 stops) | `GameTable` background |
| Board border | `#5e3014` | Pixi / frame |
| Board surface | `#c8924a` | Pixi |
| Status panel bg | `#1c1c1c` | React |
| Status border | `#e8d4b0` | React (Them row) |
| Red checker / accent | `#d42200` | Pixi + React swatch |
| White checker | `#e0dcd5` | Pixi + React swatch |
| TopBar button bg | `rgba(0,0,0,0.6)` | React |

## File changes (surgical)

| Action | Path |
|--------|------|
| Create | `components/GameTable/*` (files above) |
| Create | `game/boardScene.ts` |
| Create | `public/assets/game-board/*` (exported PNGs/SVGs) |
| Edit | `App.tsx` — render `<GameTable />` instead of `<GameCanvas />` |
| Edit | `game/app.ts` — only if init options must change for board (e.g. transparent bg) |
| Leave or delete later | `GameCanvas.tsx` — unused after swap; remove in same PR if nothing imports it |

No Makefile or `package.json` changes unless asset pipeline requires a script (not expected).

## Verification plan

| Step | Check |
|------|--------|
| 1 | `make dev` — `GameTable` fills intent: blue gradient, TopBar icons, both status rows, bottom bar |
| 2 | Pixi canvas **389×328** between status rows; board visually matches Figma `GameBoard` / full `GameTable` screenshot |
| 3 | `make build` — exit code 0, no TypeScript errors |

**Done** only when steps 1–3 pass with evidence (command output + visual confirmation).

## Risks / follow-ups

- **Asset expiry:** Figma MCP URLs expire (~7 days); commit assets under `public/` during implementation.
- **Timer text color:** Figma shows `00:00` with dark text on dark panel — match design as-is; fix in design pass if intentional contrast bug.
- **Future:** Procedural Pixi graphics and interaction replace composite sprites when game logic lands.
