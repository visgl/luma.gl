// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Device, type Texture} from '@luma.gl/core';
import type {CompositeShaderPass} from '@luma.gl/shaders';
import {Matrix4, type NumberArray16} from '@math.gl/core';
import {ShaderPassRenderer} from '../passes/shader-pass-renderer';
import {ssaoEvaluate} from '../effects/passes/screen-space/ssao';
import {gtaoEvaluate} from '../effects/passes/screen-space/gtao';
import {depthAwareBlur} from '../effects/passes/screen-space/depth-aware-blur';

export type AmbientOcclusionMode = 'none' | 'ssao' | 'gtao';
export type AmbientOcclusionPassProps = {
  mode?: AmbientOcclusionMode;
  resolutionScale?: number;
};
export type AmbientOcclusionRenderOptions = {
  depthTexture: Texture;
  normalTexture: Texture;
  projectionMatrix: Readonly<Matrix4 | NumberArray16>;
  near: number;
  far: number;
  /** SSAO uses pixels; GTAO uses view-space scene units. */
  radius?: number;
  bias?: number;
  intensity?: number;
};

/** Reuses the effects evaluators to produce ambient visibility, without color composition or history. */
export class AmbientOcclusionPass {
  readonly device: Device;
  readonly mode: AmbientOcclusionMode;
  private readonly renderer: ShaderPassRenderer | null;
  private readonly unoccluded: Texture;
  private destroyed = false;

  constructor(device: Device, props: AmbientOcclusionPassProps = {}) {
    this.device = device;
    this.mode = props.mode ?? 'gtao';
    // Existing SSAO/GTAO evaluators support WebGPU. Callers can explicitly select none elsewhere.
    assert(this.mode === 'none' || device.type === 'webgpu');
    const scale = props.resolutionScale ?? 0.5;
    // Resolution scale must describe a positive fractional input resolution.
    assert(scale > 0 && scale <= 1);
    this.unoccluded = device.createTexture({
      width: 1,
      height: 1,
      data: new Uint8Array([255, 255, 255, 255])
    });
    if (this.mode === 'none') {
      this.renderer = null;
      return;
    }
    const evaluate = this.mode === 'ssao' ? ssaoEvaluate : gtaoEvaluate;
    const shaderPass: CompositeShaderPass<'ambientOcclusionRaw' | 'ambientOcclusionScratch'> = {
      name: 'ambientOcclusionVisibility',
      renderTargets: {
        ambientOcclusionRaw: {scale: [scale, scale], format: 'rgba8unorm'},
        ambientOcclusionScratch: {scale: [scale, scale], format: 'rgba8unorm'}
      },
      steps: [
        {shaderPass: evaluate, inputs: {sourceTexture: 'original'}, output: 'ambientOcclusionRaw'},
        {
          shaderPass: depthAwareBlur,
          inputs: {sourceTexture: 'ambientOcclusionRaw'},
          output: 'ambientOcclusionScratch',
          uniforms: {direction: [1, 0]}
        },
        {
          shaderPass: depthAwareBlur,
          inputs: {sourceTexture: 'ambientOcclusionScratch'},
          output: 'previous',
          uniforms: {direction: [0, 1]}
        }
      ]
    };
    this.renderer = new ShaderPassRenderer(device, {
      shaderPasses: [shaderPass],
      colorFormat: 'rgba8unorm'
    });
  }

  /** Borrows same-camera WebGPU hardware depth and encoded view normals; never submits. */
  render(options: AmbientOcclusionRenderOptions): Texture {
    // Even disabled passes must not be used after destruction.
    assert(!this.destroyed);
    if (!this.renderer) return this.unoccluded;
    const {depthTexture, normalTexture} = options;
    // Inputs must share the device and physical resolution.
    assert(depthTexture.device === this.device && normalTexture.device === this.device);
    assert(
      depthTexture.width === normalTexture.width && depthTexture.height === normalTexture.height
    );
    const projectionMatrix = new Matrix4(options.projectionMatrix);
    this.renderer.resize([normalTexture.width, normalTexture.height]);
    const controls = {
      ...(options.radius === undefined ? {} : {radius: options.radius}),
      ...(options.bias === undefined ? {} : {bias: options.bias}),
      ...(options.intensity === undefined ? {} : {intensity: options.intensity})
    };
    const result = this.renderer.renderToTexture({
      sourceTexture: normalTexture,
      bindings: {depthTexture, normalTexture},
      uniforms: {
        ssaoEvaluate: {
          ...controls,
          nearPlane: options.near,
          farPlane: options.far,
          useNormalTexture: 1
        },
        gtaoEvaluate: {
          ...controls,
          projectionMatrix,
          inverseProjectionMatrix: new Matrix4(projectionMatrix).invert(),
          frameIndex: 0
        }
      }
    });
    // Concrete inputs always produce a texture; deferred uploads are not accepted.
    assert(result);
    return result;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.renderer?.destroy();
    this.unoccluded.destroy();
  }
}
