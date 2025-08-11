// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Fence, type FenceProps} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';

/** WebGPU fence implemented by waiting for submitted work */
export class WebGPUFence extends Fence {
  readonly device: WebGPUDevice;
  readonly handle: null = null;
  readonly signaled: Promise<void>;
  private _signaled = false;

  constructor(device: WebGPUDevice, props: FenceProps = {}) {
    super(device, {});
    this.device = device;
    this.signaled = device.handle.queue.onSubmittedWorkDone().then(() => {
      this._signaled = true;
    });
  }

  isSignaled(): boolean {
    return this._signaled;
  }

  override destroy(): void {
    // Nothing to release for WebGPU fence
  }
}
