// luma.gl, MIT license

import {Stats, Stat} from '@probe.gl/stats';
import TestRunner, {TestRunnerOptions, TestRunnerTestCase} from './test-runner';

export default class PerformanceTestRunner extends TestRunner {
  private _stats: Stats | null = null;
  private _fps: Stat | null = null;

  constructor(props: TestRunnerOptions) {
    super(props);

    Object.assign(this.testOptions, {
      maxFramesToRender: 60,
      targetFPS: 50
    });
  }

  override initTestCase(testCase: TestRunnerTestCase): void {
    super.initTestCase(testCase);
    this._stats = new Stats({id: testCase.name});
    this._fps = this._stats.get('fps');
  }

  override shouldRender(animationProps: Record<string, any>): boolean {
    this._fps?.timeEnd();
    this._fps?.timeStart();

    // @ts-expect-error
    if (this._fps.count > this.testOptions.maxFramesToRender) {
      animationProps.done();
    }

    return true;
  }

  override assert(testCase: TestRunnerTestCase): void {
    // @ts-expect-error
    const targetFPS = testCase.targetFPS || this.testOptions.targetFPS;
    const count = this._fps?.count;
    const fps = this._fps?.getHz() || 0;

    if (fps >= targetFPS) {
      this._pass({fps, framesRendered: count});
    } else {
      this._fail({fps, framesRendered: count});
    }
    this._next();
  }
}
