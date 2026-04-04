// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ComputePipeline,
  ComputePipelineProps,
  Bindings,
  BindingsByGroup,
  _getDefaultBindGroupFactory,
  normalizeBindingsByGroup
} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUShader} from './webgpu-shader';

const EMPTY_BIND_GROUPS: BindingsByGroup = {};

// COMPUTE PIPELINE

/** Creates a new compute pipeline when parameters change */
export class WebGPUComputePipeline extends ComputePipeline {
  readonly device: WebGPUDevice;
  readonly handle: GPUComputePipeline;

  private _bindingsByGroup: BindingsByGroup;
  private _bindGroupCacheKeysByGroup: Partial<Record<number, object>>;

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

    this._bindingsByGroup = EMPTY_BIND_GROUPS;
    this._bindGroupCacheKeysByGroup = {};
  }

  /**
   * @todo Use renderpass.setBindings() ?
   * @todo Do we want to expose BindGroups in the API and remove this?
   */
  setBindings(bindings: Bindings | BindingsByGroup): void {
    const nextBindingsByGroup = normalizeBindingsByGroup(this.shaderLayout, bindings);
    for (const [groupKey, groupBindings] of Object.entries(nextBindingsByGroup)) {
      const group = Number(groupKey);
      for (const [name, binding] of Object.entries(groupBindings || {})) {
        const currentGroupBindings = this._bindingsByGroup[group] || {};
        if (currentGroupBindings[name] !== binding) {
          if (
            !this._bindingsByGroup[group] ||
            this._bindingsByGroup[group] === currentGroupBindings
          ) {
            this._bindingsByGroup[group] = {...currentGroupBindings};
          }
          this._bindingsByGroup[group][name] = binding;
          this._bindGroupCacheKeysByGroup[group] = {};
        }
      }
    }
  }

  _getBindGroups(
    bindings?: Bindings | BindingsByGroup,
    bindGroupCacheKeys?: Partial<Record<number, object>>
  ): Partial<Record<number, unknown>> {
    const hasExplicitBindings = Boolean(bindings);
    return _getDefaultBindGroupFactory(this.device).getBindGroups(
      this,
      hasExplicitBindings ? bindings : this._bindingsByGroup,
      hasExplicitBindings ? bindGroupCacheKeys : this._bindGroupCacheKeysByGroup
    );
  }

  _getBindingsByGroupWebGPU(): BindingsByGroup {
    return this._bindingsByGroup;
  }

  _getBindGroupCacheKeysWebGPU(): Partial<Record<number, object>> {
    return this._bindGroupCacheKeysByGroup;
  }
}
