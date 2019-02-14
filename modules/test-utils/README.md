# @luma.gl/test-utils

Client-side utility for browser-based WebGL render tests.

This class is intended to be used with `BrowserTestDriver` from `@probe.gl/test-utils`. Together they support the following workflow:

* Launch a Puppeteer instance (headless or non-headless) to run a test application
* In the test application, create a canvas and `WebGLContext`.
* For each test case, render something to the `WebGLContext`, take a screenshot, and perform pixel-diffing with a pre-defined "golden image". Report the matching result.
* Proceed to the next test case until done.

See [luma.gl website](http://luma.gl) for documentation.
