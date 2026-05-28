# PixiJS DevTools Setup Design

**Date:** 2026-05-27  
**Scope:** Enable official PixiJS DevTools (Chrome extension) for local development of the game board canvas

## Decisions (approved)

| Topic | Choice |
|-------|--------|
| DevTools UI | **Chrome extension only** — no embedded/local DevTools panel |
| When active | **Dev only** — `import.meta.env.DEV`; no initialization in production builds |
| Wiring location | **Inline in `GameBoard.tsx`** — `onInit` on `@pixi/react` `<Application>` |
| Integration API | **`@pixi/devtools`** — `initDevtools({ app })` (preferred over manual globals) |
| Dynamic import | **Optional** — dynamic `import('@pixi/devtools')` inside `onInit` recommended for clearer prod bundle separation; static dev import behind DEV guard is acceptable |

## Goal

Developers can inspect and tweak the Pixi scene graph (board, checkers, `Graphics` nodes) using the official PixiJS DevTools Chrome panel while running `make dev`, without shipping devtools code or behavior in production.

## Out of scope

- Embedded or standalone local DevTools UI (split view / separate dev app)
- Custom inspector panels or in-app debugging UI
- Multiple Pixi `Application` instances (project has one: `GameBoard`)
- Automating Chrome Web Store install (documented manual step per developer)
- Changes to game logic, `BoardScene`, or React layout beyond `GameBoard` devtools hook

## Current context

- **Stack:** Vite 6, React 19, `pixi.js` ^8, `@pixi/react` ^8
- **Pixi entry:** `frontend/src/components/GameTable/GameBoard.tsx` — single `<Application>` (389×328) wrapping `BoardScene`
- **No existing devtools:** `@pixi/devtools` not in `package.json`; no `__PIXI_DEVTOOLS__` / `__PIXI_APP__` globals

## Architecture

```
Developer machine
├── Chrome + PixiJS DevTools extension (manual install)
└── make dev → Vite frontend
    └── GameBoard.tsx
        └── <Application onInit={...}>
            └── DEV: initDevtools({ app })  ← bridges app to extension
            └── BoardScene (unchanged)
```

### Data flow

1. `@pixi/react` creates `PIXI.Application` and invokes `onInit(app)`.
2. In development only, `initDevtools({ app })` registers the app with the DevTools bridge (`window.__PIXI_DEVTOOLS__` internally).
3. Developer opens Chrome DevTools on the app tab and selects the **PixiJS** panel.
4. Extension reads the registered app and displays the scene graph / property editor.

Production builds never call step 2.

## Implementation

### 1. Dependency

Add to `frontend/package.json` **devDependencies**:

```bash
pnpm --prefix frontend add -D @pixi/devtools
```

Use a version compatible with PixiJS v8 (extension docs target v7/v8).

### 2. `GameBoard.tsx`

Add `onInit` to `<Application>`:

```tsx
onInit={(app) => {
  if (import.meta.env.DEV) {
    void import('@pixi/devtools').then(({ initDevtools }) => {
      initDevtools({ app })
    })
  }
}}
```

**Alternative (simpler):** top-level dev-only import and synchronous `initDevtools({ app })` inside the same guard if Vite dead-code elimination is sufficient.

**StrictMode:** React StrictMode may double-invoke setup in dev. If duplicate registration causes issues, add a module-level guard (`let devtoolsRegistered = false`) only if observed during verification.

No changes required to `App.tsx`, `BoardScene.tsx`, or `main.tsx`.

### 3. Documentation

Add a short **PixiJS DevTools** section (choose one location; prefer `frontend/README.md` if it exists, otherwise project `README.md` or `docs/` note):

1. Install [PixiJS DevTools Chrome extension](https://pixijs.io/devtools/docs/guide/installation/).
2. Run `make dev`, open the app in Chrome.
3. Open DevTools → **PixiJS** panel (may appear under `>>`).
4. Note: dev-only; production builds are unaffected.

### 4. Makefile (optional)

Optional convenience target (documentation only, no install side effects):

```makefile
.PHONY: devtools-help
devtools-help:
	@echo "Install Chrome extension: https://pixijs.io/devtools/docs/guide/installation/"
	@echo "Ensure @pixi/devtools is installed: pnpm --prefix frontend add -D @pixi/devtools"
```

## Error handling

| Situation | Behavior |
|-----------|----------|
| Extension not installed | App runs normally; PixiJS panel missing or empty — see docs |
| `@pixi/devtools` not installed | Dev server fails when `onInit` import runs — run `pnpm install` |
| Non-Chrome browser | Extension unavailable; use Chrome for Pixi debugging |

## Verification

| Check | Expected |
|-------|----------|
| `pnpm --prefix frontend build` | Success; production bundle does not require or execute devtools init |
| `make dev` + Chrome + extension | PixiJS panel shows stage tree for `GameBoard` / `BoardScene` |
| `pnpm --prefix frontend preview` (prod build) | No devtools registration at runtime |

## Success criteria

- [ ] In development, Chrome PixiJS DevTools panel attaches to the game canvas
- [ ] Production build completes with no devtools initialization at runtime
- [ ] New contributor can follow docs to set up extension + dev dependency

## References

- [PixiJS DevTools — Installation](https://pixijs.io/devtools/docs/guide/installation/)
- [@pixi/react — DevTools discussion (onInit)](https://github.com/pixijs/pixi-react/issues/629)
