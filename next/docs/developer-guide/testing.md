# Testing

[Testing](https://luma.gl/next/docs/developer-guide/testing.md)[Debugging](https://luma.gl/next/docs/developer-guide/debugging.md)[Profiling](https://luma.gl/next/docs/developer-guide/profiling.md)[Bundling](https://luma.gl/next/docs/developer-guide/bundling.md)[AI agents](https://luma.gl/next/docs/developer-guide/working-with-ai.md)

luma.gl uses Vitest for Node and browser tests. Start with a focused check while working, then run the relevant repository checks before opening a pull request. GPU tests run in Chromium through Playwright and need an available browser and suitable GPU support. The root scripts provide a consistent interface for both contributors and automation.

## Set up[​](#set-up "Direct link to Set up")

From the repository root, select the version in `.nvmrc` and install dependencies:

```
nvm use

yarn install

yarn playwright:install
```

The last command installs Playwright's Chromium and WebKit browsers. See [Contributing](https://luma.gl/next/docs/developer-guide/contributing.md) for repository setup and the [setup guide](https://luma.gl/next/docs/developer-guide/installing.md) for application development.

## Choose a test command[​](#choose-a-test-command "Direct link to Choose a test command")

| Goal                               | Command                   | What it does                                        |
| ---------------------------------- | ------------------------- | --------------------------------------------------- |
| Check CPU-only behavior            | `yarn test-node`          | Runs the Node test project.                         |
| Debug browser tests locally        | `yarn test-browser`       | Runs browser-backed tests in headed Chromium.       |
| Run browser tests without a window | `yarn test-headless`      | Runs the headless browser project.                  |
| Run the standard test suite        | `yarn test`               | Runs Node tests followed by headless browser tests. |
| Run a quick check                  | `yarn test-fast`          | Runs lint and Node tests.                           |
| Collect browser coverage           | `yarn test-coverage`      | Runs headless browser tests with Istanbul coverage. |
| Collect Node coverage              | `yarn test-node-coverage` | Writes Node LCOV coverage.                          |

For a change that affects shared APIs or multiple packages, run `yarn build` as well as the relevant tests. Follow the repository's `AGENTS.md` and CI requirements for the full set of checks. A passing Node suite alone does not exercise browser or GPU behavior.

## Write and organize tests[​](#write-and-organize-tests "Direct link to Write and organize tests")

Vitest discovers specs directly. Use `*.node.spec.ts` or `*.node.spec.js` for CPU-only tests that must run in Node. Other `*.spec.ts` and `*.spec.js` files use the browser-backed path by default. An audited list in `vitest.config.ts` also routes existing CPU-only specs to Node.

Put focused tests near the behavior they cover. Use Vitest for new tests, and remove temporary `test.only` calls before committing. Node workers reuse their module graph: restore changed globals, environment variables, mocks, and shared module state in cleanup hooks. Browser tests normally isolate files; CI has explicit exceptions for audited groups.

For device tests, use the reusable WebGL and WebGPU helpers from `@luma.gl/core/test-utils`. Creating too many devices can exhaust browser GPU contexts. Use offscreen texture readback for numeric GPU assertions and reserve canvas screenshots for behavior that depends on presentation.

## Debug a website example[​](#debug-a-website-example "Direct link to Debug a website example")

The `yarn website-debug` command uses the Playwright utilities in `scripts/playwright/` and the aliases and defaults in `.ocularrc.js`. It can open an example, select a backend, collect console and page diagnostics, probe WebGPU, and capture a screenshot.

```
yarn website-debug --example showcase/persistence

yarn website-debug --example api/animation --backend webgpu-core

yarn website-debug --example persistence --backend webgl2
```

An example can be specified by route segment, full `/examples/...` route, alias, or full URL. Backend choices include `webgpu-core`, `webgpu-max`, `webgpu-compatibility`, and `webgl2`; `webgpu` is an alias for `webgpu-core`. Without an explicit backend, the runner prefers core WebGPU, then compatibility WebGPU, then WebGL2.

The runner writes a screenshot, WebGPU probe, page diagnostics, and the last URL to `.playwright-artifacts/`. For an interactive debugging connection, launch a managed browser with a debugging port or attach to a browser that was already started with one:

```
yarn website-debug --example showcase/persistence --debug-port 9222

yarn website-debug --attach=http://127.0.0.1:9222 --target-tab persistence
```

Attach mode can reuse a page matching a URL or title, or open one in the attached browser context. It cannot attach to a browser without remote debugging enabled or control the Chrome DevTools UI.

## Specialized checks[​](#specialized-checks "Direct link to Specialized checks")

### Presentation capture[​](#presentation-capture "Direct link to Presentation capture")

`yarn test-presentation` verifies canvas presentation and captured pixels for WebGPU and WebGL2. This checks the browser compositor separately from rendering logic; missing GPU support or blank captures fail with an infrastructure diagnostic. On Linux, an X display is required; use `xvfb-run -a yarn test-presentation` when appropriate.

### Physics endurance[​](#physics-endurance "Direct link to Physics endurance")

`yarn test-physics-endurance` runs the full-duration physics endurance specs without coverage instrumentation. The standard local headless suite includes the full-duration specs; release CI uses a separate group that excludes the endurance qualification. The dedicated physics workflow also runs the full matrix on a schedule and by manual dispatch.

### Benchmarks and visual checks[​](#benchmarks-and-visual-checks "Direct link to Benchmarks and visual checks")

`yarn test-browser-benchmarks` runs benchmark-only browser specs without coverage. For example-level visual checks, `LUMA_VISUAL_TEST_PIXEL_SCALE=1` requests a full-resolution diagnostic run; some visual tests normally use a smaller drawing buffer. `GLOBE_SOFTWARE_GPU=true` selects the globe software-GPU diagnostic.

### HDR capture[​](#hdr-capture "Direct link to HDR capture")

For examples that expose the HDR capture contract, add `--hdr-capture` and set the viewport if needed:

```
yarn website-debug --example showcase/tempest-ocean --backend webgpu-core --hdr-capture --viewport-width 1580 --viewport-height 780
```

The runner keeps the normal PNG and writes raw Display-P3 HDR and SDR planes plus a JSON manifest in `.playwright-artifacts/`. HDR capture requires a compatible extended-range canvas or an example-provided capture implementation; an SDR fallback is not reported as HDR.

### Legacy snapshots[​](#legacy-snapshots "Direct link to Legacy snapshots")

`test/render/**` snapshots and `test/perf/**` benchmarks remain on the legacy repository-only browser harness and are excluded from Vitest. See [SnapshotTestRunner](https://luma.gl/next/docs/api-reference/test-utils/snapshot-test-runner.md) for the legacy harness. Prefer Vitest and the current Playwright utilities for new tests.

## How the test infrastructure fits together[​](#how-the-test-infrastructure-fits-together "Direct link to How the test infrastructure fits together")

`vitest.config.ts` configures the `node`, `browser`, and `headless` projects using shared `@vis.gl/dev-tools` configuration. Browser projects use Playwright. Browser files run serially within a project to avoid competing for GPU resources and foreground input; CI parallelizes across configured shards and test groups. CI also collects and merges Node and browser coverage. The workflow files and the configuration are the source of truth for current grouping and schedules.

When a browser or GPU test fails, inspect the console and page diagnostics first, confirm the selected backend and GPU availability, and distinguish an assertion failure from a browser startup or canvas capture failure. If you change the test infrastructure itself, update the relevant root script, `vitest.config.ts`, `.ocularrc.js`, or `scripts/playwright/` alongside this guide.
