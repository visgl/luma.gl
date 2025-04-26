// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CommandEncoder, CommandEncoderProps} from '@luma.gl/core';
import type {
  RenderPassProps,
  ComputePass,
  ComputePassProps,
  QuerySet,
  Buffer,
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions
  // ClearTextureOptions,
  // TextureReadOptions,
} from '@luma.gl/core';

import {WEBGLCommandBuffer} from './webgl-command-buffer';
import {WEBGLRenderPass} from './webgl-render-pass';
import {WebGLDevice} from '../webgl-device';

export class WEBGLCommandEncoder extends CommandEncoder {
  readonly device: WebGLDevice;
  readonly handle = null;

  readonly commandBuffer: WEBGLCommandBuffer;

  constructor(device: WebGLDevice, props: CommandEncoderProps) {
    super(device, props);
    this.device = device;
    this.commandBuffer = new WEBGLCommandBuffer(device);
  }

  override destroy(): void {}

  override finish(): WEBGLCommandBuffer {
    return this.commandBuffer;
  }

  beginRenderPass(props: RenderPassProps): WEBGLRenderPass {
    return new WEBGLRenderPass(this.device, props);
  }

  beginComputePass(props: ComputePassProps): ComputePass {
    throw new Error('ComputePass not supported in WebGL');
  }

  copyBufferToBuffer(options: CopyBufferToBufferOptions): void {
    this.commandBuffer.commands.push({name: 'copy-buffer-to-buffer', options});
  }

  copyBufferToTexture(options: CopyBufferToTextureOptions) {
    this.commandBuffer.commands.push({name: 'copy-buffer-to-texture', options});
  }

  copyTextureToBuffer(options: CopyTextureToBufferOptions): void {
    this.commandBuffer.commands.push({name: 'copy-texture-to-buffer', options});
  }

  copyTextureToTexture(options: CopyTextureToTextureOptions): void {
    this.commandBuffer.commands.push({name: 'copy-texture-to-texture', options});
  }

  // clearTexture(options: ClearTextureOptions): void {
  //   this.commandBuffer.commands.push({name: 'copy-texture-to-texture', options});
  // }

  override pushDebugGroup(groupLabel: string): void {}
  override popDebugGroup() {}

  override insertDebugMarker(markerLabel: string): void {}

  override resolveQuerySet(
    querySet: QuerySet,
    destination: Buffer,
    options?: {
      firstQuery?: number;
      queryCount?: number;
      destinationOffset?: number;
    }
  ): void {}
}
