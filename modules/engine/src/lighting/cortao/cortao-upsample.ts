// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Device, type Framebuffer, Texture, type TextureView} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shaders';
import {ClipSpace} from '../../models/clip-space';
import {NEAREST_SAMPLER, PASS_PARAMETERS} from './cortao-passes';

type DepthLinearization = {depthScale: number; depthOffset: number};

const cortaoUpsample = {
  name: 'cortaoUpsample',
  uniformTypes: {depthScale: 'f32', depthOffset: 'f32'},
  fs: /* glsl */ `
layout(std140) uniform cortaoUpsampleUniforms {
  float depthScale;
  float depthOffset;
} cortaoUpsample;
`,
  source: /* wgsl */ `
struct CortaoUpsampleUniforms {
  depthScale: f32,
  depthOffset: f32,
};
@group(0) @binding(auto) var<uniform> cortaoUpsample: CortaoUpsampleUniforms;
`
} as const satisfies ShaderModule<DepthLinearization>;

// Each tap uses the same full-resolution depth sample as the low-resolution prepass.
// Relative inverse-depth differences suppress taps across silhouettes without a divide per tap.
const UPSAMPLE_WGSL = /* wgsl */ `
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var visibilityTexture: texture_2d<f32>;

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let pixel = vec2i(inputs.Position.xy);
  let depth = textureLoad(depthTexture, pixel, 0);
  let sky = select(0.0, 1.0, cortaoUpsample.depthScale < 0.0);
  if (depth == sky) { return vec4f(1.0); }
  let fullSize = vec2f(textureDimensions(depthTexture));
  let lowSize = vec2f(textureDimensions(visibilityTexture));
  let scale = fullSize / lowSize;
  let position = inputs.Position.xy / scale - 0.5;
  let base = vec2i(floor(position));
  let fraction = fract(position);
  let inverseDepth = depth * cortaoUpsample.depthScale + cortaoUpsample.depthOffset;
  let relativeDepthScale = abs(cortaoUpsample.depthScale) / max(0.02 * abs(inverseDepth), 1e-7);
  var weightedVisibility = 0.0;
  var totalWeight = 0.0;
  for (var y = 0; y < 2; y++) {
    for (var x = 0; x < 2; x++) {
      let offset = vec2i(x, y);
      let tap = clamp(base + offset, vec2i(0), vec2i(lowSize) - 1);
      let tapDepth = textureLoad(depthTexture, vec2i((vec2f(tap) + 0.5) * scale), 0);
      let compatible = max(0.0, 1.0 - abs(tapDepth - depth) * relativeDepthScale);
      let bilinear = 1.0 - abs(vec2f(offset) - fraction);
      let weight = select(compatible * bilinear.x * bilinear.y, 0.0, tapDepth == sky);
      weightedVisibility += textureLoad(visibilityTexture, tap, 0).r * weight;
      totalWeight += weight;
    }
  }
  let visibility = select(1.0, weightedVisibility / max(totalWeight, 1e-7), totalWeight > 1e-7);
  return vec4f(vec3f(visibility), 1.0);
}
`;

const UPSAMPLE_GLSL = /* glsl */ `#version 300 es
precision highp float;
uniform highp sampler2D depthTexture;
uniform highp sampler2D visibilityTexture;
out vec4 fragColor;

void main() {
  ivec2 pixel = ivec2(gl_FragCoord.xy);
  float depth = texelFetch(depthTexture, pixel, 0).r;
  float sky = cortaoUpsample.depthScale < 0.0 ? 1.0 : 0.0;
  if (depth == sky) { fragColor = vec4(1.0); return; }
  vec2 fullSize = vec2(textureSize(depthTexture, 0));
  vec2 lowSize = vec2(textureSize(visibilityTexture, 0));
  vec2 scale = fullSize / lowSize;
  vec2 position = gl_FragCoord.xy / scale - 0.5;
  ivec2 base = ivec2(floor(position));
  vec2 fraction = fract(position);
  float inverseDepth = depth * cortaoUpsample.depthScale + cortaoUpsample.depthOffset;
  float relativeDepthScale = abs(cortaoUpsample.depthScale) / max(0.02 * abs(inverseDepth), 1e-7);
  float weightedVisibility = 0.0;
  float totalWeight = 0.0;
  for (int y = 0; y < 2; y++) {
    for (int x = 0; x < 2; x++) {
      ivec2 offset = ivec2(x, y);
      ivec2 tap = clamp(base + offset, ivec2(0), ivec2(lowSize) - 1);
      float tapDepth = texelFetch(depthTexture, ivec2((vec2(tap) + 0.5) * scale), 0).r;
      float compatible = max(0.0, 1.0 - abs(tapDepth - depth) * relativeDepthScale);
      vec2 bilinear = 1.0 - abs(vec2(offset) - fraction);
      float weight = tapDepth == sky ? 0.0 : compatible * bilinear.x * bilinear.y;
      weightedVisibility += texelFetch(visibilityTexture, tap, 0).r * weight;
      totalWeight += weight;
    }
  }
  float visibility = totalWeight > 1e-7 ? weightedVisibility / totalWeight : 1.0;
  fragColor = vec4(vec3(visibility), 1.0);
}
`;

export class CORTAOUpsample {
  private readonly model: ClipSpace;
  private target: {texture: Texture; framebuffer: Framebuffer} | null = null;

  constructor(
    private readonly device: Device,
    id: string
  ) {
    this.model = new ClipSpace(device, {
      id,
      geometryType: 'triangle',
      modules: [cortaoUpsample],
      parameters: device.type === 'webgl' ? PASS_PARAMETERS : {},
      source: UPSAMPLE_WGSL,
      fs: UPSAMPLE_GLSL
    });
  }

  render(
    depthView: TextureView,
    visibilityTexture: Texture,
    linearization: DepthLinearization
  ): Texture {
    const {width, height} = depthView.texture;
    if (
      !this.target ||
      this.target.texture.width !== width ||
      this.target.texture.height !== height
    ) {
      this.destroyTarget();
      const texture = this.device.createTexture({
        width,
        height,
        format: 'rgba8unorm',
        usage: Texture.RENDER_ATTACHMENT | Texture.SAMPLE | Texture.COPY_SRC,
        sampler: NEAREST_SAMPLER
      });
      const framebuffer = this.device.createFramebuffer({
        width,
        height,
        colorAttachments: [texture]
      });
      this.target = {texture, framebuffer};
    }
    this.model.shaderInputs.setProps({cortaoUpsample: linearization});
    const depthTexture = this.device.type === 'webgpu' ? depthView : depthView.texture;
    this.model.setBindings({depthTexture, visibilityTexture});
    this.model.predraw(this.device.commandEncoder);
    const renderPass = this.device.beginRenderPass({
      id: this.model.id,
      framebuffer: this.target.framebuffer,
      clearColor: false,
      clearDepth: false,
      clearStencil: false,
      parameters: {viewport: [0, 0, width, height]}
    });
    this.model.draw(renderPass);
    renderPass.end();
    return this.target.texture;
  }

  destroy(): void {
    this.model.destroy();
    this.destroyTarget();
  }

  private destroyTarget(): void {
    this.target?.framebuffer.destroy();
    this.target?.texture.destroy();
    this.target = null;
  }
}
