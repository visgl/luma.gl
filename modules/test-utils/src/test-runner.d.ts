export type TestRunnerTestCase = {
  name: string;
  onInitialize: any;
  onRender: any;
  onFinalize: any;
};

export type TestRunnerOptions = {
  // test lifecycle callback
  onTestStart?: any;
  onTestPass?: any;
  onTestFail?: any;

  // milliseconds to wait for each test case before aborting
  timeout?: number
};


export default class TestRunner {
  readonly testOptions: object;
  readonly _animationProps: object;

  /**
   * @param props AnimationLoop props
   */
  constructor(props?: TestRunnerOptions);

  /**
   * Add testCase(s)
   */
  add(testCases: TestRunnerTestCase[]): this;

  /**
   * Returns a promise that resolves when all the test cases are done
   */
  run(options?: object): Promise<void>;

  /* Lifecycle methods for subclassing */
  initTestCase(testCase);
  shouldRender(animationProps);
  assert(testCase);

  _pass(result);
  _fail(result);
  _next();
}
