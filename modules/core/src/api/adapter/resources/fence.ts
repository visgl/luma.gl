// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {DeviceResource, type DeviceResourceProps} from './device-resource';

export type FenceProps = DeviceResourceProps;

/** Synchronization primitive that resolves when GPU work is completed */
export abstract class Fence extends DeviceResource<FenceProps> {
  static override defaultProps: Required<FenceProps> = {
    ...DeviceResource.defaultProps
  };

  override get [Symbol.toStringTag](): string {
    return 'Fence';
  }

  /** Promise that resolves when the fence is signaled */
  abstract readonly signaled: Promise<void>;

  constructor(device: Device, props: FenceProps = {}) {
    super(device, props, Fence.defaultProps);
  }

  /** Destroy the fence and release any resources */

  /** Check if the fence has been signaled */
  abstract isSignaled(): boolean;
}
