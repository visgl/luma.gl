// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Fence } from '@luma.gl/core';
/** Null fence that is always signaled */
export class NullFence extends Fence {
    device;
    handle = null;
    signaled = Promise.resolve();
    constructor(device, props = {}) {
        super(device, props);
        this.device = device;
    }
    destroy() { }
    isSignaled() {
        return true;
    }
}
