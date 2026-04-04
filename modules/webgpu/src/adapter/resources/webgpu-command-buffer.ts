// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CommandBufferProps} from '@luma.gl/core';
import {CommandBuffer} from '@luma.gl/core';

import {WebGPUDevice} from '../webgpu-device';
import type {WebGPUCommandEncoder} from './webgpu-command-encoder';
import type {WebGPUBuffer} from './webgpu-buffer';

export class WebGPUCommandBuffer extends CommandBuffer {
  readonly device: WebGPUDevice;
  readonly handle: GPUCommandBuffer;
  transientUploadBuffers: WebGPUBuffer[];

  constructor(commandEncoder: WebGPUCommandEncoder, props: CommandBufferProps) {
    super(commandEncoder.device, props);
    this.device = commandEncoder.device;
    this.transientUploadBuffers = commandEncoder.takeTransientUploadBuffers();
    this.handle =
      this.props.handle ||
      commandEncoder.handle.finish({
        label: props?.id || 'unnamed-command-buffer'
      });
  }

  override destroy(): void {
    for (const uploadBuffer of this.transientUploadBuffers) {
      uploadBuffer.destroy();
    }
    this.transientUploadBuffers = [];
    this.destroyResource();
  }
}
