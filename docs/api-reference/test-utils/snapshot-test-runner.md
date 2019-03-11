# SnapshotTestRunner

Client-side utility for browser-based WebGL render tests.

This class is intended to be used with `BrowserTestDriver` from `@probe.gl/test-utils`. Together they support the following workflow:

* Launch a Puppeteer instance (headless or non-headless) to run a test application
* In the test application, create a canvas and `WebGLContext`.
* For each test case, render something to the `WebGLContext`, take a screenshot, and perform pixel-diffing with a pre-defined "golden image". Report the matching result.
* Proceed to the next test case until done.

## Example

In your node.js start script:

```js
// This is the script that runs in Node.js and starts the browser
const {BrowserTestDriver} = require('@probe.gl/test-utils');
new BrowserTestDriver().run({
  server: {
    // Bundles and serves the browser script
    command: 'webpack-dev-server',
    arguments: ['--env.render-test']
  },
  headless: true
});
```

In your script that is run on the browser:

```js
const {SnapshotTestRunner} = require('@luma.gl/test-utils');
const {Cube} = require('@luma.gl/core');

const TEST_CASES = [
  {
    name: 'Render A Cube',
    // `onRender` receives animation props from the AnimationLoop
    onRender: ({gl, done}) => {
      const model = new Cube(gl);
      model.draw(...);
      // ready for capture and diffing
      done();
    },
    goldenImage: './test/render/golden-images/cube.png'
  }
];

new TestRender({width: 800, height: 600})
  .add(TEST_CASES)
  .run({
    onTestFail: window.browserTestDriver_fail
  })
  .then(window.browserTestDriver_finish);
```

## Methods

### constructor(props: Object)

```
new SnapshotTestRunner(props)
```

Create a SnapshotTestRunner instance. The `props` argument is forwarded to the [AnimationLoop](/docs/api-reference/core/animation-loop.md) constructor.

### add(testCase: Array|Object)

Add one or a list of test cases. Each test case may contain the following fields:
 
* `name` (String) - name of the test case.
* `goldenImage` (String) - path to the golden image, relative to the root where the node script is executed.
* `timeout` (Number) - time to wait for this test case to resolve (by calling the `done` callback) before aborting, in milliseconds. If not provided, fallback to the shared option that is passed to `SnapshotTestRunner.run`.
* `imageDiffOptions` (Object) - image diffing options for this test case. See "Image Diff Options" section below.
* `onInitialize` (Function) - called once when the test case starts. Receives a single object that is the [AnimationLoop callback parameters](/docs/api-reference/core/animation-loop.md#callback-parameters). If this callback returns an object or a promise, the content that it resolves to will be passed to `onRender` and `onFinalize` later.
* `onRender` (Function) - called every animation frame when the test case is running. Receives a single object that is the [AnimationLoop callback parameters](/docs/api-reference/core/animation-loop.md#callback-parameters), plus the following:
  - `done` (Function) - must be called when the test case is done rendering and ready for screen capture and comparison.
* `onFinalize` (Function) - called once when the test case is done to finalize all resources. Receives a single object that is the [AnimationLoop callback parameters](/docs/api-reference/core/animation-loop.md#callback-parameters).

### run(options: Object)

Run all test cases.

Options:

* `timeout` (Number) - time to wait for each test case to resolve (by calling the `done` callback) before aborting, in milliseconds. Default `2000`.
* `imageDiffOptions` (Object) - image diffing options for all test cases. This will be overridden if a test case defines its own `imageDiffOptions`. See "Image Diff Options" section below.
* `onTestStart` (Function) - callback when a test starts. Receives the current test case. Default logs the test name to console.
* `onTestPass` (Function) - callback when a test passes. Receives the current test case and the diffing result. Default logs the pixel matching percentage to console.
* `onTestFail` (Function) - callback when a test fails, either because the matching rate is below threshold or a critical error. Receives the current test case. Default logs the error message or the pixel matching percentage to console.

Returns: a `Promise` that resolves when all test cases are done.


## Members

### isHeadless

Whether the test is being run in headless mode. In headless mode, Chromium uses software render which behaves slightly differently from non-headless. Image diffing tolerance may need to be adjusted accordingly.


## Image Diff Options

The test renderer and each test case may choose to override the default image diffing options. The following options from [captureAndDiffScreen](https://github.com/uber-web/probe.gl/blob/master/docs/api-reference/test-utils/browser-test-driver.md#browsertestdriver_captureanddiffscreenoptions--object) are supported:

* `tolerance`
* `threshold`
* `includeAA`
* `createDiffImage`
* `saveOnFail`
* `saveAs`

