// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ExternalTexture, ExternalTextureProps, Sampler, SamplerProps} from '@luma.gl/core';
import type {WebGPUDevice} from '../webgpu-device';
import {WebGPUSampler, type WebGPUSamplerProps} from './webgpu-sampler';

/** WebGPU concrete wrapper for one acquired `GPUExternalTexture` binding snapshot. */
export class WebGPUExternalTexture extends ExternalTexture {
  /** Device that imported or borrowed this external texture binding. */
  readonly device: WebGPUDevice;
  /** Acquired or borrowed WebGPU external texture handle. */
  handle: GPUExternalTexture;
  /** Default sampler used for paired `${name}Sampler` shader bindings. */
  sampler!: WebGPUSampler;

  /**
   * Creates one acquired or handle-backed WebGPU external texture binding.
   * @param device Device that owns the import operation.
   * @param props Source, handle, dimensions, and default sampler for this binding snapshot.
   */
  constructor(device: WebGPUDevice, props: ExternalTextureProps) {
    super(device, props);
    this.device = device;
    if (!this.props.handle && !this.props.source) {
      throw new Error(`${this} requires source or handle`);
    }
    if (this.props.handle && !this.props.source && (this.width <= 0 || this.height <= 0)) {
      throw new Error(`${this} handle-backed external textures require width and height`);
    }
    const suppliedHandle = this.props.handle as GPUExternalTexture | undefined;
    this.handle =
      suppliedHandle ||
      this.device.handle.importExternalTexture({
        source: this.props.source,
        colorSpace: this.props.colorSpace
      });
    this.setSampler(this.props.sampler);
  }

  /** Invalidates this wrapper without manually destroying browser-owned external data. */
  override destroy(): void {
    if (this.destroyed) {
      return;
    }
    // External textures are destroyed automatically,
    // as a microtask, instead of manually or upon garbage collection like other resources.
    // this.handle.destroy();
    this.destroyResource();
    // @ts-expect-error invalidated wrapper handle
    this.handle = null;
  }

  /**
   * Replaces the default paired shader sampler.
   * @param sampler Existing WebGPU sampler or sampler properties to create.
   */
  setSampler(sampler: Sampler | SamplerProps): this {
    // We can accept a sampler instance or set of props;
    this.sampler =
      sampler instanceof WebGPUSampler
        ? sampler
        : new WebGPUSampler(this.device, sampler as WebGPUSamplerProps);
    return this;
  }
}
