// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {DeviceResourceProps} from '../../../index';
import {CommandBuffer} from '../../../index';

import {WebGPUDevice} from '../webgpu-device';
import type {WebGPUCommandEncoder} from './webgpu-command-encoder';
import type {WebGPUBuffer} from './webgpu-buffer';
import type {WebGPUTimestampSnapshot} from './webgpu-timestamp-snapshot';

export class WebGPUCommandBuffer extends CommandBuffer {
  readonly device: WebGPUDevice;
  readonly handle: GPUCommandBuffer;
  timestampSnapshots: WebGPUTimestampSnapshot[];
  transientUploadBuffers: WebGPUBuffer[];

  constructor(commandEncoder: WebGPUCommandEncoder, props: DeviceResourceProps) {
    super(commandEncoder.device, props);
    this.device = commandEncoder.device;
    this.timestampSnapshots = commandEncoder.takeTimestampSnapshots();
    this.transientUploadBuffers = commandEncoder.takeTransientUploadBuffers();
    const suppliedHandle = this.props.handle as GPUCommandBuffer | undefined;
    this.handle =
      suppliedHandle ||
      commandEncoder.handle.finish({
        label: props?.id || 'unnamed-command-buffer'
      });
  }

  protected override destroyHandle(): void {
    for (const snapshot of this.timestampSnapshots) snapshot.destroy();
    this.timestampSnapshots = [];
    for (const uploadBuffer of this.transientUploadBuffers) {
      uploadBuffer.destroy();
    }
    this.transientUploadBuffers = [];
  }
}
