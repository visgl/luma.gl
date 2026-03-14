// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Stats } from '@probe.gl/stats';
import { TestRunner } from './test-runner';
export class PerformanceTestRunner extends TestRunner {
    _stats = null;
    _fps = null;
    constructor(props) {
        super(props);
        Object.assign(this.testOptions, {
            maxFramesToRender: 60,
            targetFPS: 50
        });
    }
    initTestCase(testCase) {
        super.initTestCase(testCase);
        this._stats = new Stats({ id: testCase.name });
        this._fps = this._stats.get('fps');
    }
    shouldRender(animationProps) {
        this._fps?.timeEnd();
        this._fps?.timeStart();
        // @ts-ignore TODO
        if (this._fps.count > this.testOptions.maxFramesToRender) {
            animationProps['done']();
        }
        return true;
    }
    assert(testCase) {
        // @ts-expect-error
        const targetFPS = testCase.targetFPS || this.testOptions.targetFPS;
        const count = this._fps?.count;
        const fps = this._fps?.getHz() || 0;
        if (fps >= targetFPS) {
            this._pass({ fps, framesRendered: count });
        }
        else {
            this._fail({ fps, framesRendered: count });
        }
        this._next();
    }
}
