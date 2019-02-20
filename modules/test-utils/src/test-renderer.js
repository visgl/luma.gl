// TODO - move to @luma.gl/test-utils
/* global window, console */
/* eslint-disable no-console */
import {AnimationLoop, withParameters} from '@luma.gl/core';
import GL from '@luma.gl/constants';

import {getBoundingBoxInPage} from './utils';

function defaultLogTestStart(testCase) {
  console.log(`# ${testCase.name}`);
}

function defaultLogTestPass(testCase, result) {
  console.log(`ok ${testCase.name} matches golden image by ${result.matchPercentage}`);
}

function defaultLogTestFail(testCase, result) {
  if (result.error) {
    console.log(`not ok ${testCase.name} error: ${result.error}`);
  } else {
    console.log(`not ok ${testCase.name} matches golden image by ${result.matchPercentage}`);
  }
}

function noop() {}

const DEFAULT_RENDER_PARAMETERS = {
  blend: true,
  blendFunc: [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA],
  depthTest: true,
  depthFunc: GL.LEQUAL
};

const DEFAULT_TEST_CASE = {
  name: 'Unnamed test',
  onInitialize: noop,
  onRender: ({done}) => done(),
  onFinalize: noop
};

export default class TestRenderer {
  /**
   * props
   *   AnimationLoop props
   */
  constructor(props = {}) {
    this.props = props;
    this.isRunning = false;
    this._testCases = [];
    this._testCaseData = null;

    this.isHeadless = Boolean(window.browserTestDriver_isHeadless);
  }

  /**
   * Add testCase(s)
   */
  add(testCases) {
    if (!Array.isArray(testCases)) {
      testCases = [testCases];
    }
    for (const testCase of testCases) {
      if (!testCase.goldenImage) {
        throw new Error(`Test case ${testCase.name} does not have golden image`);
      }
      this._testCases.push(Object.assign({}, DEFAULT_TEST_CASE, testCase));
    }
    return this;
  }

  /**
   * Returns a promise that resolves when all the test cases are done
   */
  run({
    // test lifecycle callback
    onTestStart = defaultLogTestStart,
    onTestPass = defaultLogTestPass,
    onTestFail = defaultLogTestFail,

    // milliseconds to wait for each test case before aborting
    timeout = 2000,

    // image diffing options
    imageDiffOptions = {}
  } = {}) {
    const testOptions = {
      onTestStart,
      onTestPass,
      onTestFail,
      timeout,
      imageDiffOptions
    };

    return new Promise(resolve => {
      this._animationLoop = new AnimationLoop(
        Object.assign({}, this.props, {
          onRender: this.onRender.bind(this, testOptions),
          onFinalize: () => {
            this.isRunning = false;
            resolve();
          }
        })
      );
      this._animationLoop.start(this.props);

      this.isRunning = true;
      this.isDiffing = false;
      this.currentTestCase = null;
    }).catch(error => {
      onTestFail(this.currentTestCase, {error: error.message});
    });
  }

  onRender(testOptions, animationProps) {
    if (this.isDiffing) {
      // wait for the current diffing to finish
      return;
    }

    const testCase = this.currentTestCase || this._nextTestCase(testOptions, animationProps);
    if (!testCase) {
      // all test cases are done
      this._animationLoop.stop();
      return;
    }

    let isDone = false;
    const testCaseAnimationProps = Object.assign({}, animationProps, this._testCaseData, {
      // tick/time starts from 0 for each test case
      startTime: this._currentTestCaseStartTime,
      time: animationProps.time - this._currentTestCaseStartTime,
      tick: animationProps.tick - this._currentTestCaseStartTick,
      // called by the test case when it is done rendering and ready for capture and diff
      done: () => {
        isDone = true;
      }
    });

    if (this._testCaseData) {
      // test case is initialized, render frame
      withParameters(animationProps.gl, DEFAULT_RENDER_PARAMETERS, () => {
        testCase.onRender(testCaseAnimationProps);
      });
    }

    const timeout = testCase.timeout || testOptions.timeout;
    if (timeout && testCaseAnimationProps.time > timeout) {
      isDone = true;
    }

    if (isDone) {
      this._captureAndDiff(testOptions, animationProps);
    }
  }

  _nextTestCase(testOptions, animationProps) {
    // get the next test case
    const testCase = this._testCases.shift();
    if (testCase) {
      // start new test case
      this.currentTestCase = testCase;
      this._currentTestCaseStartTime = animationProps.time;
      this._currentTestCaseStartTick = animationProps.tick;
      this._testCaseData = null;
      // initialize test case
      withParameters(animationProps.gl, DEFAULT_RENDER_PARAMETERS, () => {
        Promise.resolve(
          testCase.onInitialize(
            Object.assign({}, animationProps, {
              // tick/time starts from 0 for each test case
              startTime: animationProps.time,
              time: 0,
              tick: 0
            })
          )
        ).then(userData => {
          this._testCaseData = userData || {};
        });
      });
      // invoke user callback
      testOptions.onTestStart(testCase);
    }
    return testCase;
  }

  _captureAndDiff(testOptions, animationProps) {
    this.isDiffing = true;

    const testCase = this.currentTestCase;
    const diffOptions = Object.assign({}, testOptions.imageDiffOptions, testCase.imageDiffOptions, {
      goldenImage: testCase.goldenImage,
      region: getBoundingBoxInPage(animationProps.canvas)
    });
    // Take screenshot and compare
    window.browserTestDriver_captureAndDiffScreen(diffOptions).then(result => {
      // invoke user callback
      if (result.success) {
        testOptions.onTestPass(testCase, result);
      } else {
        testOptions.onTestFail(testCase, result);
      }

      // test case is finished, finalize all resources
      for (const key in this._testCaseData) {
        const value = this._testCaseData[key];
        if (value && value.delete) {
          value.delete();
        }
      }
      testCase.onFinalize(Object.assign({}, animationProps, this._testCaseData));

      this.currentTestCase = null;
      this.isDiffing = false;
    });
  }
}
