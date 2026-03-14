// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Fence } from '@luma.gl/core';
/** WebGPU fence implemented by waiting for submitted work */
export class WebGPUFence extends Fence {
    device;
    handle = null;
    signaled;
    _signaled = false;
    constructor(device, props = {}) {
        super(device, {});
        this.device = device;
        this.signaled = device.handle.queue.onSubmittedWorkDone().then(() => {
            this._signaled = true;
        });
    }
    isSignaled() {
        return this._signaled;
    }
    destroy() {
        // Nothing to release for WebGPU fence
    }
}
