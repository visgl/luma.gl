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
  readonly device: NullDevice;
  readonly handle: null = null;

  constructor(device: NullDevice, props: CommandBufferProps) {
    super(device, props);
    this.device = device;
  }

  copyBufferToBuffer(options: CopyBufferToBufferOptions): void {}

  copyBufferToTexture(options: CopyBufferToTextureOptions) {}

  copyTextureToBuffer(options: CopyTextureToBufferOptions): void {
    const {
      sourceTexture,
      destinationBuffer,
      origin = [0, 0, 0],
      byteOffset = 0,
      width,
      height,
      depthOrArrayLayers,
      mipLevel,
      aspect
    } = options;
    sourceTexture.readBuffer(
      {
        x: origin[0] ?? 0,
        y: origin[1] ?? 0,
        z: origin[2] ?? 0,
        width,
        height,
        depthOrArrayLayers,
        mipLevel,
        aspect,
        byteOffset
      } as any,
      destinationBuffer
    );
  }

  copyTextureToTexture(options: CopyTextureToTextureOptions): void {}

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup() {}

  insertDebugMarker(markerLabel: string): void {}
  resolveQuerySet(querySet: QuerySet): void {}
}
