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
import {WEBGLQuerySet} from './webgl-query-set';

export class WEBGLCommandEncoder extends CommandEncoder {
  readonly device: WebGLDevice;
  readonly handle = null;

  readonly commandBuffer: WEBGLCommandBuffer;

  constructor(device: WebGLDevice, props: CommandEncoderProps) {
    super(device, props);
    this.device = device;
    this.commandBuffer = new WEBGLCommandBuffer(device, {
      id: this.id,
      userData: this.userData
    });
  }

  override destroy(): void {
    this.destroyResource();
  }

  override finish(): WEBGLCommandBuffer {
    this.destroy();
    return this.commandBuffer;
  }

  beginRenderPass(props: RenderPassProps = {}): WEBGLRenderPass {
    return new WEBGLRenderPass(this.device, this._applyTimeProfilingToPassProps(props));
  }

  beginComputePass(props: ComputePassProps = {}): ComputePass {
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
    _querySet: QuerySet,
    _destination: Buffer,
    _options?: {
      firstQuery?: number;
      queryCount?: number;
      destinationOffset?: number;
    }
  ): void {
    throw new Error('resolveQuerySet is not supported in WebGL');
  }

  writeTimestamp(querySet: QuerySet, queryIndex: number): void {
    const webglQuerySet = querySet as WEBGLQuerySet;
    webglQuerySet.writeTimestamp(queryIndex);
  }
}
