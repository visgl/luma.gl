// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CommandEncoder, CommandEncoderProps} from '@luma.gl/core';
import type {
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions,
  // ClearTextureOptions,
  // ReadTextureOptions,
  QuerySet,
  Buffer
} from '@luma.gl/core';

import {WEBGLCommandBuffer} from './webgl-command-buffer';
import {WebGLDevice} from '../webgl-device';

export class WEBGLCommandEncoder extends CommandEncoder {
  readonly device: WebGLDevice;

  readonly commandBuffer: WEBGLCommandBuffer;

  constructor(device: WebGLDevice, props: CommandEncoderProps) {
    super(device, props);
    this.device = device;
    this.commandBuffer = new WEBGLCommandBuffer(device);
  }

  override destroy(): void {}

  override finish(): void {
    this.commandBuffer.submitCommands();
  }

  // beginRenderPass(GPURenderPassDescriptor descriptor): GPURenderPassEncoder;
  // beginComputePass(optional GPUComputePassDescriptor descriptor = {}): GPUComputePassEncoder;
  // finish(options?: {id?: string}): GPUCommandBuffer;

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
