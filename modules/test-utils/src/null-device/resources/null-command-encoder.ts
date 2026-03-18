// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CommandEncoder, CommandEncoderProps} from '@luma.gl/core';
import type {
  CommandBufferProps,
  RenderPassProps,
  ComputePass,
  ComputePassProps,
  QuerySet,
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions
} from '@luma.gl/core';
import type {NullDevice} from '../null-device';
import {NullCommandBuffer} from './null-command-buffer';
import {NullRenderPass} from './null-render-pass';

export class NullCommandEncoder extends CommandEncoder {
  readonly device: NullDevice;
  readonly handle: null = null;

  constructor(device: NullDevice, props: CommandEncoderProps) {
    super(device, props);
    this.device = device;
  }

  override destroy(): void {
    this.destroyResource();
  }

  finish(props: CommandBufferProps = {}): NullCommandBuffer {
    const commandBuffer = new NullCommandBuffer(this.device, props);
    this.destroy();
    return commandBuffer;
  }

  beginRenderPass(props: RenderPassProps): NullRenderPass {
    return new NullRenderPass(this.device, props);
  }

  beginComputePass(props: ComputePassProps): ComputePass {
    throw new Error('ComputePass not supported in WebGL');
  }

  copyBufferToBuffer(options: CopyBufferToBufferOptions): void {}

  copyBufferToTexture(options: CopyBufferToTextureOptions) {}

  copyTextureToBuffer(options: CopyTextureToBufferOptions): void {}

  copyTextureToTexture(options: CopyTextureToTextureOptions): void {}

  resolveQuerySet(querySet: QuerySet): void {}

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup() {}
  insertDebugMarker(markerLabel: string): void {}
}
