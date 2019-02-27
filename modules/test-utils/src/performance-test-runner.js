import {Stats} from 'probe.gl';
import TestRunner from './test-runner';

export default class PerformanceTestRunner extends TestRunner {
  constructor(props) {
    super(props);

    Object.assign(this.testOptions, {
      maxFramesToRender: 60,
      targetFPS: 50
    });
  }

  initTestCase(testCase) {
    super.initTestCase(testCase);
    this._stats = new Stats({id: testCase.name});
  }

  shouldRender(animationProps) {
    const count = this._stats.getCount('draw');
    if (count === 0) {
      // first time
      this._stats.reset();
    } else if (count > this.testOptions.maxFramesToRender) {
      animationProps.done();
    }
    this._stats.bump('draw');

    return true;
  }

  assert(testCase) {
    const targetFPS = testCase.targetFPS || this.testOptions.targetFPS;
    const count = this._stats.getCount('draw');
    const fps = this._stats.getFPS('draw');

    if (fps >= targetFPS) {
      this._pass({fps, framesRendered: count});
    } else {
      this._fail({fps, framesRendered: count});
    }
    this._next();
  }
}
