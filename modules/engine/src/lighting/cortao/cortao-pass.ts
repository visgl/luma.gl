// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Device, type Texture} from '@luma.gl/core';
import {
  isSupportedProjection,
  type CORTAOCamera,
  type CORTAOConfiguration
} from './cortao-parameters';
import type {CORTAOPasses, CORTAOShaderOptions} from './cortao-passes';
import {CORTAOWebGLPasses} from './cortao-webgl-passes';
import {CORTAOWebGPUPasses} from './cortao-webgpu-passes';

/** Pipeline specialization options. */
export type CORTAOPassProps = Partial<CORTAOShaderOptions> & {id?: string};

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
  private destroyed = false;

  constructor(device: Device, props: CORTAOPassProps = {}) {
    this.device = device;
    const {
      id = 'cortao',
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
    this.passes = new Passes(device, id, {sampleCount, rayCount, largeFilter, filterSymmetry});
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
    return this.passes.renderOcclusion({
      camera,
      depthTexture,
      filter,
      configuration: {
        width: depthTexture.width,
        height: depthTexture.height,
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
      }
    });
  }

  destroy(): void {
    if (!this.destroyed) {
      this.destroyed = true;
      this.passes.destroy();
    }
  }
}
