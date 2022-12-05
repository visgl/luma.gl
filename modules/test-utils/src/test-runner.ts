// @ts-nocheck TODO remove
/* eslint-disable no-console */
import {AnimationLoop, AnimationProps} from '@luma.gl/core';

/** Describes a test case */
export type TestRunnerTestCase = {
  /** Name of the test case (for logging) */
  name: string;
  /** Initialize the test case. Can return a promise */
  onInitialize: (props: Record<string, any>) => Promise<unknown>;
  /** Perform rendering */
  onRender: (props: Record<string, any>) => unknown;
  /** Clean up after the test case */
  onFinalize: (props: Record<string, any>) => void;
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
  onTestStart?: (testCase: TestRunnerTestCase) => void;
  onTestPass?: (testCase: TestRunnerTestCase) => void;
  onTestFail?: (testCase: TestRunnerTestCase) => void;

  /** milliseconds to wait for each test case before aborting */
  timeout?: number;
};

const DEFAULT_TEST_OPTIONS: Required<TestRunnerOptions> = {
  // test lifecycle callback
  onTestStart: (testCase: TestRunnerTestCase) => console.log(`# ${testCase.name}`),
  onTestPass: (testCase: TestRunnerTestCase) => console.log(`ok ${testCase.name} passed`),
  onTestFail: (testCase: TestRunnerTestCase) => console.log(`not ok ${testCase.name} failed`),

  // milliseconds to wait for each test case before aborting
  timeout: 2000
};

/** Runs an array of test cases */
export default class TestRunner {
  props: Record<string, any>;
  isRunning: boolean = false;
  readonly testOptions: TestRunnerOptions = {...DEFAULT_TEST_OPTIONS};
  readonly _animationProps?: AnimationProps;
  private _animationLoop: AnimationLoop | null;
  private _testCases: TestRunnerTestCase[] = [];
  private _testCaseData: any = null;

  // @ts-expect-error
  isHeadless: boolean = Boolean(window.browserTestDriver_isHeadless);

  /**
   * props
   *   AnimationLoop props
   */
  constructor(props: Record<string, any> = {}) {
    this.props = props;
  }

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
  async run(options: object = {}): Promise<void>  {
    this.testOptions = {...this.testOptions, ...options};

    try {
      return await new Promise<void>(resolve => {
        const props = {
          ...this.props,
          onRender: this._onRender.bind(this),
          onFinalize: () => {
            this.isRunning = false;
            resolve();
          }
        };

        this._animationLoop = new AnimationLoop(props);
        this._animationLoop.start(this.props);

        this.isRunning = true;
        this.isDiffing = false;
        this._currentTestCase = null;
      });
    } catch (error) {
      this._fail({error: error.message});
    }
  }

  /* Lifecycle methods for subclassing */

  initTestCase(testCase: TestRunnerTestCase): void {
    const {animationLoop} = testCase;
    if (animationLoop) {
      // TODO this likely no longer works - use animationLoop.props.onInitialize
      testCase.onInitialize = animationLoop.props.onInitialize.bind(animationLoop);
      testCase.onRender = animationLoop.props.onRender.bind(animationLoop);
      testCase.onFinalize = animationLoop.props.onFinalize.bind(animationLoop);
    }
    for (const key in DEFAULT_TEST_CASE) {
      testCase[key] = testCase[key] || DEFAULT_TEST_CASE[key];
    }
  }

  shouldRender(animationProps): boolean {
    return !isDone;
  }

  assert(testCase: TestRunnerTestCase): void {
    this._pass(testCase);
    this._next();
  }

  /* Utilities */

  _pass(result: unknown): void {
    this.testOptions.onTestPass(this._currentTestCase, result);
    // this._animationLoop?.stop();
  }

  _fail(result: unknown): void {
    this.testOptions.onTestFail(this._currentTestCase, result);
    // this._animationLoop?.stop();
  }

  _next(): void {
    this._nextTestCase();
  }

  /* Private methods */

  _onRender(animationProps): void {
    this._animationProps = animationProps;

    const testCase = this._currentTestCase || this._nextTestCase();
    if (!testCase) {
      // all test cases are done
      this._animationLoop.stop();
      return;
    }

    let isDone = false;
    const testCaseAnimationProps: AnimationProps = {
      ...animationProps, 
      ...this._testCaseData,
      // tick/time starts from 0 for each test case
      startTime: this._currentTestCaseStartTime,
      time: animationProps.time - this._currentTestCaseStartTime,
      tick: animationProps.tick - this._currentTestCaseStartTick,
      // called by the test case when it is done rendering and ready for capture and diff
      done: () => {
        isDone = true;
      }
    };

    if (this._testCaseData && this.shouldRender(testCaseAnimationProps)) {
      try {
        // test case is initialized, render frame
        testCase.onRender(testCaseAnimationProps);
      } catch {
        isDone = true;
      }
    }

    const timeout = testCase.timeout || this.testOptions.timeout;
    if (timeout && testCaseAnimationProps.time > timeout) {
      isDone = true;
    }

    if (isDone) {
      this.assert(testCase);
    }
  }

  async _nextTestCase(): Promise<TestRunnerTestCase> {
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
      animationProps.device.popState();

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
      animationProps.device.pushState();

      // aligned with the behavior of AnimationLoop.onInitialized
      // onInitialized could return a plain object or a promise
      const props = {
        ...animationProps,
        // tick/time starts from 0 for each test case
        startTime: animationProps.time,
        time: 0,
        tick: 0
      };

      try {
        const userData = await testCase.onInitialize(props);
        this._testCaseData = userData || {};
        // invoke user callback
        this.testOptions.onTestStart(testCase);
      } catch (error) {
        this._fail(error.message);
      }
    }
    return testCase;
  }
}
