# Frontend Scaffold Design

**Date:** 2026-05-26
**Scope:** Create `frontend/` scaffold with Vite + React + Tailwind + PixiJS

## Stack

- **Package manager:** pnpm
- **Build tool:** Vite 6
- **UI:** React 19 + TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS v4 (configured via CSS `@import "tailwindcss"` — no config file needed)
- **Canvas/game:** PixiJS v8 + `@pixi/react` (declarative canvas rendering)

## Folder Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── GameCanvas.tsx
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
Uses `@pixi/react`'s `<Application>` component to render a Pixi canvas declaratively. No manual `useRef<HTMLCanvasElement>` or `app.destroy()` lifecycle — `@pixi/react` handles init and cleanup. Child Pixi display objects are expressed as JSX elements (e.g. `<pixiSprite>`).

`game/app.ts` is not needed: `@pixi/react` `<Application>` replaces the manual factory.

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
