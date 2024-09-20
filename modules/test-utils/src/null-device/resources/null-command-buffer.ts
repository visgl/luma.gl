// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CommandBufferProps,
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions,
  QuerySet
} from '@luma.gl/core';
import {CommandBuffer} from '@luma.gl/core';
import type {NullDevice} from '../null-device';

export class NullCommandBuffer extends CommandBuffer {
  device: NullDevice;
  handle: null = null;

  constructor(device: NullDevice, props: CommandBufferProps) {
    super(device, props);
    this.device = device;
  }

  copyBufferToBuffer(options: CopyBufferToBufferOptions): void {}

  copyBufferToTexture(options: CopyBufferToTextureOptions) {}

  copyTextureToBuffer(options: CopyTextureToBufferOptions): void {}

  copyTextureToTexture(options: CopyTextureToTextureOptions): void {}

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup() {}

  insertDebugMarker(markerLabel: string): void {}
  resolveQuerySet(querySet: QuerySet): void {}
}
