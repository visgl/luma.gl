// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ComputePipeline, ComputePipelineProps, Binding} from '@luma.gl/core';
import {getBindGroup} from '../helpers/get-bind-group';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUShader} from './webgpu-shader';

// COMPUTE PIPELINE

/** Creates a new compute pipeline when parameters change */
export class WebGPUComputePipeline extends ComputePipeline {
  readonly device: WebGPUDevice;
  readonly handle: GPUComputePipeline;

  /** For internal use to create BindGroups */
  private _bindGroupLayout: GPUBindGroupLayout | null = null;
  private _bindGroup: GPUBindGroup | null = null;
  /** For internal use to create BindGroups */
  private _bindings: Record<string, Binding> = {};

  constructor(device: WebGPUDevice, props: ComputePipelineProps) {
    super(device, props);
    this.device = device;

    const webgpuShader = this.props.shader as WebGPUShader;

    this.handle =
      this.props.handle ||
      this.device.handle.createComputePipeline({
        label: this.props.id,
        compute: {
          module: webgpuShader.handle,
          entryPoint: this.props.entryPoint,
          constants: this.props.constants
        },
        layout: 'auto'
      });
  }

  /**
   * @todo Use renderpass.setBindings() ?
   * @todo Do we want to expose BindGroups in the API and remove this?
   */
  setBindings(bindings: Record<string, Binding>): void {
    Object.assign(this._bindings, bindings);
  }

  /** Return a bind group created by setBindings */
  _getBindGroup() {
    // Get hold of the bind group layout. We don't want to do this unless we know there is at least one bind group
    this._bindGroupLayout = this._bindGroupLayout || this.handle.getBindGroupLayout(0);

    // Set up the bindings
    this._bindGroup =
      this._bindGroup ||
      getBindGroup(this.device.handle, this._bindGroupLayout, this.shaderLayout, this._bindings);

    return this._bindGroup;
  }
}
