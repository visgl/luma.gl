// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '../device';
import {Resource, ResourceProps} from './resource';

/**
 * Represents the finished contents of a CommandEncoder.
 *
 * @remarks
 * Backends may store native command buffers or replayable command lists internally, but
 * submission preserves recorded command ordering. A command buffer inherits its encoder's `id`
 * and `userData`. Command buffers are immutable, are submitted once, and may be retained only for
 * debugging or application bookkeeping.
 */
export abstract class CommandBuffer extends Resource<ResourceProps> {
  override get [Symbol.toStringTag](): string {
    return 'CommandBuffer';
  }

  constructor(device: Device, props: ResourceProps) {
    super(device, props, CommandBuffer.defaultProps);
  }

  static override defaultProps: Required<ResourceProps> = {
    ...Resource.defaultProps
  };
}
