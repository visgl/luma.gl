// @ts-nocheck
/* eslint-disable */

import {AnimationProps} from '@luma.gl/engine';
import {webglDevice} from './create-test-device';

// TODO - Replace with new AnimationLoop from `@luma.gl/engine`
import {ClassicAnimationLoop as AnimationLoop} from './engine/classic-animation-loop';

/** Describes a test case */
export type TestRunnerTestCase = {
  /** Name of the test case (for logging) */
  name: string;
  /** Initialize the test case. Can return a promise */
  onInitialize: (props: AnimationProps) => Promise<void | {}>;
  /** Perform rendering */
  onRender: (props: AnimationProps & {done}) => void;
  /** Clean up after the test case */
  onFinalize: (props: AnimationProps) => void;
  animationLoop?: AnimationLoop;
};

const DEFAULT_TEST_CASE: TestRunnerTestCase = {
  name: 'Unnamed test',
  onInitialize: async () => {},
  onRender: ({done}) => done(),
  onFinalize: () => {}
};

/** Options for a TestRunner */
export type TestRunnerProps = {
  width?: number;
  height?: number;
  // test lifecycle callback
  onTestStart?: (testCase: TestRunnerTestCase) => void;
  onTestPass?: (testCase: TestRunnerTestCase, result?: unknown) => void;
  onTestFail?: (testCase: TestRunnerTestCase, error?: unknown) => void;
  /** milliseconds to wait for each test case before aborting */
  timeout?: number;
  maxFramesToRender?: number;
  // HACK - this is for the snapshot test runner
  imageDiffOptions?: any;
};

const DEFAULT_TEST_PROPS: Required<TestRunnerProps> = {
  width: undefined,
  height: undefined,

  // test lifecycle callback
  onTestStart: (testCase: TestRunnerTestCase) => console.log(`# ${testCase.name}`),
  onTestPass: (testCase: TestRunnerTestCase, result?: unknown) => console.log(`ok ${testCase.name} passed`),
  onTestFail: (testCase: TestRunnerTestCase, error?: unknown) => console.log(`not ok ${testCase.name} failed`),

  // milliseconds to wait for each test case before aborting
  timeout: 2000,
  maxFramesToRender: undefined,
  imageDiffOptions: undefined
};

/** Runs an array of test cases */
export class TestRunner {
  device = webglDevice;
  props: Record<string, any>;
  isRunning: boolean = false;
  testOptions: Required<TestRunnerProps> = {...DEFAULT_TEST_PROPS};
  readonly _animationProps?: AnimationProps;
  private _animationLoop: AnimationLoop | null;
  private _testCases: TestRunnerTestCase[] = [];
  private _testCaseData: any = null;
  private _currentTestCase: TestRunnerTestCase | null;
  private _currentTestCaseStartTime: number;
  private _currentTestCaseStartTick: number;

  // should be defined in snapshot-test-runner
  isDiffing: boolean = false;

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
  run(options: object = {}): Promise<void>  {
    this.testOptions = {...this.testOptions, ...options};

    return new Promise<void>((resolve, reject) => {
      this._animationLoop = new AnimationLoop({
        ...this.props,
        device: this.device,
        onRender: this._onRender.bind(this),
        onFinalize: () => {
          this.isRunning = false;
          resolve();
        }
      });
      this._animationLoop.start(this.props);

      this.isRunning = true;
      this.isDiffing = false;
      this._currentTestCase = null;
    }).catch (error => {
      this._fail({error: error.message});
      // reject(error);
    });
  }

  /* Lifecycle methods for subclassing */

  initTestCase(testCase: TestRunnerTestCase) {
    const {animationLoop} = testCase;
    if (animationLoop) {
      testCase.onInitialize = animationLoop.props.onInitialize.bind(animationLoop);
      testCase.onRender = animationLoop.props.onRender.bind(animationLoop);
      testCase.onFinalize = animationLoop.props.onFinalize.bind(animationLoop);
    }
    for (const key in DEFAULT_TEST_CASE) {
      testCase[key] = testCase[key] || DEFAULT_TEST_CASE[key];
    }
  }

  shouldRender(animationProps): boolean {
    return true;
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
      // try {
      // test case is initialized, render frame
      testCase.onRender(testCaseAnimationProps);
      // } catch {
      //   isDone = true;
      // }
    }

    const timeout = testCase.timeout || this.testOptions.timeout;
    if (timeout && testCaseAnimationProps.time > timeout) {
      isDone = true;
    }

    if (isDone) {
      this.assert(testCase);
    }
  }

  _nextTestCase(): Promise<TestRunnerTestCase> {
    const animationProps = this._animationProps;

    // finalize the current test case
    if (this._testCaseData) {
      for (const key in this._testCaseData) {
        const value = this._testCaseData[key];
        if (value && value.delete) {
          value.destroy();
        }
      }
      this._currentTestCase.onFinalize(Object.assign({}, animationProps, this._testCaseData));

      // reset WebGL context
      this.device.popState();

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
      this.device.pushState();

      // aligned with the behavior of AnimationLoop.onInitialized
      // onInitialized could return a plain object or a promise
      const initProps = {
        ...animationProps,
        // tick/time starts from 0 for each test case
        startTime: animationProps.time,
        time: 0,
        tick: 0
      };

      // aligned with the behavior of AnimationLoop.onInitialized
      // onInitialized could return a plain object or a promise
      Promise.resolve(testCase.onInitialize(initProps)).then((userData) => {
        this._testCaseData = userData || {};
      });

      // invoke user callback
      this.testOptions.onTestStart(testCase);
    }
    return testCase;
  }
}
