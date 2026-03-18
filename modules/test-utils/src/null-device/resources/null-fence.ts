// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Fence, type FenceProps} from '@luma.gl/core';
import type {NullDevice} from '../null-device';

/** Null fence that is always signaled */
export class NullFence extends Fence {
  readonly device: NullDevice;
  readonly handle = null;
  readonly signaled: Promise<void> = Promise.resolve();

  constructor(device: NullDevice, props: FenceProps = {}) {
    super(device, props);
    this.device = device;
  }

  override destroy(): void {}

  isSignaled(): boolean {
    return true;
  }
}
