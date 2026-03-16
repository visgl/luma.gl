// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TextureView, TextureViewProps} from '@luma.gl/core';
import type {WebGPUDevice} from '../webgpu-device';
import type {WebGPUTexture} from './webgpu-texture';

const CPU_HOTSPOT_PROFILER_MODULE = 'cpu-hotspot-profiler';

type CpuHotspotProfiler = {
  enabled?: boolean;
  textureViewReinitializeCount?: number;
  textureViewReinitializeTimeMs?: number;
};

/*
  // type = sampler
  samplerType?: 'filtering' | 'non-filtering' | 'comparison';

  // type = texture
  viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  sampleType?: 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';
  multisampled?: boolean;

  // type = storage
  viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  access: 'read-only' | 'write-only';
  format: string;
*/

export type WebGPUTextureViewProps = TextureViewProps & {
  handle?: GPUTextureView;
};

/**
 *
 */
export class WebGPUTextureView extends TextureView {
  readonly device: WebGPUDevice;
  readonly handle: GPUTextureView;
  readonly texture: WebGPUTexture;

  constructor(device: WebGPUDevice, props: WebGPUTextureViewProps & {texture: WebGPUTexture}) {
    super(device, props);
    this.device = device;
    this.texture = props.texture;

    this.device.pushErrorScope('validation');
    this.handle = this.texture.handle.createView({
      format: (this.props.format || this.texture.format) as GPUTextureFormat,
      dimension: this.props.dimension || this.texture.dimension,
      aspect: this.props.aspect,
      baseMipLevel: this.props.baseMipLevel,
      mipLevelCount: this.props.mipLevelCount,
      baseArrayLayer: this.props.baseArrayLayer,
      arrayLayerCount: this.props.arrayLayerCount
    });
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`TextureView constructor: ${error.message}`), this)();
      this.device.debug();
    });

    this.handle.label = this.props.id;
  }

  override destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyResource();
    // GPUTextureView does not have a destroy method
    // this.handle.destroy();
    // @ts-expect-error readonly
    this.handle = null;
  }

  /**
   * Internal-only hook for the cached CanvasContext/PresentationContext swapchain path.
   * Rebuilds the default view when the per-frame canvas texture handle changes, without
   * replacing the long-lived luma.gl wrapper object.
   */
  _reinitialize(texture: WebGPUTexture): void {
    // @ts-expect-error readonly
    this.texture = texture;

    const profiler = getCpuHotspotProfiler(this.device);
    this.device.pushErrorScope('validation');
    const createViewStartTime = profiler ? getTimestamp() : 0;
    const handle = this.texture.handle.createView({
      format: (this.props.format || this.texture.format) as GPUTextureFormat,
      dimension: this.props.dimension || this.texture.dimension,
      aspect: this.props.aspect,
      baseMipLevel: this.props.baseMipLevel,
      mipLevelCount: this.props.mipLevelCount,
      baseArrayLayer: this.props.baseArrayLayer,
      arrayLayerCount: this.props.arrayLayerCount
    });
    if (profiler) {
      profiler.textureViewReinitializeCount = (profiler.textureViewReinitializeCount || 0) + 1;
      profiler.textureViewReinitializeTimeMs =
        (profiler.textureViewReinitializeTimeMs || 0) + (getTimestamp() - createViewStartTime);
    }
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`TextureView constructor: ${error.message}`), this)();
      this.device.debug();
    });

    handle.label = this.props.id;
    // @ts-expect-error readonly
    this.handle = handle;
  }
}

function getCpuHotspotProfiler(device: WebGPUDevice): CpuHotspotProfiler | null {
  const profiler = device.userData[CPU_HOTSPOT_PROFILER_MODULE] as CpuHotspotProfiler | undefined;
  return profiler?.enabled ? profiler : null;
}

function getTimestamp(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}
