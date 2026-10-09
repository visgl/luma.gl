import {DeveloperDocsTabs} from '@site/src/components/docs/developer-docs-tabs';

# Testing

<DeveloperDocsTabs active="testing" />

The primary test runner is Vitest.

## Commands

- `yarn test-node` runs the Node-only test suite.
- `yarn test-node-coverage` collects Istanbul coverage from CPU-only specs moved out of Chromium
  plus focused native Node suites, and writes Node LCOV.
- `yarn test-browser` runs browser-backed tests in headed Chromium for local development.
- `yarn test-headless` runs the browser-backed suite in headless Chromium for CI.
- `yarn test` runs `test-node` and then `test-headless`.
- `yarn test-fast` runs linting and the Node-only suite.
- `yarn test-coverage` runs the headless browser suite with Istanbul coverage enabled.

Vitest discovers tests directly from spec files:

- Use `*.spec.ts` / `*.spec.js` for the default browser-backed test path.
- Use `*.node.spec.ts` / `*.node.spec.js` only for tests that must stay in the Node project.

`vitest.config.ts` also routes an audited set of existing CPU-only specs to Node. Keep that list for
tests that do not create a device or access browser globals; new CPU-only tests should use the
`.node.spec` suffix directly.

## Test device creation

Creating too many GPU devices in one run can cause context loss and other instability. `@luma.gl/test-utils` exports reusable test devices for WebGL and WebGPU.

## Accessing GPU in CI

Browser-backed tests run through Vitest Browser Mode with Playwright/Chromium. This is the default path for active WebGL and WebGPU tests in CI.

Node test workers reuse their module graph to keep the large monorepo suite fast. A Node test that
replaces a global, changes an environment variable, or mutates shared module state must restore it
before the file finishes. Browser test files remain isolated because GPU resources and pending queue
work cannot safely be reused across files.

## Legacy render and perf tests

`test/render/**` snapshot tests and `test/perf/**` benchmarks are still on the legacy browser harness in this phase of the migration. They are excluded from Vitest and continue to rely on `BrowserTestDriver` utilities.

## Snapshot tests

See [SnapshotTestRunner](/docs/api-reference/test-utils/snapshot-test-runner) for the
legacy screenshot harness. Prefer the repository's Vitest and Playwright workflows for new
tests; do not copy legacy WebGL-context or removed `Cube` examples into new coverage.
