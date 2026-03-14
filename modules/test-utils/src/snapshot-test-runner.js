// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { TestRunner } from './test-runner';
import { getBoundingBoxInPage } from './utils/get-bounding-box';
export class SnapshotTestRunner extends TestRunner {
    // should be defined here but hack access in TestRunner
    // private isDiffing: boolean = false;
    constructor(props) {
        super(props);
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
    async assert(testCase) {
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
        // @ts-ignore implicit any
        const result = await globalThis.browserTestDriver_captureAndDiffScreen(diffOptions);
        // invoke user callback
        if (result.success) {
            this._pass(result);
        }
        else {
            this._fail(result);
        }
        this.isDiffing = false;
        this._next();
    }
}
