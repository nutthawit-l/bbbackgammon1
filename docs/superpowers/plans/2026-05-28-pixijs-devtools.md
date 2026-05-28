# PixiJS DevTools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable official PixiJS DevTools in development for `GameBoard` while keeping production builds free of devtools initialization.

**Architecture:** Keep integration inline in `GameBoard.tsx` by wiring `Application` `onInit(app)` to call `initDevtools({ app })` only when `import.meta.env.DEV` is true. Use dynamic import for clear production separation and no behavior change outside development. Document manual Chrome extension setup and add an optional Makefile helper target.

**Tech Stack:** Vite 6, React 19, TypeScript, `@pixi/react` 8, `pixi.js` 8, `@pixi/devtools` (devDependency), pnpm, Makefile.

---

## Scope Check

This spec targets one subsystem (frontend Pixi dev tooling) and does not need to be split into multiple independent plans.

## Assumptions

- The frontend package remains managed with `pnpm` and invoked from root Makefile targets.
- No existing automated test framework is required for this change; verification is via focused command checks (`build`, `preview`) and manual runtime confirmation in Chrome DevTools.
- `GameBoard` remains the single Pixi `Application` entry point.

## File Structure and Responsibilities

- Modify: `frontend/package.json`
  - Add `@pixi/devtools` in `devDependencies`.
- Modify: `frontend/src/components/GameTable/GameBoard.tsx`
  - Register Pixi app in dev via `onInit`.
  - Keep board rendering unchanged.
- Create: `docs/pixijs-devtools.md`
  - Contributor setup and usage instructions for extension + dev flow.
- Modify: `Makefile`
  - Add optional `devtools-help` target and include it in `.PHONY`.

### Task 1: Add Pixi DevTools dependency

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/pnpm-lock.yaml` (auto-updated by pnpm)
- Verify: `frontend/package.json`

- [ ] **Step 1: Add dev dependency using pnpm**

Run: `pnpm --prefix frontend add -D @pixi/devtools`
Expected: pnpm reports `@pixi/devtools` added under `devDependencies` and updates lockfile.

- [ ] **Step 2: Verify dependency landed in package manifest**

Run: `pnpm --prefix frontend exec node -e "const p=require('./package.json'); console.log(!!(p.devDependencies&&p.devDependencies['@pixi/devtools']))"`
Expected: outputs `true`.

- [ ] **Step 3: Commit dependency update**

```bash
git add frontend/package.json frontend/pnpm-lock.yaml
git commit -m "chore(frontend): add pixi devtools dev dependency"
```

### Task 2: Wire dev-only init in `GameBoard`

**Files:**
- Modify: `frontend/src/components/GameTable/GameBoard.tsx`
- Verify: `frontend/src/components/GameTable/GameBoard.tsx`

- [ ] **Step 1: Add failing static check for missing `onInit` hook**

Run: `rg "onInit=\\{\\(app\\)" frontend/src/components/GameTable/GameBoard.tsx`
Expected: command exits non-zero before implementation (no match).

- [ ] **Step 2: Implement minimal dev-only `onInit` registration**

```tsx
import { Application } from '@pixi/react'
import BoardScene from './BoardScene'

const BOARD_WIDTH = 389
const BOARD_HEIGHT = 328

export default function GameBoard() {
  return (
    <Application
      width={BOARD_WIDTH}
      height={BOARD_HEIGHT}
      backgroundAlpha={0}
      className="block shrink-0"
      onInit={(app) => {
        if (import.meta.env.DEV) {
          void import('@pixi/devtools').then(({ initDevtools }) => {
            initDevtools({ app })
          })
        }
      }}
    >
      <BoardScene />
    </Application>
  )
}
```

- [ ] **Step 3: Re-run static check to verify hook exists**

Run: `rg "onInit=\\{\\(app\\)" frontend/src/components/GameTable/GameBoard.tsx`
Expected: one match in `GameBoard.tsx`.

- [ ] **Step 4: Build production bundle to verify no compile regressions**

Run: `pnpm --prefix frontend build`
Expected: successful TypeScript + Vite production build.

- [ ] **Step 5: Commit `GameBoard` wiring**

```bash
git add frontend/src/components/GameTable/GameBoard.tsx
git commit -m "feat(frontend): register pixi app with devtools in dev mode"
```

### Task 3: Add contributor docs for PixiJS DevTools

**Files:**
- Create: `docs/pixijs-devtools.md`
- Verify: `docs/pixijs-devtools.md`

- [ ] **Step 1: Add documentation file**

```md
# PixiJS DevTools (Chrome)

## Setup

1. Install the Chrome extension: https://pixijs.io/devtools/docs/guide/installation/
2. Ensure frontend dev dependencies are installed:

```bash
pnpm --prefix frontend install
```

## Usage

1. Start the app:

```bash
make dev
```

2. Open the app in Chrome.
3. Open Chrome DevTools and select the **PixiJS** panel (under `>>` if hidden).
4. Inspect `GameBoard` / `BoardScene` nodes from the scene graph.

## Notes

- DevTools wiring is development-only (`import.meta.env.DEV`).
- Production builds and `make preview` do not initialize Pixi DevTools.
```

- [ ] **Step 2: Verify doc includes required extension URL and dev-only note**

Run: `rg "pixijs.io/devtools/docs/guide/installation|development-only|import.meta.env.DEV" docs/pixijs-devtools.md`
Expected: three matches covering install URL and dev-only behavior.

- [ ] **Step 3: Commit docs**

```bash
git add docs/pixijs-devtools.md
git commit -m "docs: add pixijs devtools setup guide"
```

### Task 4: Add optional `make devtools-help` convenience target

**Files:**
- Modify: `Makefile`
- Verify: `Makefile`

- [ ] **Step 1: Add target to Makefile**

```makefile
.PHONY: dev build preview devtools-help

dev:
	pnpm --prefix frontend dev

build:
	pnpm --prefix frontend build

preview:
	pnpm --prefix frontend preview

devtools-help:
	@echo "Install Chrome extension: https://pixijs.io/devtools/docs/guide/installation/"
	@echo "Ensure @pixi/devtools is installed: pnpm --prefix frontend add -D @pixi/devtools"
```

- [ ] **Step 2: Run help target**

Run: `make devtools-help`
Expected: prints extension install URL and package install command with no errors.

- [ ] **Step 3: Commit Makefile update**

```bash
git add Makefile
git commit -m "chore: add make target for pixijs devtools setup help"
```

### Task 5: End-to-end verification and final integration commit

**Files:**
- Verify: `frontend/src/components/GameTable/GameBoard.tsx`
- Verify: `docs/pixijs-devtools.md`
- Verify: `Makefile`

- [ ] **Step 1: Verify production path**

Run: `pnpm --prefix frontend build && pnpm --prefix frontend preview`
Expected: build succeeds and preview starts with no runtime requirement for extension.

- [ ] **Step 2: Verify development PixiJS panel behavior**

Run: `make dev`
Expected: app runs locally; in Chrome DevTools with extension installed, PixiJS panel shows stage tree for `GameBoard`/`BoardScene`.

- [ ] **Step 3: Verify changed files only**

Run: `git status --short`
Expected: only these paths are changed or committed:
- `frontend/package.json`
- `frontend/pnpm-lock.yaml`
- `frontend/src/components/GameTable/GameBoard.tsx`
- `docs/pixijs-devtools.md`
- `Makefile`

- [ ] **Step 4: Create final integration commit (if tasks were not committed individually)**

```bash
git add frontend/package.json frontend/pnpm-lock.yaml frontend/src/components/GameTable/GameBoard.tsx docs/pixijs-devtools.md Makefile
git commit -m "feat: enable pixijs devtools for local development"
```

## Self-Review

### 1) Spec coverage

- Dependency addition covered in **Task 1**.
- `GameBoard.tsx` `onInit` dev-only wiring with dynamic import covered in **Task 2**.
- Documentation for extension install + usage + dev-only note covered in **Task 3**.
- Optional Makefile convenience target covered in **Task 4**.
- Verification checks from spec (`build`, dev panel behavior, preview) covered in **Task 5**.
- No out-of-scope changes (no scene/game logic edits) included.

### 2) Placeholder scan

- No TODO/TBD placeholders present.
- Every action step includes exact command or concrete code.

### 3) Type/signature consistency

- `onInit={(app) => ...}` and `initDevtools({ app })` usage is consistent across all tasks.
- File paths and command prefixes remain consistent (`pnpm --prefix frontend`).
