// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Geometry} from '@math.gl/geometry';
import type {BufferLayout, CommandEncoder, Device, Binding, BindingsByGroup} from '@luma.gl/core';
import {
  GPUVectorModel,
  type GPUVectorModelProps,
  type ModelBinding,
  type AnyShaderLayout
} from './gpu-vector-model';
import {GPUGeometry, makeGPUGeometry} from '../geometry/gpu-geometry';
import {Material} from '../material/material';
import {BufferLayoutHelper} from '../utils/buffer-layout-helper';
import {isTextureBindingSource} from '../dynamic-texture/texture-binding-source';

/** Properties for the high-level rendering model. */
export type ModelProps = Omit<GPUVectorModelProps, 'gpuVectorCount'> & {
  /** Geometry adapted into GPU attributes, buffer layouts, topology, and draw counts. */
  geometry?: GPUGeometry | Geometry | null;
  /** Material-owned group-3 bindings and uniforms. */
  material?: Material;
};

/** Rendering model with geometry adaptation and material bindings. */
export class Model extends GPUVectorModel {
  static override defaultProps: typeof GPUVectorModel.defaultProps &
    Required<Pick<ModelProps, 'geometry' | 'material'>> = {
    ...GPUVectorModel.defaultProps,
    geometry: null,
    material: undefined!
  };

  declare material: Material | null;
  declare _gpuGeometry: GPUGeometry | null;

  constructor(device: Device, props: ModelProps) {
    super(device, props);
  }

  protected override _initializeProps(props: ModelProps): void {
    this.material = props.material || null;
    this._gpuGeometry = null;
    if (props.geometry) this.setGeometry(props.geometry);
  }

  protected override _initializeAttributes(): void {
    if (this._gpuGeometry) this._setGeometryAttributes(this._gpuGeometry);
  }

  override destroy(): void {
    super.destroy();
    this._gpuGeometry?.destroy();
    this._gpuGeometry = null;
  }

  /**
   * Updates the optional geometry
   * Geometry, set topology and bufferLayout
   * @note Can trigger a pipeline rebuild / pipeline cache fetch on WebGPU
   */
  setGeometry(geometry: GPUGeometry | Geometry | null): void {
    this._gpuGeometry?.destroy();
    const gpuGeometry = geometry && makeGPUGeometry(this.device, geometry);
    if (gpuGeometry) {
      this.setTopology(gpuGeometry.topology || 'triangle-list');
      const bufferLayoutHelper = new BufferLayoutHelper(this.bufferLayout);
      this.bufferLayout = bufferLayoutHelper.mergeBufferLayouts(
        gpuGeometry.bufferLayout,
        this.bufferLayout
      );
      if (this.vertexArray) {
        this._setGeometryAttributes(gpuGeometry);
      }
    }
    this._gpuGeometry = gpuGeometry;
  }

  /**
   * Updates the optional geometry attributes
   * Geometry, sets several attributes, indexBuffer, and also vertex count
   * @note Can trigger a pipeline rebuild / pipeline cache fetch on WebGPU
   */
  _setGeometryAttributes(gpuGeometry: GPUGeometry): void {
    // Filter geometry attribute so that we don't issue warnings for unused attributes
    const attributes = {...gpuGeometry.attributes};
    for (const [attributeName] of Object.entries(attributes)) {
      if (
        !this.pipeline.shaderLayout.attributes.find(layout => layout.name === attributeName) &&
        attributeName !== 'positions'
      ) {
        delete attributes[attributeName];
      }
    }

    // TODO - delete previous geometry?
    this.setVertexCount(gpuGeometry.vertexCount);
    this.setIndexBuffer(gpuGeometry.indices || null);
    this.setAttributes(gpuGeometry.attributes, {disableWarnings: true});
    this.setAttributes(attributes, {disableWarnings: this.props.disableWarnings});

    this.setNeedsRedraw('geometry attributes');
  }

  override setBufferLayout(bufferLayout: BufferLayout[]): void {
    const nextBufferLayout = this._gpuGeometry
      ? new BufferLayoutHelper(this.bufferLayout).mergeBufferLayouts(
          bufferLayout,
          this._gpuGeometry.bufferLayout
        )
      : bufferLayout;
    const previousVertexArray = this.vertexArray;
    super.setBufferLayout(nextBufferLayout);
    if (this.vertexArray !== previousVertexArray && this._gpuGeometry) {
      this._setGeometryAttributes(this._gpuGeometry);
    }
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
