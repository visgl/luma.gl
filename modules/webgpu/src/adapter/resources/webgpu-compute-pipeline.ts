// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ComputePipeline, ComputePipelineProps} from '@luma.gl/core';

import {WebGPUDevice} from '../webgpu-device';
import {WebGPUShader} from './webgpu-shader';

// COMPUTE PIPELINE

/** Creates a new compute pipeline when parameters change */
export class WebGPUComputePipeline extends ComputePipeline {
  device: WebGPUDevice;
  handle: GPUComputePipeline;

  constructor(device: WebGPUDevice, props: ComputePipelineProps) {
    super(device, props);
    this.device = device;

    const webgpuShader = this.props.cs as WebGPUShader;
    this.handle =
      this.props.handle ||
      this.device.handle.createComputePipeline({
        label: this.props.id,
        compute: {
          module: webgpuShader.handle,
          entryPoint: this.props.csEntryPoint
          // constants: this.props.csConstants
        },
        layout: 'auto'
      });
  }

  /** For internal use in render passes */
  _getBindGroupLayout() {
    // TODO: Cache?
    return this.handle.getBindGroupLayout(0);
  }
}
