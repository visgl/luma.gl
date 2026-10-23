// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Geometry} from '@math.gl/geometry';
import type {CommandEncoder, Device, Binding, BindingsByGroup} from '@luma.gl/core';
import {
  GPUVectorModel,
  type GPUVectorModelProps,
  type ModelBinding,
  type AnyShaderLayout
} from './gpu-vector-model';
import {GPUGeometry, makeGPUGeometry} from '../geometry/gpu-geometry';
import {Material} from '../material/material';
import {GPUVectorGeometry} from '../geometry/gpu-vector-geometry';
import {makeGPUVectorGeometryFromGPUGeometry} from '../geometry/gpu-vector-geometry-adapter';
import {isTextureBindingSource} from '../dynamic-texture/texture-binding-source';

/** Properties for the high-level rendering model. */
export type ModelProps = Omit<GPUVectorModelProps, 'gpuVectorCount' | 'geometry'> & {
  /** Geometry adapted into GPU attributes, buffer layouts, topology, and draw counts. */
  geometry?: GPUVectorGeometry | GPUGeometry | Geometry | null;
  /** Material-owned group-3 bindings and uniforms. */
  material?: Material;
};

/** Rendering model with geometry adaptation and material bindings. */
export class Model extends GPUVectorModel {
  static override defaultProps: typeof GPUVectorModel.defaultProps & {material: Material} = {
    ...GPUVectorModel.defaultProps,
    material: undefined!
  };

  declare material: Material | null;
  declare _gpuGeometry: GPUGeometry | null;

  constructor(device: Device, props: ModelProps) {
    const sourceGeometry =
      props.geometry === undefined ? new.target.defaultProps.geometry : props.geometry;
    const gpuGeometry =
      sourceGeometry && !(sourceGeometry instanceof GPUVectorGeometry)
        ? makeGPUGeometry(device, sourceGeometry)
        : null;
    const geometry = gpuGeometry
      ? makeGPUVectorGeometryFromGPUGeometry(gpuGeometry)
      : sourceGeometry;
    try {
      super(device, {...props, geometry: geometry instanceof GPUVectorGeometry ? geometry : null});
    } catch (error) {
      gpuGeometry?.destroy();
      throw error;
    }
    this._gpuGeometry = gpuGeometry;
  }

  protected override _initializeProps(props: GPUVectorModelProps & {material?: Material}): void {
    this.material = props.material || null;
    this._gpuGeometry = null;
    super._initializeProps(props);
  }

  override destroy(): void {
    super.destroy();
    this._gpuGeometry?.destroy();
    this._gpuGeometry = null;
  }

  /** Adapts CPU and legacy buffer geometry into the GPU vector geometry API. */
  override setGeometry(geometry: GPUVectorGeometry | GPUGeometry | Geometry | null): void {
    this._gpuGeometry?.destroy();
    this._gpuGeometry =
      geometry && !(geometry instanceof GPUVectorGeometry)
        ? makeGPUGeometry(this.device, geometry)
        : null;
    const vectorGeometry = this._gpuGeometry
      ? makeGPUVectorGeometryFromGPUGeometry(this._gpuGeometry)
      : geometry;
    super.setGeometry(vectorGeometry instanceof GPUVectorGeometry ? vectorGeometry : null);
  }

  setMaterial(material: Material | null): void {
    this.material = material;
    this.setNeedsRedraw('material');
  }

  protected override _usesManagedUniformBuffer(moduleName: string): boolean {
    return !this.material?.ownsModule(moduleName);
  }

  override updateShaderInputs(commandEncoder?: CommandEncoder): void {
    super.updateShaderInputs(commandEncoder);
    this.material?.updateShaderInputs(commandEncoder);
  }

  protected override _getShaderInputBindings(): Record<string, ModelBinding> {
    const bindings = super._getShaderInputBindings();
    const material = this.material;
    if (!material) return bindings;
    return Object.fromEntries(
      Object.entries(bindings).filter(([name]) => !material.ownsBinding(name))
    );
  }

  override _areBindingsLoading(): string | false {
    const loadingBinding = super._areBindingsLoading();
    if (loadingBinding) return loadingBinding;
    for (const binding of Object.values(this.material?.bindings || {})) {
      if (isTextureBindingSource(binding) && !binding.isReady) return binding.id;
    }
    return false;
  }

  override _getBindGroups(
    shaderLayout: AnyShaderLayout = this._getCurrentShaderLayout(),
    bindings: Record<string, Binding> = this._getBindings(shaderLayout)
  ): BindingsByGroup {
    const bindGroups = super._getBindGroups(shaderLayout, bindings);
    for (const [groupKey, groupBindings] of Object.entries(
      this.material?.getBindingsByGroup(shaderLayout) || {}
    )) {
      const group = Number(groupKey);
      bindGroups[group] = {...(bindGroups[group] || {}), ...groupBindings};
    }
    return bindGroups;
  }

  override _getBindGroupCacheKeys(): Partial<Record<number, object>> {
    const bindGroupCacheKey = this.material?.getBindGroupCacheKey(3);
    return bindGroupCacheKey ? {3: bindGroupCacheKey} : {};
  }

  override _getBindingsUpdateTimestamp(): number {
    return Math.max(
      super._getBindingsUpdateTimestamp(),
      this.material?.getBindingsUpdateTimestamp() || 0
    );
  }
}
