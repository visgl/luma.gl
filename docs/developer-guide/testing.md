# Testing

The primary test runner is Vitest.

## Commands

- `yarn test-node` runs the Node-safe test suite.
- `yarn test-browser` runs browser-backed tests in headed Chromium for local development.
- `yarn test-headless` runs the browser-backed suite in headless Chromium for CI.
- `yarn test` runs `test-node` and then `test-browser`.
- `yarn test-fast` runs linting and the Node suite.
- `yarn test-coverage` runs the Node suite plus the headless browser suite with coverage enabled.

Vitest discovers tests directly from spec files:

- Use `*.spec.ts` / `*.spec.js` for Node-safe tests.
- Use `*.browser.spec.ts` / `*.browser.spec.js` for tests that require browser APIs or GPU access.

## Test device creation

Creating too many GPU devices in one run can cause context loss and other instability. `@luma.gl/test-utils` exports reusable test devices for WebGL and WebGPU.

## Accessing GPU in CI

Browser-backed tests run through Vitest Browser Mode with Playwright/Chromium. This is the default path for active WebGL and WebGPU tests in CI.

## Legacy render and perf tests

`test/render/**` snapshot tests and `test/perf/**` benchmarks are still on the legacy browser harness in this phase of the migration. They are excluded from Vitest and continue to rely on `BrowserTestDriver` utilities.

## SnapshotTestRunner

`@luma.gl/test-utils` provides `SnapshotTestRunner` for browser-based WebGL render tests.

This utility is still intended to be used with `BrowserTestDriver` from `@probe.gl/test-utils`:

- Launch a browser test application.
- Create a canvas and WebGL context in the browser page.
- Render a frame, capture it, and compare against a golden image.
- Repeat for each test case.

## Example

In your Node.js start script:

```typescript
const {BrowserTestDriver} = require('@probe.gl/test-utils');

new BrowserTestDriver().run({
  server: {
    command: 'webpack-dev-server',
    arguments: ['--env.render-test']
  },
  headless: true
});
```

In the browser test script:

```typescript
const {SnapshotTestRunner} = require('@luma.gl/test-utils');
const {Cube} = require('@luma.gl/engine');

const TEST_CASES = [
  {
    name: 'Render A Cube',
    onRender: ({gl, done}) => {
      const model = new Cube(gl);
      model.draw(...);
      done();
    },
    goldenImage: './test/render/golden-images/cube.png'
  }
];

new SnapshotTestRunner({width: 800, height: 600})
  .add(TEST_CASES)
  .run({
    onTestFail: window.browserTestDriver_fail
  })
  .then(window.browserTestDriver_finish);
```
