# LLM-friendly test setup

This repo keeps the Vitest and Playwright wiring in the local `@luma.gl/devtools` workspace so agents and contributors can use a small set of stable top-level commands without needing to remember the underlying runner details.

## How it is structured

- The root package exposes the user-facing commands:
  - `yarn test-node`
  - `yarn test-browser`
  - `yarn test-headless`
  - `yarn test-coverage`
  - `yarn playwright`
  - `yarn playwright:install`
- Those commands delegate into the `@luma.gl/devtools` workspace.
- The reusable configuration and helpers live under `devtools/`.
- Repo-specific policy lives in `.ocularrc.js`.

## Why this is LLM-friendly

- There is one stable command surface at the repo root.
- The reusable boilerplate is separated from luma-specific overrides.
- Agents can inspect `devtools/` to understand the actual Vitest and Playwright behavior.
- `.ocularrc.js` shows which values are local repo extensions instead of reusable defaults.

## Vitest behavior

- `vitest.config.ts` delegates to `getVitestConfig()` from `devtools`.
- The config creates three projects:
  - `node`
  - `browser`
  - `headless`
- Browser execution uses Playwright through the devtools workspace.
- The tape-style compatibility helper lives at `devtools/vitest/vitest-tape.ts`.
- `test/utils/vitest-tape.ts` is currently a compatibility re-export.

## Playwright behavior

- `yarn playwright` runs the thin CLI wrapper in `devtools/playwright`.
- Example aliases and defaults come from `.ocularrc.js`.
- The runner can:
  - open any website example by route or alias
  - switch between `WebGPU` and `WebGL2`
  - collect console and page diagnostics
  - launch a debug-enabled Chromium or attach over CDP

## Practical guidance for agents

- Prefer the root scripts instead of calling workspace binaries directly.
- When changing shared test tooling, update `devtools/` first and keep root scripts thin.
- When changing repo-specific test policy, update `.ocularrc.js`.
- When explaining the test harness, point readers here and to:
  - `devtools/docs/vitest.md`
  - `devtools/docs/playwright.md`
  - `devtools/docs/configuration.md`
