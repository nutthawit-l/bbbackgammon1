# Frontend Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a `frontend/` directory with Vite + React + TypeScript (strict) + Tailwind CSS v4 + PixiJS v8, using a manual canvas ref pattern.

**Architecture:** React handles the page shell and component lifecycle. A single `GameCanvas` component owns the `<canvas>` element and manages PixiJS `Application` init/destroy. PixiJS initialization logic lives in `game/app.ts`, cleanly separated from React. Tailwind v4 is wired as a Vite plugin — no config file needed.

**Tech Stack:** Vite 6, React 19, TypeScript 5 (strict), Tailwind CSS v4 + `@tailwindcss/vite`, PixiJS v8, pnpm

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `frontend/package.json` | Create | Dependencies + scripts |
| `frontend/tsconfig.json` | Create | Project references root |
| `frontend/tsconfig.app.json` | Create | Strict TS config for src/ |
| `frontend/tsconfig.node.json` | Create | Strict TS config for vite.config.ts |
| `frontend/vite.config.ts` | Create | React + Tailwind v4 Vite plugins |
| `frontend/index.html` | Create | Vite HTML entry point |
| `frontend/.gitignore` | Create | Ignore node_modules, dist, .env |
| `frontend/src/index.css` | Create | Tailwind v4 import |
| `frontend/src/main.tsx` | Create | React root mount |
| `frontend/src/App.tsx` | Create | Page shell with Tailwind layout |
| `frontend/src/game/app.ts` | Create | PixiJS Application factory |
| `frontend/src/components/GameCanvas.tsx` | Create | Canvas ref + PixiJS lifecycle |
| `Makefile` | Create | dev/build/preview targets (project root) |

---

## Task 1: Initialize the frontend project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/.gitignore`

- [ ] **Step 1: Create the frontend directory**

```bash
mkdir -p frontend
```

- [ ] **Step 2: Create `frontend/package.json`**

```json
{
  "name": "bbbackgammon-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "pixi.js": "^8.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 3: Create `frontend/.gitignore`**

```
node_modules
dist
.env
*.local
```

- [ ] **Step 4: Install dependencies**

```bash
pnpm --prefix frontend install
```

Expected: `node_modules/` created inside `frontend/`, no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/.gitignore frontend/pnpm-lock.yaml
git commit -m "chore: init frontend package.json and install deps"
```

---

## Task 2: Configure TypeScript

**Files:**
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/tsconfig.node.json`

- [ ] **Step 1: Create `frontend/tsconfig.json`** (project references root)

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 2: Create `frontend/tsconfig.app.json`** (for `src/`)

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `frontend/tsconfig.node.json`** (for `vite.config.ts`)

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json
git commit -m "chore: add TypeScript strict config"
```

---

## Task 3: Configure Vite

**Files:**
- Create: `frontend/vite.config.ts`

- [ ] **Step 1: Create `frontend/vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 2: Verify TypeScript accepts the config**

```bash
cd frontend && pnpm exec tsc -p tsconfig.node.json --noEmit
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add frontend/vite.config.ts
git commit -m "chore: add Vite config with React and Tailwind v4 plugins"
```

---

## Task 4: Create HTML entry and CSS

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/src/index.css`

- [ ] **Step 1: Create `frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>bbbackgammon</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create `frontend/src/index.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html frontend/src/index.css
git commit -m "chore: add HTML entry and Tailwind v4 CSS"
```

---

## Task 5: Create React entry point

**Files:**
- Create: `frontend/src/main.tsx`

- [ ] **Step 1: Create `frontend/src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/main.tsx
git commit -m "chore: add React entry point"
```

---

## Task 6: Create PixiJS Application factory

**Files:**
- Create: `frontend/src/game/app.ts`

- [ ] **Step 1: Create `frontend/src/game/app.ts`**

```ts
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
    background: 0x1a1a2e,
  })
  return app
}
```

- [ ] **Step 2: Verify TypeScript accepts the file**

```bash
cd frontend && pnpm exec tsc -p tsconfig.app.json --noEmit
```

Expected: error about missing `App.tsx` and `GameCanvas.tsx` (those don't exist yet) — that's fine. There must be **no** error in `game/app.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/game/app.ts
git commit -m "feat: add PixiJS Application factory"
```

---

## Task 7: Create GameCanvas component

**Files:**
- Create: `frontend/src/components/GameCanvas.tsx`

- [ ] **Step 1: Create `frontend/src/components/GameCanvas.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import { type Application } from 'pixi.js'
import { createPixiApp } from '../game/app'

interface Props {
  width: number
  height: number
}

export default function GameCanvas({ width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false

    createPixiApp(canvas, width, height).then((app) => {
      if (cancelled) {
        app.destroy()
        return
      }
      appRef.current = app
    })

    return () => {
      cancelled = true
      appRef.current?.destroy()
      appRef.current = null
    }
  }, [width, height])

  return <canvas ref={canvasRef} />
}
```

Note: The `cancelled` flag guards against React StrictMode's double-invocation of effects — if cleanup runs before the async `init` resolves, the app is destroyed immediately instead of leaking.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/GameCanvas.tsx
git commit -m "feat: add GameCanvas component with PixiJS lifecycle management"
```

---

## Task 8: Create App component and verify full build

**Files:**
- Create: `frontend/src/App.tsx`

- [ ] **Step 1: Create `frontend/src/App.tsx`**

```tsx
import GameCanvas from './components/GameCanvas'

export default function App() {
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-900">
      <GameCanvas width={800} height={600} />
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check across all src/ files**

```bash
cd frontend && pnpm exec tsc -p tsconfig.app.json --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Run production build**

```bash
cd frontend && pnpm build
```

Expected: `dist/` folder created, output ends with something like:
```
✓ built in Xs
```
No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: add App shell, verify full TypeScript + Vite build passes"
```

---

## Task 9: Create Makefile

**Files:**
- Create: `Makefile` (project root)

- [ ] **Step 1: Create `Makefile` at project root**

```makefile
.PHONY: dev build preview

dev:
	pnpm --prefix frontend dev

build:
	pnpm --prefix frontend build

preview:
	pnpm --prefix frontend preview
```

> Note: The indentation in Makefile rules **must be a tab character**, not spaces.

- [ ] **Step 2: Verify Makefile targets work**

```bash
make build
```

Expected: same successful build output as Task 8 Step 3.

- [ ] **Step 3: Commit**

```bash
git add Makefile
git commit -m "chore: add Makefile with dev/build/preview targets"
```

---

## Spec Coverage Check

| Spec requirement | Covered by |
|-----------------|------------|
| pnpm package manager | Task 1 |
| Vite 6 | Task 1 (package.json), Task 3 |
| React 19 + TypeScript 5 strict | Task 1, Task 2 |
| Tailwind CSS v4 via CSS import | Task 3 (vite plugin), Task 4 (CSS) |
| PixiJS v8 | Task 1, Task 6 |
| Manual canvas ref pattern | Task 7 |
| `game/app.ts` factory | Task 6 |
| `components/GameCanvas.tsx` | Task 7 |
| `App.tsx` shell | Task 8 |
| Makefile dev/build/preview | Task 9 |
| `.gitignore` | Task 1 |
