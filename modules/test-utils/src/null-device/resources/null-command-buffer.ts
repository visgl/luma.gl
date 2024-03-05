// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CommandEncoder, CommandEncoderProps} from '@luma.gl/core';
import type {
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions,
  QuerySet
} from '@luma.gl/core';
import type {NullDevice} from '../null-device';

export class NullCommandEncoder extends CommandEncoder {
  device: NullDevice;

  constructor(device: NullDevice, props: CommandEncoderProps) {
    super(device, props);
    this.device = device;
  }

  finish(): void {}

  copyBufferToBuffer(options: CopyBufferToBufferOptions): void {}

  copyBufferToTexture(options: CopyBufferToTextureOptions) {}

  copyTextureToBuffer(options: CopyTextureToBufferOptions): void {}

  copyTextureToTexture(options: CopyTextureToTextureOptions): void {}

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup() {}

  insertDebugMarker(markerLabel: string): void {}
  resolveQuerySet(querySet: QuerySet): void {}
}
