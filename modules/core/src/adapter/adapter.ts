// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, DeviceProps} from './device';

/**
 * Create and attach devices for a specific backend.
 */
export abstract class Adapter {
  // new (props: DeviceProps): Device; Constructor isn't used
  abstract type: string;
  abstract isSupported(): boolean;
  abstract create(props: DeviceProps): Promise<Device>;
  abstract attach?(handle: unknown): Promise<Device>;
}
