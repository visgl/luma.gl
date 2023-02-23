import TestRunner, {TestRunnerProps, TestRunnerTestCase} from './test-runner';
import {getBoundingBoxInPage} from './utils';

/** A snapshot test case */
export type SnapshotTestRunnerTestCase = TestRunnerTestCase & {
  /** URL to golden image */
  goldenImage: string;
  /** Diff options */
  imageDiffOptions?: {[key: string]: any}; 
}

export type SnapshotTestRunnerProps = TestRunnerProps;

export default class SnapshotTestRunner extends TestRunner {
  private isDiffing: boolean = false;

  constructor(props: SnapshotTestRunnerProps) {
    super(props);
    this.testOptions.imageDiffOptions = {};
  }

  override initTestCase(testCase: SnapshotTestRunnerTestCase): void {
    super.initTestCase(testCase);
    if (!testCase.goldenImage) {
      throw new Error(`Test case ${testCase.name} does not have golden image`);
    }
  }

  override shouldRender(): boolean {
    // wait for the current diffing to finish
    return !this.isDiffing;
  }

  override async assert(testCase: SnapshotTestRunnerTestCase): Promise<void> {
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
      ...this.testOptions.imageDiffOptions,
      ...testCase.imageDiffOptions,
      goldenImage: testCase.goldenImage,
      region: getBoundingBoxInPage(canvas)
    };

    // Take screenshot and compare
    const result = await globalThis.browserTestDriver_captureAndDiffScreen(diffOptions);

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
