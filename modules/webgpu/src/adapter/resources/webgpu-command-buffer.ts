// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CommandBufferProps} from '@luma.gl/core';
import {CommandBuffer} from '@luma.gl/core';

import {WebGPUDevice} from '../webgpu-device';
import type {WebGPUCommandEncoder} from './webgpu-command-encoder';

export class WebGPUCommandBuffer extends CommandBuffer {
  readonly device: WebGPUDevice;
  readonly handle: GPUCommandBuffer;

  constructor(commandEncoder: WebGPUCommandEncoder, props: CommandBufferProps) {
    super(commandEncoder.device, {});
    this.device = commandEncoder.device;
    this.handle =
      this.props.handle ||
      commandEncoder.handle.finish({
        label: props?.id || 'unnamed-command-buffer'
      });
  }
}
