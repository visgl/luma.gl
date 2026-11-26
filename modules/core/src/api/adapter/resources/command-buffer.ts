// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Device} from '../device';
import {DeviceResource, DeviceResourceProps} from './device-resource';

/**
 * Represents the finished contents of a CommandEncoder.
 *
 * @remarks
 * Backends may store native command buffers or replayable command lists internally, but
 * submission preserves recorded command ordering. A command buffer inherits its encoder's `id`
 * and `userData`. Command buffers are immutable, are submitted once, and may be retained only for
 * debugging or application bookkeeping.
 */
export abstract class CommandBuffer extends DeviceResource<DeviceResourceProps> {
  override get [Symbol.toStringTag](): string {
    return 'CommandBuffer';
  }

  constructor(device: Device, props: DeviceResourceProps) {
    super(device, props, CommandBuffer.defaultProps);
  }

  static override defaultProps: Required<DeviceResourceProps> = {
    ...DeviceResource.defaultProps
  };
}
