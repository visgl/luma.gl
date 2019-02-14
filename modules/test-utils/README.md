# @luma.gl/test-utils

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
const {TestRenderer} = require('@luma.gl/test-utils');
const {Cube} = require('@luma.gl/core');

const TEST_CASES = [
  {
    name: 'Render A Cube',
    onRender: ({gl, done}) => {
      const model = new Cube(gl);
      model.draw();
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
  .finally(window.browserTestDriver_finish);
```

See [luma.gl website](http://luma.gl) for documentation.
