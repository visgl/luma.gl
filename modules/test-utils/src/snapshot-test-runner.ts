import TestRunner, {TestRunnerOptions, TestRunnerTestCase} from './test-runner';
import {getBoundingBoxInPage} from './utils';

/** A snapshot test case */
export type SnapshotTestRunnerTestCase = TestRunnerTestCase & {
  /** URL to golden image */
  goldenImage: string;
}

export default class SnapshotTestRunner extends TestRunner {
  private isDiffing: boolean = false;

  constructor(props: TestRunnerOptions) {
    super(props);

    // @ts-expect-error
    this.testOptions.imageDiffOptions = {};
  }

  initTestCase(testCase: SnapshotTestRunnerTestCase): void {
    super.initTestCase(testCase);
    if (!testCase.goldenImage) {
      throw new Error(`Test case ${testCase.name} does not have golden image`);
    }
  }

  shouldRender(): boolean {
    // wait for the current diffing to finish
    return !this.isDiffing;
  }

  async assert(testCase): Promise<void> {
    if (this.isDiffing) {
      // Already performing diffing
      return;
    }
    this.isDiffing = true;

    const canvas = this._animationProps?.canvas;
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('canvas');
    }

    const diffOptions = {
      // @ts-expect-error
      ...this.testOptions.imageDiffOptions,
      ...testCase.imageDiffOptions,
      goldenImage: testCase.goldenImage,
      region: getBoundingBoxInPage(canvas)
    };

    // Take screenshot and compare
    // @ts-expect-error
    const result = await window.browserTestDriver_captureAndDiffScreen(diffOptions);

    // invoke user callback
    if (result.success) {
      this._pass(result);
    } else {
      this._fail(result);
    }

    this.isDiffing = false;
    this._next();
  }
}
