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
import {NullBuffer} from './null-buffer';

export class NullCommandBuffer extends CommandBuffer {
  readonly device: NullDevice;
  readonly handle: null = null;

  constructor(device: NullDevice, props: CommandBufferProps) {
    super(device, props);
    this.device = device;
  }

  copyBufferToBuffer(options: CopyBufferToBufferOptions): void {
    if (!(options.sourceBuffer instanceof NullBuffer)) {
      throw new Error('NullCommandBuffer.copyBufferToBuffer requires a NullBuffer source');
    }

    options.sourceBuffer.copyToBuffer(
      options.destinationBuffer,
      options.sourceOffset || 0,
      options.destinationOffset || 0,
      options.size
    );
  }

  copyBufferToTexture(_options: CopyBufferToTextureOptions) {
    throw new Error('copyBufferToTexture is not supported on NullDevice');
  }

  copyTextureToBuffer(_options: CopyTextureToBufferOptions): void {
    throw new Error('copyTextureToBuffer is not supported on NullDevice');
  }

  copyTextureToTexture(_options: CopyTextureToTextureOptions): void {
    throw new Error('copyTextureToTexture is not supported on NullDevice');
  }

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup() {}

  insertDebugMarker(_markerLabel: string): void {}
  resolveQuerySet(_querySet: QuerySet): void {
    throw new Error('resolveQuerySet is not supported on NullDevice');
  }
}
