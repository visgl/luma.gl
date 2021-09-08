// @ts-nocheck TODO remove
/* eslint-disable no-console */
import {AnimationLoop} from '@luma.gl/core';
import {pushContextState, popContextState} from '@luma.gl/gltools';

export type TestRunnerTestCase = {
  name: string;
  onInitialize: any;
  onRender: any;
  onFinalize: any;
};

function noop() {}

const DEFAULT_TEST_CASE: TestRunnerTestCase = {
  name: 'Unnamed test',
  onInitialize: noop,
  onRender: ({done}) => done(),
  onFinalize: noop
};

export type TestRunnerOptions = {
  // test lifecycle callback
  onTestStart?: any;
  onTestPass?: any;
  onTestFail?: any;

  // milliseconds to wait for each test case before aborting
  timeout?: number;
};

const DEFAULT_TEST_OPTIONS: Required<TestRunnerOptions> = {
  // test lifecycle callback
  onTestStart: (testCase) => console.log(`# ${testCase.name}`),
  onTestPass: (testCase) => console.log(`ok ${testCase.name} passed`),
  onTestFail: (testCase) => console.log(`not ok ${testCase.name} failed`),

  // milliseconds to wait for each test case before aborting
  timeout: 2000
};

export default class TestRunner {
  props;
  isRunning = false;
  readonly testOptions: object;
  readonly _animationProps: object = {};
  private _testCases: TestRunnerTestCase[] = [];
  private _testCaseData = null;

  /**
   * props
   *   AnimationLoop props
   */
  constructor(props = {}) {
    this.props = props;

    // @ts-ignore
    this.isHeadless = Boolean(window.browserTestDriver_isHeadless);

    this.testOptions = Object.assign({}, DEFAULT_TEST_OPTIONS);
  }

  /**
   * Add testCase(s)
   */
  /**
   * Add testCase(s)
   */
   add(testCases: TestRunnerTestCase[]): this {
    if (!Array.isArray(testCases)) {
      testCases = [testCases];
    }
    for (const testCase of testCases) {
      this._testCases.push(testCase);
    }
    return this;
  }

   /**
    * Returns a promise that resolves when all the test cases are done
    */
  run(options: object = {}): Promise<void>  {
    Object.assign(this.testOptions, options);

    return new Promise<void>(resolve => {
      this._animationLoop = new AnimationLoop(
        // @ts-ignore TODO
        Object.assign({}, this.props, {
          onRender: this._onRender.bind(this),
          onFinalize: () => {
            this.isRunning = false;
            resolve();
          }
        })
      );
      this._animationLoop.start(this.props);

      this.isRunning = true;
      this.isDiffing = false;
      this._currentTestCase = null;
    }).catch((error) => {
      this._fail({error: error.message});
    });
  }

  /* Lifecycle methods for subclassing */

  initTestCase(testCase) {
    const {animationLoop} = testCase;
    if (animationLoop) {
      testCase.onInitialize = animationLoop.onInitialize.bind(animationLoop);
      testCase.onRender = animationLoop.onRender.bind(animationLoop);
      testCase.onFinalize = animationLoop.onFinalize.bind(animationLoop);
    }
    for (const key in DEFAULT_TEST_CASE) {
      testCase[key] = testCase[key] || DEFAULT_TEST_CASE[key];
    }
  }

  shouldRender(animationProps) {
    return true;
  }

  assert(testCase) {
    this._pass(testCase);
    this._next();
  }

  /* Utilities */

  _pass(result) {
    // @ts-ignore
    this.testOptions.onTestPass(this._currentTestCase, result);
  }

  _fail(result) {
    // @ts-ignore
    this.testOptions.onTestFail(this._currentTestCase, result);
  }

  _next() {
    this._nextTestCase();
  }

  /* Private methods */

  _onRender(animationProps) {
    this._animationProps = animationProps;

    const testCase = this._currentTestCase || this._nextTestCase();
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

    if (this._testCaseData && this.shouldRender(testCaseAnimationProps)) {
      // test case is initialized, render frame
      testCase.onRender(testCaseAnimationProps);
    }

    const timeout = testCase.timeout || this.testOptions.timeout;
    if (timeout && testCaseAnimationProps.time > timeout) {
      isDone = true;
    }

    if (isDone) {
      this.assert(testCase);
    }
  }

  _nextTestCase() {
    const animationProps = this._animationProps;

    // finalize the current test case
    if (this._testCaseData) {
      for (const key in this._testCaseData) {
        const value = this._testCaseData[key];
        if (value && value.delete) {
          value.delete();
        }
      }
      this._currentTestCase.onFinalize(Object.assign({}, animationProps, this._testCaseData));

      // reset WebGL context
      popContextState(animationProps.gl);

      this._currentTestCase = null;
      this._testCaseData = null;
    }

    // get the next test case
    const testCase = this._testCases.shift();
    if (testCase) {
      // start new test case
      this._currentTestCase = testCase;
      this._currentTestCaseStartTime = animationProps.time;
      this._currentTestCaseStartTick = animationProps.tick;
      this.initTestCase(testCase);

      // initialize test case

      // save WebGL context
      pushContextState(animationProps.gl);

      // aligned with the behavior of AnimationLoop.onInitialized
      // onInitialized could return a plain object or a promise
      Promise.resolve(
        testCase.onInitialize(
          Object.assign({}, animationProps, {
            // tick/time starts from 0 for each test case
            startTime: animationProps.time,
            time: 0,
            tick: 0
          })
        )
      ).then((userData) => {
        this._testCaseData = userData || {};
      });
      // invoke user callback
      this.testOptions.onTestStart(testCase);
    }
    return testCase;
  }
}
