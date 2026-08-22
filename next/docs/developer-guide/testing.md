# Testing

[Testing](https://luma.gl/next/docs/developer-guide/testing.md)[Debugging](https://luma.gl/next/docs/developer-guide/debugging.md)[Profiling](https://luma.gl/next/docs/developer-guide/profiling.md)[Bundling](https://luma.gl/next/docs/developer-guide/bundling.md)[AI agents](https://luma.gl/next/docs/developer-guide/working-with-ai.md)

The primary test runner is Vitest.

## Commands[​](#commands "Direct link to Commands")

* `yarn test-node` runs the Node-only test suite.
* `yarn test-node-coverage` collects Istanbul coverage from CPU-only specs moved out of Chromium plus focused native Node suites, and writes Node LCOV.
* `yarn test-browser` runs browser-backed tests in headed Chromium for local development.
* `yarn test-headless` runs the browser-backed suite in headless Chromium for CI.
* `yarn test` runs `test-node` and then `test-headless`.
* `yarn test-fast` runs linting and the Node-only suite.
* `yarn test-coverage` runs the headless browser suite with Istanbul coverage enabled.

Vitest discovers tests directly from spec files:

* Use `*.spec.ts` / `*.spec.js` for the default browser-backed test path.
* Use `*.node.spec.ts` / `*.node.spec.js` only for tests that must stay in the Node project.

`vitest.config.ts` also routes an audited set of existing CPU-only specs to Node. Keep that list for tests that do not create a device or access browser globals; new CPU-only tests should use the `.node.spec` suffix directly.

## Test device creation[​](#test-device-creation "Direct link to Test device creation")

Creating too many GPU devices in one run can cause context loss and other instability. `@luma.gl/test-utils` exports reusable test devices for WebGL and WebGPU.

## Accessing GPU in CI[​](#accessing-gpu-in-ci "Direct link to Accessing GPU in CI")

Browser-backed tests run through Vitest Browser Mode with Playwright/Chromium. This is the default path for active WebGL and WebGPU tests in CI.

Node test workers reuse their module graph to keep the large monorepo suite fast. A Node test that replaces a global, changes an environment variable, or mutates shared module state must restore it before the file finishes. Browser test files remain isolated because GPU resources and pending queue work cannot safely be reused across files.

## Legacy render and perf tests[​](#legacy-render-and-perf-tests "Direct link to Legacy render and perf tests")

`test/render/**` snapshot tests and `test/perf/**` benchmarks are still on the legacy browser harness in this phase of the migration. They are excluded from Vitest and continue to rely on `BrowserTestDriver` utilities.

## SnapshotTestRunner[​](#snapshottestrunner "Direct link to SnapshotTestRunner")

`@luma.gl/test-utils` provides `SnapshotTestRunner` for browser-based WebGL render tests.

This utility is still intended to be used with `BrowserTestDriver` from `@probe.gl/test-utils`:

* Launch a browser test application.
* Create a canvas and WebGL context in the browser page.
* Render a frame, capture it, and compare against a golden image.
* Repeat for each test case.

## Example[​](#example "Direct link to Example")

In your Node.js start script:

```
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

```
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
