# LLM-friendly test setup

This repo uses `@vis.gl/dev-tools` for shared Vitest wiring and keeps repository-specific Playwright utilities under `scripts/playwright/` so agents and contributors can use a small set of stable top-level commands without needing to remember the underlying runner details.

## How it is structured

- The root package exposes the user-facing commands:
  - `yarn test-node`
  - `yarn test-browser`
  - `yarn test-headless`
  - `yarn test-coverage`
  - `yarn website-debug`
  - `yarn playwright:install`
- The test commands use `@vis.gl/dev-tools`.
- Repository-specific Vitest configuration lives in `vitest.config.ts`.
- Repository-specific Playwright utilities live under `scripts/playwright/`.
- Playwright aliases and defaults live in `.ocularrc.js`.

## Why this is LLM-friendly

- There is one stable command surface at the repo root.
- The reusable boilerplate is separated from luma-specific overrides.
- Agents can inspect `vitest.config.ts` and `scripts/playwright/` to understand the Vitest and Playwright behavior.
- `.ocularrc.js` shows which Playwright values are local repo extensions instead of reusable defaults.

## Vitest behavior

- `vitest.config.ts` delegates to `getVitestConfig()` from `@vis.gl/dev-tools`.
- The config creates three projects:
  - `node`
  - `browser`
  - `headless`
- Browser execution uses Playwright through `@vis.gl/dev-tools`.
- The tape-style compatibility helper lives at `test/utils/vitest-tape.ts`.

## Playwright behavior

- `yarn website-debug` runs the thin CLI wrapper in `scripts/playwright/`.
- Example aliases and defaults come from `.ocularrc.js`.
- The runner can:
  - open any website example by route or alias
  - switch between `WebGPU` and `WebGL2`
  - collect console and page diagnostics
  - launch a debug-enabled Chromium or attach over CDP

## Practical guidance for agents

- Prefer the root scripts instead of calling workspace binaries directly.
- When changing shared test tooling, update `@vis.gl/dev-tools` and keep root scripts thin.
- When changing repo-specific Vitest policy, update `vitest.config.ts`.
- When changing repo-specific Playwright policy, update `.ocularrc.js` or `scripts/playwright/`.
- When explaining the test harness, point readers here and to:
  - `docs/developer/dev-tools/playwright.md`
  - `docs/developer/dev-tools/browser-debug.md`
  - `vitest.config.ts`
  - `.ocularrc.js`
