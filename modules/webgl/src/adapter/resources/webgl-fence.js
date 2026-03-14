// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Fence } from '@luma.gl/core';
/** WebGL fence implemented with gl.fenceSync */
export class WEBGLFence extends Fence {
    device;
    gl;
    handle;
    signaled;
    _signaled = false;
    constructor(device, props = {}) {
        super(device, {});
        this.device = device;
        this.gl = device.gl;
        const sync = this.props.handle || this.gl.fenceSync(this.gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (!sync) {
            throw new Error('Failed to create WebGL fence');
        }
        this.handle = sync;
        this.signaled = new Promise(resolve => {
            const poll = () => {
                const status = this.gl.clientWaitSync(this.handle, 0, 0);
                if (status === this.gl.ALREADY_SIGNALED || status === this.gl.CONDITION_SATISFIED) {
                    this._signaled = true;
                    resolve();
                }
                else {
                    setTimeout(poll, 1);
                }
            };
            poll();
        });
    }
    isSignaled() {
        if (this._signaled) {
            return true;
        }
        const status = this.gl.getSyncParameter(this.handle, this.gl.SYNC_STATUS);
        this._signaled = status === this.gl.SIGNALED;
        return this._signaled;
    }
    destroy() {
        if (!this.destroyed) {
            this.gl.deleteSync(this.handle);
        }
    }
}
