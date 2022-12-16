// @ts-nocheck TODO remove
/* eslint-disable no-console */
import {AnimationLoop, AnimationProps} from '@luma.gl/core';
import {pushContextState, popContextState} from '@luma.gl/webgl';

/** Describes a test case */
export type TestRunnerTestCase = {
  /** Name of the test case (for logging) */
  name: string;
  /** Initialize the test case. Can return a promise */
  onInitialize: (props: AnimationProps) => Promise<unknown>;
  /** Perform rendering */
  onRender: (props: AnimationProps & {done}) => void;
  /** Clean up after the test case */
  onFinalize: (props: AnimationProps) => void;
};

function noop() {}

const DEFAULT_TEST_CASE: TestRunnerTestCase = {
  name: 'Unnamed test',
  onInitialize: noop,
  onRender: ({done}) => done(),
  onFinalize: noop
};

/** Options for a TestRunner */
export type TestRunnerOptions = {
  // test lifecycle callback
  onTestStart?: any;
  onTestPass?: any;
  onTestFail?: any;

  /** milliseconds to wait for each test case before aborting */
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

/** Runs an array of test cases */
export default class TestRunner {
  props;
  isRunning = false;
  readonly testOptions: object = {...DEFAULT_TEST_OPTIONS};
  readonly _animationProps: object = {};
  private _testCases: TestRunnerTestCase[] = [];
  private _testCaseData = null;

  // @ts-expect-error
  isHeadless: boolean = Boolean(window.browserTestDriver_isHeadless);

  /**
   * props
   *   AnimationLoop props
   */
  constructor(props = {}) {
    this.props = props;
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
        // @ts-expect-error TODO
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
    // @ts-expect-error
    this.testOptions.onTestPass(this._currentTestCase, result);
  }

  _fail(result) {
    // @ts-expect-error
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
