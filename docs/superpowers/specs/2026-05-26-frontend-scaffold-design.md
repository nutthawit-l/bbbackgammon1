# Frontend Scaffold Design

**Date:** 2026-05-26
**Scope:** Create `frontend/` scaffold with Vite + React + Tailwind + PixiJS

## Stack

- **Package manager:** pnpm
- **Build tool:** Vite 6
- **UI:** React 19 + TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS v4 (configured via CSS `@import "tailwindcss"` — no config file needed)
- **Canvas/game:** PixiJS v8, integrated via manual canvas ref (no `@pixi/react`)

## Folder Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── GameCanvas.tsx
│   ├── game/
│   │   └── app.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
Makefile  (project root)
```

## Component Architecture

### `App.tsx`
Root component. Renders the page shell using Tailwind for layout/background. Mounts `<GameCanvas />`.

### `components/GameCanvas.tsx`
Holds a `<canvas>` ref. On mount, calls `createPixiApp(canvas)` from `game/app.ts` and stores the returned `Application`. On unmount, calls `app.destroy()` to clean up. No game logic here — only lifecycle management.

### `game/app.ts`
Exports `createPixiApp(canvas: HTMLCanvasElement): Promise<Application>`. Initializes PixiJS `Application` with the provided canvas element and returns it. Future game setup (stage, ticker, assets) will be added here.

## Config Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | Strict mode, `moduleResolution: bundler`, `jsx: react-jsx` |
| `vite.config.ts` | Minimal — React plugin only |
| `index.html` | Standard Vite entry, mounts `#root` |
| `src/index.css` | `@import "tailwindcss"` |
| `Makefile` | `dev`, `build`, `preview` targets via pnpm |
| `.gitignore` | node_modules, dist, .env |

## Makefile Targets

```makefile
dev:     pnpm --prefix frontend dev
build:   pnpm --prefix frontend build
preview: pnpm --prefix frontend preview
```

## Out of Scope

- Game logic (boards, pieces, dice)
- State management
- Routing
- Backend integration
