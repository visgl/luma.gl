import TestRunner, {TestRunnerOptions} from './test-runner';
import {getBoundingBoxInPage} from './utils';


export default class SnapshotTestRunner extends TestRunner {
  private isDiffing: boolean = false;

  constructor(props: TestRunnerOptions) {
    super(props);

    // @ts-expect-error
    this.testOptions.imageDiffOptions = {};
  }

  initTestCase(testCase) {
    super.initTestCase(testCase);
    if (!testCase.goldenImage) {
      throw new Error(`Test case ${testCase.name} does not have golden image`);
    }
  }

  shouldRender() {
    // wait for the current diffing to finish
    return !this.isDiffing;
  }

  assert(testCase) {
    if (this.isDiffing) {
      // Already performing diffing
      return;
    }
    this.isDiffing = true;

    const diffOptions = Object.assign(
      {},
      // @ts-expect-error
      this.testOptions.imageDiffOptions,
      testCase.imageDiffOptions,
      {
        goldenImage: testCase.goldenImage,
        // @ts-expect-error
        region: getBoundingBoxInPage(this._animationProps.canvas)
      }
    );

    // Take screenshot and compare
    // @ts-expect-error
    window.browserTestDriver_captureAndDiffScreen(diffOptions).then((result) => {
      // invoke user callback
      if (result.success) {
        this._pass(result);
      } else {
        this._fail(result);
      }

      this.isDiffing = false;
      this._next();
    });
  }
}
