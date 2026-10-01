// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {NumberArray16} from '@math.gl/core';
import {
  heightFog,
  heightFogFunctions,
  type HeightFogUniforms,
  type ShaderPass
} from '@luma.gl/shadertools';

/** Reconstructs positions in the same metre-space coordinate frame as the camera. */
export type HeightFogPassUniforms = HeightFogUniforms & {
  inverseViewProjectionMatrix: Readonly<NumberArray16>;
  cameraPosition: [number, number, number];
  /** Unit vector defining height; defaults to Z-up. */
  upDirection: [number, number, number];
  /** Clip-space Z at sampled depths zero and one: [0, 1] for WebGPU, [-1, 1] for standard WebGL. */
  clipDepthRange: [number, number];
  /** Depth clear value. Use zero for reverse-Z. */
  backgroundDepth: number;
  /** Metres to integrate along background rays. Zero leaves background pixels unchanged. */
  backgroundDistance: number;
};
export type HeightFogPassProps = Partial<HeightFogPassUniforms> & {depthTexture?: Texture};

/** Analytic height fog using the same extinction function as the heightFog material module. */
export const heightFogPass = {
  name: 'heightFogPass',
  dependencies: [heightFogFunctions],
  bindingLayout: [
    {name: 'heightFogPass', group: 0},
    {name: 'depthTexture', group: 0}
  ],
  uniformTypes: {
    ...heightFog.uniformTypes,
    inverseViewProjectionMatrix: 'mat4x4<f32>',
    cameraPosition: 'vec3<f32>',
    backgroundDistance: 'f32',
    upDirection: 'vec3<f32>',
    backgroundDepth: 'f32',
    clipDepthRange: 'vec2<f32>'
  },
  defaultUniforms: {
    ...heightFog.defaultUniforms,
    inverseViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    cameraPosition: [0, 0, 0],
    backgroundDistance: 0,
    upDirection: [0, 0, 1],
    backgroundDepth: 1,
    clipDepthRange: [0, 1]
  },
  source: /* wgsl */ `
struct heightFogPassUniforms {
  color: vec3f,
  density: f32,
  baseHeight: f32,
  heightFalloff: f32,
  variation: f32,
  wispScale: f32,
  velocity: vec3f,
  time: f32,
  evolutionSpeed: f32,
  inverseViewProjectionMatrix: mat4x4f,
  cameraPosition: vec3f,
  backgroundDistance: f32,
  upDirection: vec3f,
  backgroundDepth: f32,
  clipDepthRange: vec2f,
};
@group(0) @binding(auto) var<uniform> heightFogPass: heightFogPassUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
fn heightFogPass_sampleColor(sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f) -> vec4f {
  let color = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  if (heightFogPass.density <= 0.0) { return color; }
  let dimensions = textureDimensions(depthTexture);
  let coordinate = clamp(vec2i(texCoord * vec2f(dimensions)), vec2i(0), vec2i(dimensions) - 1);
  let depth = textureLoad(depthTexture, coordinate, 0);
  let background = abs(depth - heightFogPass.backgroundDepth) < 0.0000001;
  if (background && heightFogPass.backgroundDistance <= 0.0) { return color; }
  // A finite interior point defines the ray even for an infinite far plane.
  let clipDepth = mix(heightFogPass.clipDepthRange.x, heightFogPass.clipDepthRange.y, select(depth, 0.5, background));
  let homogeneous = heightFogPass.inverseViewProjectionMatrix * vec4f(texCoord * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0), clipDepth, 1.0);
  if (abs(homogeneous.w) < 0.000001) { return color; }
  var position = homogeneous.xyz / homogeneous.w;
  if (background) {
    let direction = position - heightFogPass.cameraPosition;
    position = heightFogPass.cameraPosition + direction / max(length(direction), 0.000001) * heightFogPass.backgroundDistance;
  }
  let transmittance = heightFog_getSpatialTransmittance(heightFogPass.cameraPosition, position, heightFogPass.upDirection,
    heightFogPass.density, heightFogPass.baseHeight, heightFogPass.heightFalloff,
    heightFogPass.variation, heightFogPass.wispScale, heightFogPass.time, heightFogPass.velocity, heightFogPass.evolutionSpeed);
  return vec4f(mix(heightFogPass.color, color.rgb, transmittance), color.a);
}
`,
  fs: /* glsl */ `
layout(std140) uniform heightFogPassUniforms {
  vec3 color;
  float density;
  float baseHeight;
  float heightFalloff;
  float variation;
  float wispScale;
  vec3 velocity;
  float time;
  float evolutionSpeed;
  mat4 inverseViewProjectionMatrix;
  vec3 cameraPosition;
  float backgroundDistance;
  vec3 upDirection;
  float backgroundDepth;
  vec2 clipDepthRange;
} heightFogPass;
uniform highp sampler2D depthTexture;
vec4 heightFogPass_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 color = texture(sourceTexture, texCoord);
  if (heightFogPass.density <= 0.0) return color;
  ivec2 dimensions = textureSize(depthTexture, 0);
  ivec2 coordinate = clamp(ivec2(texCoord * vec2(dimensions)), ivec2(0), dimensions - 1);
  float depth = texelFetch(depthTexture, coordinate, 0).r;
  bool background = abs(depth - heightFogPass.backgroundDepth) < 0.0000001;
  if (background && heightFogPass.backgroundDistance <= 0.0) return color;
  float clipDepth = mix(heightFogPass.clipDepthRange.x, heightFogPass.clipDepthRange.y, background ? 0.5 : depth);
  vec4 homogeneous = heightFogPass.inverseViewProjectionMatrix * vec4(texCoord * 2.0 - 1.0, clipDepth, 1.0);
  if (abs(homogeneous.w) < 0.000001) return color;
  vec3 position = homogeneous.xyz / homogeneous.w;
  if (background) {
    vec3 direction = position - heightFogPass.cameraPosition;
    position = heightFogPass.cameraPosition + direction / max(length(direction), 0.000001) * heightFogPass.backgroundDistance;
  }
  float transmittance = heightFog_getSpatialTransmittance(heightFogPass.cameraPosition, position, heightFogPass.upDirection,
    heightFogPass.density, heightFogPass.baseHeight, heightFogPass.heightFalloff,
    heightFogPass.variation, heightFogPass.wispScale, heightFogPass.time, heightFogPass.velocity, heightFogPass.evolutionSpeed);
  return vec4(mix(heightFogPass.color, color.rgb, transmittance), color.a);
}
`,
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  HeightFogPassProps,
  HeightFogPassUniforms,
  {depthTexture?: Texture}
>;
