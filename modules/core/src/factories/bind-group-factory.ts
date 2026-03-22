// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Bindings,
  BindingsByGroup,
  ComputeShaderLayout,
  ShaderLayout
} from '../adapter/types/shader-layout';
import type {Device} from '../adapter/device';
import type {ComputePipeline} from '../adapter/resources/compute-pipeline';
import type {RenderPipeline} from '../adapter/resources/render-pipeline';
import {normalizeBindingsByGroup} from '../adapter-utils/bind-groups';

type AnyPipeline = RenderPipeline | ComputePipeline;
type AnyShaderLayout = ShaderLayout | ComputeShaderLayout;
type BindGroupCacheKeys = Partial<Record<number, object>>;
type BindGroupMap = Partial<Record<number, unknown>>;
type LayoutCache = Partial<Record<number, object>>;
type LayoutBindGroupCache = {
  bindGroupsBySource: WeakMap<object, unknown | null>;
  emptyBindGroup?: unknown;
};

export class BindGroupFactory {
  readonly device: Device;

  private readonly _layoutCacheByPipeline: WeakMap<AnyPipeline, LayoutCache> = new WeakMap();
  private readonly _bindGroupCacheByLayout: WeakMap<object, LayoutBindGroupCache> = new WeakMap();

  constructor(device: Device) {
    this.device = device;
  }

  getBindGroups(
    pipeline: AnyPipeline,
    bindings?: Bindings | BindingsByGroup,
    bindGroupCacheKeys?: BindGroupCacheKeys
  ): BindGroupMap {
    if (this.device.type !== 'webgpu' || pipeline.shaderLayout.bindings.length === 0) {
      return {};
    }

    const bindingsByGroup = normalizeBindingsByGroup(pipeline.shaderLayout, bindings);
    const resolvedBindGroups: BindGroupMap = {};

    for (const group of getBindGroupIndicesUpToMax(pipeline.shaderLayout.bindings)) {
      const groupBindings = bindingsByGroup[group];
      const bindGroupLayout = this._getBindGroupLayout(pipeline, group);

      if (!groupBindings || Object.keys(groupBindings).length === 0) {
        if (!hasBindingsInGroup(pipeline.shaderLayout.bindings, group)) {
          resolvedBindGroups[group] = this._getEmptyBindGroup(
            bindGroupLayout,
            pipeline.shaderLayout,
            group
          );
        }
        continue;
      }

      const bindGroupCacheKey = bindGroupCacheKeys?.[group];
      if (bindGroupCacheKey) {
        const layoutCache = this._getLayoutBindGroupCache(bindGroupLayout);
        if (layoutCache.bindGroupsBySource.has(bindGroupCacheKey)) {
          resolvedBindGroups[group] = layoutCache.bindGroupsBySource.get(bindGroupCacheKey) || null;
          continue;
        }

        const bindGroup = this.device._createBindGroupWebGPU(
          bindGroupLayout,
          pipeline.shaderLayout,
          groupBindings,
          group
        );
        layoutCache.bindGroupsBySource.set(bindGroupCacheKey, bindGroup);
        resolvedBindGroups[group] = bindGroup;
      } else {
        resolvedBindGroups[group] = this.device._createBindGroupWebGPU(
          bindGroupLayout,
          pipeline.shaderLayout,
          groupBindings,
          group
        );
      }
    }

    return resolvedBindGroups;
  }

  private _getBindGroupLayout(pipeline: AnyPipeline, group: number): object {
    let layoutCache = this._layoutCacheByPipeline.get(pipeline);
    if (!layoutCache) {
      layoutCache = {};
      this._layoutCacheByPipeline.set(pipeline, layoutCache);
    }

    layoutCache[group] ||= this.device._createBindGroupLayoutWebGPU(pipeline, group) as object;
    return layoutCache[group];
  }

  private _getEmptyBindGroup(
    bindGroupLayout: object,
    shaderLayout: AnyShaderLayout,
    group: number
  ): unknown {
    const layoutCache = this._getLayoutBindGroupCache(bindGroupLayout);
    layoutCache.emptyBindGroup ||=
      this.device._createBindGroupWebGPU(bindGroupLayout, shaderLayout, {}, group) || null;
    return layoutCache.emptyBindGroup;
  }

  private _getLayoutBindGroupCache(bindGroupLayout: object): LayoutBindGroupCache {
    let layoutCache = this._bindGroupCacheByLayout.get(bindGroupLayout);
    if (!layoutCache) {
      layoutCache = {bindGroupsBySource: new WeakMap()};
      this._bindGroupCacheByLayout.set(bindGroupLayout, layoutCache);
    }
    return layoutCache;
  }
}

export function _getDefaultBindGroupFactory(device: Device): BindGroupFactory {
  device._factories.bindGroupFactory ||= new BindGroupFactory(device);
  return device._factories.bindGroupFactory as BindGroupFactory;
}

function getBindGroupIndicesUpToMax(bindings: AnyShaderLayout['bindings']): number[] {
  const maxGroup = bindings.reduce(
    (highestGroup, binding) => Math.max(highestGroup, binding.group),
    -1
  );
  return Array.from({length: maxGroup + 1}, (_, group) => group);
}

function hasBindingsInGroup(bindings: AnyShaderLayout['bindings'], group: number): boolean {
  return bindings.some(binding => binding.group === group);
}
