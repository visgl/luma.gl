// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Texture, type Device, type Framebuffer} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {
  LightmapBaker,
  createPBRLightmapModel,
  createPBRMaterial,
  createPBRModel,
  type LightmapBakeResult
} from '@luma.gl/engine/lighting';

/** Fixed-UV receiving example: jitter a point light, accumulate, then freeze an owned result. */
export class LightmapPreview {
  readonly baker: LightmapBaker;
  private readonly white: Texture;
  private readonly bakeMaterial;
  private material;
  private readonly bakeModel;
  private readonly model;
  private result: LightmapBakeResult | null = null;
  constructor(private readonly device: Device) {
    this.baker = new LightmapBaker(device, {width: 128, height: 128});
    const geometry = new Geometry({
      topology: 'triangle-list',
      attributes: {
        POSITION: {
          size: 3,
          value: new Float32Array([
            -0.8, -0.8, 0, 0.8, -0.8, 0, -0.8, 0.8, 0, -0.8, 0.8, 0, 0.8, -0.8, 0, 0.8, 0.8, 0
          ])
        },
        NORMAL: {size: 3, value: new Float32Array(Array.from({length: 6}, () => [0, 0, 1]).flat())},
        TEXCOORD_1: {size: 2, value: new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0])}
      }
    });
    this.white = device.createTexture({
      width: 1,
      height: 1,
      data: new Uint8Array([255, 255, 255, 255])
    });
    this.bakeMaterial = createPBRMaterial(device);
    this.material = createPBRMaterial(device, {
      bindings: {pbr_lightmapSampler: this.white},
      uniforms: {
        baseColorFactor: [0.3, 0.6, 0.9, 1],
        metallicRoughnessValues: [0, 1],
        lightmapUVSet: 1
      }
    });
    this.bakeModel = createPBRLightmapModel(device, {geometry, material: this.bakeMaterial});
    this.model = createPBRModel(device, {
      geometry,
      material: this.material,
      defines: {USE_LIGHTS: true},
      parameters: {depthWriteEnabled: false, cullMode: 'none'}
    });
  }
  reset(): void {
    this.baker.reset();
    this.result?.destroy();
    this.result = null;
  }
  render(framebuffer: Framebuffer, mode: 'live' | 'baking' | 'baked', time: number): void {
    const position: [number, number, number] = [
      Math.sin(time * 0.001) * 0.7,
      Math.cos(time * 0.0013) * 0.5,
      0.6
    ];
    if (mode === 'baking' || (mode === 'baked' && this.baker.sampleCount === 0)) {
      this.result?.destroy();
      this.result = null;
      this.baker.update({
        prepareSample: () =>
          this.bakeModel.shaderInputs.setProps({
            lighting: {
              lights: [
                {
                  type: 'point',
                  position,
                  attenuation: [0, 0, 1],
                  color: [255, 240, 220],
                  intensity: 1
                }
              ]
            }
          }),
        drawSample: ({renderPass}) => {
          this.bakeModel.draw(renderPass);
        }
      });
    }
    const createSnapshot = mode === 'baked' && !this.result;
    if (createSnapshot) this.result = this.baker.createResult();
    const lightmap =
      mode === 'baked'
        ? createSnapshot
          ? this.baker.textures.lightmapTexture
          : this.result!.textures.lightmapTexture
        : mode === 'baking'
          ? this.baker.textures.lightmapTexture
          : this.white;
    // Same binding slot: replacing its texture retains the shader specialization.
    if (this.material.getResourceBindings().pbr_lightmapSampler !== lightmap) {
      const previous = this.material;
      this.material = previous.clone({bindings: {pbr_lightmapSampler: lightmap}});
      this.model.setMaterial(this.material);
      previous.destroy();
    }
    this.material.setProps({pbrMaterial: {lightmapMapEnabled: mode !== 'live'}});
    this.model.shaderInputs.setProps({
      lighting: {
        lights:
          mode === 'live'
            ? [
                {
                  type: 'point',
                  position,
                  attenuation: [0, 0, 1],
                  color: [255, 240, 220],
                  intensity: 1
                }
              ]
            : []
      },
      pbrScene: {toneMapMode: 2, outputEncoding: 1}
    });
    const pass = this.device.beginRenderPass({
      framebuffer,
      clearColor: [0.04, 0.04, 0.04, 1],
      clearDepth: 1
    });
    pass.setParameters({viewport: [0, 0, framebuffer.width, framebuffer.height]});
    this.model.draw(pass);
    pass.end();
    for (const label of document.querySelectorAll('[data-bake-samples]'))
      label.textContent = `Samples: ${this.baker.sampleCount}`;
  }
  destroy(): void {
    this.model.destroy();
    this.bakeModel.destroy();
    this.material.destroy();
    this.bakeMaterial.destroy();
    this.result?.destroy();
    this.baker.destroy();
    this.white.destroy();
  }
}
