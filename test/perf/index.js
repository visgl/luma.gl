/* global window, console */
/* eslint-disable no-console */
// hack: prevent example imports from starting their own animation loop
window.website = true;

const {PerformanceTestRunner} = require('@luma.gl/test-utils');
const {_enableDOMLogging} = require('@probe.gl/test-utils');
const PERF_TEST_CASES = require('./performance-test-cases').default;

const pixelRatio = window.devicePixelRatio || 1;

_enableDOMLogging({
  getStyle: message => ({
    background: '#fff',
    position: 'absolute',
    top: 0
  })
});

// Mac full screen
new PerformanceTestRunner({
  width: 3600 / pixelRatio,
  height: 2800 / pixelRatio
})
  .add(PERF_TEST_CASES)
  .run({
    timeout: 5000,
    maxFramesToRender: 120,
    onTestStart: testCase => console.log(testCase.name),
    onTestPass: (testCase, result) =>
      console.log(`perf: ${result.framesRendered} frames at ${result.fps} fps`),
    onTestFail: (testCase, result) =>
      console.log(`perf: ${result.framesRendered} frames at ${result.fps} fps`)
  });
