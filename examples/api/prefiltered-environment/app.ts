// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import {AnimationLoopTemplate, ClipSpace, type AnimationProps} from '@luma.gl/engine';
import {createPrefilteredEnvironment, type PrefilteredEnvironment} from '@luma.gl/engine/lighting';
import {ibl, toHalfFloat} from '@luma.gl/shaders';

/** An engine-only IBL consumer: roughness increases across columns, metalness across rows. */
export default class EnvironmentExample extends AnimationLoopTemplate {
  static info =
    '<p>Environment lighting: roughness increases left to right; metalness increases bottom to top. A procedural HDR sky lights all spheres.</p>';
  readonly environment: PrefilteredEnvironment;
  readonly source: Texture;
  readonly model: ClipSpace;

  constructor({device}: AnimationProps) {
    super();
    const width = 128;
    const height = 64;
    const data = new Uint16Array(width * height * 4);
    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        const latitude = (row + 0.5) / height;
        const longitude = (column + 0.5) / width;
        const light = 8 * Math.exp(-((longitude - 0.65) ** 2 + (latitude - 0.3) ** 2) / 0.003);
        const sky = 1 - latitude;
        const color = [0.1 + 0.3 * sky + light, 0.12 + 0.5 * sky + light, 0.16 + sky + light, 1];
        data.set(color.map(toHalfFloat), (row * width + column) * 4);
      }
    }
    this.source = device.createTexture({
      width,
      height,
      format: 'rgba16float',
      data,
      sampler: {
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'repeat',
        addressModeV: 'clamp-to-edge'
      }
    });
    this.environment = createPrefilteredEnvironment(device, {
      source: this.source,
      size: 32,
      sampleCount: 128
    });
    const maximumMipLevel = this.environment.textures.specularTexture.mipLevels - 1;
    this.model = new ClipSpace(device, {
      source: fragmentWGSL.replaceAll('MAXIMUM_MIP_LEVEL', `${maximumMipLevel}.0`),
      fs: fragmentGLSL.replaceAll('MAXIMUM_MIP_LEVEL', `${maximumMipLevel}.0`),
      modules: [ibl],
      defines: {USE_IBL: 1},
      bindings: this.environment.getBindings(),
      parameters: {depthWriteEnabled: false}
    });
  }

  onRender({device}: AnimationProps) {
    const renderPass = device.beginRenderPass({
      clearColor: [0.02, 0.02, 0.02, 1],
      clearDepth: false
    });
    this.model.draw(renderPass);
    renderPass.end();
  }

  onFinalize() {
    this.model.destroy();
    this.environment.destroy();
    this.source.destroy();
  }
}

const fragmentWGSL = /* wgsl */ `
@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let grid = inputs.uv * vec2f(5.0, 3.0);
  let point = (fract(grid) - 0.5) * 2.3;
  if (dot(point, point) >= 1.0) { return vec4f(0.025, 0.025, 0.025, 1.0); }
  let normal = vec3f(point, sqrt(1.0 - dot(point, point)));
  let roughness = floor(grid.x) / 4.0;
  let metalness = floor(grid.y) / 2.0;
  let baseColor = vec3f(0.7, 0.3, 0.1);
  let reflectance = mix(vec3f(0.04), baseColor, metalness);
  let direction = reflect(vec3f(0.0, 0.0, -1.0), normal);
  let specular = textureSampleLevel(pbr_specularEnvSampler, pbr_specularEnvSamplerSampler, direction, roughness * MAXIMUM_MIP_LEVEL).rgb;
  let diffuse = textureSampleLevel(pbr_diffuseEnvSampler, pbr_diffuseEnvSamplerSampler, normal, 0.0).rgb;
  let lookup = textureSampleLevel(pbr_brdfLUT, pbr_brdfLUTSampler, vec2f(normal.z, 1.0 - roughness), 0.0).rg;
  let radiance = diffuse * baseColor * (1.0 - metalness) + specular * (reflectance * lookup.x + lookup.y);
  let mapped = radiance / (vec3f(1.0) + radiance);
  return vec4f(pow(mapped, vec3f(1.0 / 2.2)), 1.0);
}`;

const fragmentGLSL = /* glsl */ `#version 300 es
precision highp float;
in vec2 uv;
out vec4 fragmentColor;
void main() {
  vec2 grid = uv * vec2(5.0, 3.0);
  vec2 point = (fract(grid) - 0.5) * 2.3;
  if (dot(point, point) >= 1.0) { fragmentColor = vec4(0.025, 0.025, 0.025, 1.0); return; }
  vec3 normal = vec3(point, sqrt(1.0 - dot(point, point)));
  float roughness = floor(grid.x) / 4.0;
  float metalness = floor(grid.y) / 2.0;
  vec3 baseColor = vec3(0.7, 0.3, 0.1);
  vec3 reflectance = mix(vec3(0.04), baseColor, metalness);
  vec3 direction = reflect(vec3(0.0, 0.0, -1.0), normal);
  vec3 specular = textureLod(pbr_specularEnvSampler, direction, roughness * MAXIMUM_MIP_LEVEL).rgb;
  vec3 diffuse = textureLod(pbr_diffuseEnvSampler, normal, 0.0).rgb;
  vec2 lookup = texture(pbr_brdfLUT, vec2(normal.z, 1.0 - roughness)).rg;
  vec3 radiance = diffuse * baseColor * (1.0 - metalness) + specular * (reflectance * lookup.x + lookup.y);
  fragmentColor = vec4(pow(radiance / (vec3(1.0) + radiance), vec3(1.0 / 2.2)), 1.0);
}`;
