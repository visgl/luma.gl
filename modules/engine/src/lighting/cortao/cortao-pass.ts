// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Device, type Texture, type TextureView} from '@luma.gl/core';
import {
  getCORTAOPrepassUniforms,
  isSupportedProjection,
  type CORTAOCamera,
  type CORTAOConfiguration
} from './cortao-parameters';
import type {CORTAOPasses, CORTAOShaderOptions} from './cortao-passes';
import {CORTAOUpsample} from './cortao-upsample';
import {CORTAOWebGLPasses} from './cortao-webgl-passes';
import {CORTAOWebGPUPasses} from './cortao-webgpu-passes';

/** Pipeline specialization options. */
export type CORTAOPassProps = Partial<CORTAOShaderOptions> & {
  id?: string;
  /** Evaluation scale per axis. The returned visibility is always full size. Default 1. */
  resolutionScale?: 1 | 0.5 | 0.25;
};

/** Per-frame inputs. Camera distances and radius use the same view-space units. */
export type CORTAORenderOptions = Partial<Omit<CORTAOConfiguration, 'width' | 'height'>> & {
  camera: CORTAOCamera;
  depthTexture: Texture;
  filter?: boolean;
};

/** @experimental Depth-only ambient visibility using Circular Occluder Ray-Traced Ambient Occlusion. */
export class CORTAOPass {
  readonly device: Device;
  private readonly passes: CORTAOPasses;
  readonly resolutionScale: 1 | 0.5 | 0.25;
  private readonly upsample: CORTAOUpsample | null;
  private depthOnlyView: TextureView | null = null;
  private destroyed = false;

  constructor(device: Device, props: CORTAOPassProps = {}) {
    this.device = device;
    const {
      id = 'cortao',
      resolutionScale = 1,
      sampleCount = 16,
      rayCount = 16,
      largeFilter = true,
      filterSymmetry = true
    } = props;
    // The sample count is injected into the GLSL and WGSL as an integer constant.
    assert(Number.isInteger(sampleCount) && sampleCount > 0);
    // Only WebGL 2 and WebGPU implement the required integer texture operations.
    assert(device.type === 'webgl' || device.type === 'webgpu');
    const Passes = device.type === 'webgpu' ? CORTAOWebGPUPasses : CORTAOWebGLPasses;
    this.passes = new Passes(
      device,
      id,
      {sampleCount, rayCount, largeFilter, filterSymmetry},
      resolutionScale !== 1
    );
    this.resolutionScale = resolutionScale;
    this.upsample = resolutionScale === 1 ? null : new CORTAOUpsample(device, `${id}-upsample`);
  }

  /**
   * Borrows single-sample hardware depth and returns a pass-owned, full-resolution visibility mask.
   * On WebGPU, submit each render before recording another render with this instance.
   */
  render({
    camera,
    depthTexture,
    filter = true,
    radius = Infinity,
    maxScreenSpaceRadius = 0.2,
    intensity = 1,
    mipBias = -4,
    maxSlopeCompensation = 4,
    backfaceThreshold = 0.5,
    backfaceBoost = 0.5,
    filterDepthSensitivity = 512,
    filterNormalSensitivity = 16,
    randomSeed = 0
  }: CORTAORenderOptions): Texture {
    // The depth texture must come from the same device and the supplied perspective camera.
    assert(!this.destroyed && depthTexture.device === this.device);
    assert(isSupportedProjection(camera.projectionMatrix));
    const configuration = {
      width: Math.max(1, Math.round(depthTexture.width * this.resolutionScale)),
      height: Math.max(1, Math.round(depthTexture.height * this.resolutionScale)),
      radius,
      maxScreenSpaceRadius,
      intensity,
      mipBias,
      maxSlopeCompensation,
      backfaceThreshold,
      backfaceBoost,
      filterDepthSensitivity,
      filterNormalSensitivity,
      randomSeed
    };
    const depthView = this.getDepthView(depthTexture);
    const visibility = this.passes.renderOcclusion({camera, depthView, filter, configuration});
    if (!this.upsample) {
      return visibility;
    }
    const {depthScale, depthOffset} = getCORTAOPrepassUniforms(camera, configuration);
    return this.upsample.render(depthView, visibility, {depthScale, depthOffset});
  }

  destroy(): void {
    if (!this.destroyed) {
      this.destroyed = true;
      this.passes.destroy();
      this.upsample?.destroy();
      this.depthOnlyView?.destroy();
      this.depthOnlyView = null;
    }
  }

  private getDepthView(depthTexture: Texture): TextureView {
    if (this.device.type !== 'webgpu') {
      return depthTexture.view;
    }
    if (this.depthOnlyView?.texture === depthTexture) {
      return this.depthOnlyView;
    }

    this.depthOnlyView?.destroy();
    // A depth binding cannot use the all-aspects view of a combined depth-stencil texture.
    this.depthOnlyView =
      this.device.getTextureFormatInfo(depthTexture.format).attachment === 'depth-stencil'
        ? depthTexture.createView({aspect: 'depth-only', mipLevelCount: 1, arrayLayerCount: 1})
        : null;
    return this.depthOnlyView ?? depthTexture.view;
  }
}
