# LLM-friendly test setup

This repo uses `@vis.gl/dev-tools` for shared Vitest wiring and keeps repository-specific Playwright utilities under `scripts/playwright/` so agents and contributors can use a small set of stable top-level commands without needing to remember the underlying runner details.

## How it is structured

- The root package exposes the user-facing commands:
  - `yarn test-node`
  - `yarn test-node-coverage`
  - `yarn test-browser`
  - `yarn test-browser-benchmarks`
  - `yarn test-headless`
  - `yarn test-coverage`
  - `yarn website-debug`
  - `yarn playwright:install`
- The test commands use `@vis.gl/dev-tools`.
- Repository-specific Vitest configuration lives in `vitest.config.ts`.
- Vitest, the Playwright provider, and Istanbul coverage are pinned to 5.0.2, following
  [loaders.gl #4072](https://github.com/visgl/loaders.gl/pull/4072). The browser package
  resolutions align the Vitest 4 dependencies still declared by `@vis.gl/dev-tools`;
  remove them after upgrading to native Vitest 5 support
  ([dev-tools #59](https://github.com/visgl/dev-tools/pull/59)).
- CI merges LCOV coverage directly, so the explicit blob-report paths used by loaders.gl
  are unnecessary here.
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
- Node test files run in worker threads and reuse the worker's module graph. Tests that replace
  globals or mutate module-level state must restore that state in an `afterEach` or `afterAll` hook.
- `nodeOnlyTestPatterns` routes audited CPU-only legacy specs away from browser-page isolation.
- Browser test files remain isolated because GPU devices, presentation contexts, and queued GPU
  work are not safe to share between files.
- Browser coverage uses weighted sharding so known slow GPU specs are spread across the existing
  three CI jobs. Benchmark-only specs run with `yarn test-browser-benchmarks` instead of adding
  instrumented browser pages to every pull request.
- CI merges focused Istanbul coverage from CPU-only specs moved to Node and native Node coverage
  anchors with Istanbul coverage from the three browser shards. The complete Node suite still runs
  separately without instrumentation so coverage remapping does not slow the build job.
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

## Example visual test workload

Flow, weather, globe clouds, and the fog smoke test render at half the CSS pixel size
by default. `scripts/playwright/visual-test-utils.mjs` sets the actual canvas pixel
ratio and verifies its dimensions; screenshots stay in CSS coordinates so image
regions and assertion thresholds are unchanged. Set `LUMA_VISUAL_TEST_PIXEL_SCALE=1`
for a full-resolution diagnostic run. Thumbnail generation retains full resolution.

Flow correctness runs still exercise all three particle densities on both backends.
The six 30-frame timing samples are a separate opt-in workload:

```bash
yarn workspace luma.gl-examples-deck-flow-particles benchmark
```

`FLOW_RUN_TIMING=true` also enables these samples directly; the existing
`FLOW_SKIP_TIMING` override takes precedence. PR visual tests do not collect timing
samples because they have no performance assertions.
