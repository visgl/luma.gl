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

  beginComputePass(_props: ComputePassProps): ComputePass {
    throw new Error('ComputePass is not supported on NullDevice');
  }

  copyBufferToBuffer(_options: CopyBufferToBufferOptions): void {
    throw new Error('copyBufferToBuffer is not supported on NullDevice');
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

  resolveQuerySet(_querySet: QuerySet): void {
    throw new Error('resolveQuerySet is not supported on NullDevice');
  }

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup() {}
  insertDebugMarker(markerLabel: string): void {}
}
