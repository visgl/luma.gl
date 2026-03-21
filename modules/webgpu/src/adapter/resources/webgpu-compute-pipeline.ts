// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ComputePipeline,
  ComputePipelineProps,
  Bindings,
  BindingsByGroup,
  normalizeBindingsByGroup
} from '@luma.gl/core';
import {getBindGroup} from '../helpers/get-bind-group';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUShader} from './webgpu-shader';

const EMPTY_BIND_GROUPS: BindingsByGroup = {};

// COMPUTE PIPELINE

/** Creates a new compute pipeline when parameters change */
export class WebGPUComputePipeline extends ComputePipeline {
  readonly device: WebGPUDevice;
  readonly handle: GPUComputePipeline;

  /** For internal use to create BindGroups */
  private _bindGroupLayouts: Partial<Record<number, GPUBindGroupLayout>> = {};
  private _bindGroups: Partial<Record<number, GPUBindGroup | null>> = {};
  /** For internal use to create BindGroups */
  private _bindingsByGroup: BindingsByGroup;

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
          this._bindGroups[group] = null;
        }
      }
    }
  }

  /** Return a bind group created by setBindings */
  _getBindGroups(
    bindings?: Bindings | BindingsByGroup
  ): Partial<Record<number, GPUBindGroup | null>> {
    const bindGroups = bindings
      ? normalizeBindingsByGroup(this.shaderLayout, bindings)
      : this._bindingsByGroup;
    const maxGroup = this.shaderLayout.bindings.reduce(
      (highestGroup, binding) => Math.max(highestGroup, binding.group),
      -1
    );
    const groups = Array.from({length: maxGroup + 1}, (_, group) => group);
    const resolvedBindGroups: Partial<Record<number, GPUBindGroup | null>> = {};

    for (const group of groups) {
      const groupBindings = bindGroups[group];
      this._bindGroupLayouts[group] ||= this.handle.getBindGroupLayout(group);

      if (!groupBindings || Object.keys(groupBindings).length === 0) {
        if (!this.shaderLayout.bindings.some(binding => binding.group === group)) {
          resolvedBindGroups[group] = this._getEmptyBindGroup(group);
        }
        continue;
      }

      if (bindings) {
        resolvedBindGroups[group] = getBindGroup(
          this.device,
          this._bindGroupLayouts[group],
          this.shaderLayout,
          groupBindings,
          group
        );
      } else {
        this._bindGroups[group] =
          this._bindGroups[group] ||
          getBindGroup(
            this.device,
            this._bindGroupLayouts[group],
            this.shaderLayout,
            groupBindings,
            group
          );
        resolvedBindGroups[group] = this._bindGroups[group];
      }
    }

    return resolvedBindGroups;
  }

  _getBindGroup(bindings?: Bindings | BindingsByGroup, group: number = 0): GPUBindGroup | null {
    return this._getBindGroups(bindings)[group] || null;
  }

  private _getEmptyBindGroup(group: number): GPUBindGroup {
    const cachedBindGroup = this._bindGroups[group];
    if (cachedBindGroup) {
      return cachedBindGroup;
    }

    const bindGroupLayout = this._bindGroupLayouts[group] || this.handle.getBindGroupLayout(group);
    this._bindGroupLayouts[group] = bindGroupLayout;
    const bindGroup = this.device.handle.createBindGroup({
      label: `${this.id}-empty-bind-group-${group}`,
      layout: bindGroupLayout,
      entries: []
    });
    this._bindGroups[group] = bindGroup;
    return bindGroup;
  }
}
