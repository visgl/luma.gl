// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {Resource, type ResourceProps} from './resource';

export type FenceProps = ResourceProps;

/** Synchronization primitive that resolves when GPU work is completed */
export abstract class Fence extends Resource<FenceProps> {
  static override defaultProps: Required<FenceProps> = {
    ...Resource.defaultProps
  };

  [Symbol.toStringTag]: string = 'WEBGLFence';

  /** Promise that resolves when the fence is signaled */
  abstract readonly signaled: Promise<void>;

  constructor(device: Device, props: FenceProps = {}) {
    super(device, props, Fence.defaultProps);
  }

  /** Destroy the fence and release any resources */
  abstract override destroy(): void;

  /** Check if the fence has been signaled */
  abstract isSignaled(): boolean;
}
