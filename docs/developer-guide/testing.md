# Testing

Testing webgl programs can be tricky...

- test-utils
- probe
- headless gl
- puppeteer
- ...

## Test device creation

A small but still annoying issue is that creating too many devices in tests can 
lead to problems with context loss etc as the test scripts grow. 
`@luma.gl/test-utils` exports a couple of reusable test devices for WebGL1 and WebGL2.

## Accessing GPU in Node.js and CI environments

A frequent problem with WebGL and WebGPU libraries is that they are supported in browsers, 
but tests typically run on CI machines in the cloud that often do not even have a GPU.

luma.gl has integrations with headless gl and puppeteer that allows tests to be run outside of browser.s

## Render Tests

A powerful way to test GPU programs is to render into a texture and compare against a golden image.
luma.gl provides a library that handles complications like waiting for resources to load before rendering the image,
and doing pixel diffs that accept a small error tolerance.

## SnapshotTestRunner

`@luma.gl/test-utils` provides this client-side utility for browser-based WebGL render tests.

This class is intended to be used with `BrowserTestDriver` from `@probe.gl/test-utils`. Together they support the following workflow:

- Launch a Puppeteer instance (headless or non-headless) to run a test application
- In the test application, create a canvas and `WebGLContext`.
- For each test case, render something to the `WebGLContext`, take a screenshot, and perform pixel-diffing with a pre-defined "golden image". Report the matching result.
- Proceed to the next test case until done.

## Example

In your node.js start script:

```typescript
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

```typescript
const {SnapshotTestRunner} = require('@luma.gl/test-utils');
const {Cube} = require('@luma.gl/engine');

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
