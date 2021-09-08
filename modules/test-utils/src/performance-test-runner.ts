import {Stats, Stat} from 'probe.gl';
import TestRunner, {TestRunnerOptions} from './test-runner';

export default class PerformanceTestRunner extends TestRunner {
  private _stats: Stats;
  private _fps: Stat;

  constructor(props: TestRunnerOptions) {
    super(props);

    Object.assign(this.testOptions, {
      maxFramesToRender: 60,
      targetFPS: 50
    });
  }

  initTestCase(testCase) {
    super.initTestCase(testCase);
    this._stats = new Stats({id: testCase.name});
    this._fps = this._stats.get('fps');
  }

  shouldRender(animationProps) {
    this._fps.timeEnd();
    this._fps.timeStart();

    // @ts-ignore
    if (this._fps.count > this.testOptions.maxFramesToRender) {
      animationProps.done();
    }

    return true;
  }

  assert(testCase) {
    // @ts-ignore
    const targetFPS = testCase.targetFPS || this.testOptions.targetFPS;
    const count = this._fps.count;
    const fps = this._fps.getHz();

    if (fps >= targetFPS) {
      this._pass({fps, framesRendered: count});
    } else {
      this._fail({fps, framesRendered: count});
    }
    this._next();
  }
}
