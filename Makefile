.PHONY: dev build preview

dev:
	pnpm --prefix frontend dev

build:
	pnpm --prefix frontend build

preview:
	pnpm --prefix frontend preview
