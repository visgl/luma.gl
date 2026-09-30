// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderPass} from '@luma.gl/shadertools';
import type {NumberArray16} from '@math.gl/core';
import {temporalHelpers} from './screen-space-shader-helpers';

export type SSRCameraTemporalUniforms = {
  /** Previous view-projection times inverse current view-projection, using WebGPU clip depth. */
  currentClipToPreviousClip: Readonly<NumberArray16>;
  /** Previous view times inverse current view; normals use its linear part. */
  currentViewToPreviousView: Readonly<NumberArray16>;
  previousInverseProjectionMatrix: Readonly<NumberArray16>;
  historyWeight: number;
  /** Relative previous-view depth tolerance. */
  depthThreshold: number;
  /** Minimum dot product of current and previous surface normals. */
  normalThreshold: number;
};
type SSRCameraTemporalBindings = {
  depthTexture?: Texture;
  normalTexture?: Texture;
  historyTexture?: Texture;
  /** RGB-packed 24-bit depth produced by ssrCameraDepthHistoryCopy. */
  previousDepthTexture?: Texture;
  previousNormalTexture?: Texture;
};
const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** Camera-only reflection history for static geometry, with depth and changing-normal rejection. */
export const ssrCameraTemporal = {
  name: 'ssrCameraTemporal',
  source: /* wgsl */ `
${temporalHelpers}
struct SSRCameraTemporalUniforms {
  currentClipToPreviousClip: mat4x4f,
  currentViewToPreviousView: mat4x4f,
  previousInverseProjectionMatrix: mat4x4f,
  historyWeight: f32,
  depthThreshold: f32,
  normalThreshold: f32,
};
@group(0) @binding(auto) var<uniform> ssrCameraTemporal: SSRCameraTemporalUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var previousDepthTexture: texture_2d<f32>;
@group(0) @binding(auto) var previousNormalTexture: texture_2d<f32>;

fn ssrCameraTemporal_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler,
  texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let current = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let currentDepth = textureLoad(depthTexture,
    temporal_getTexelCoordinate(texCoord, textureDimensions(depthTexture)), 0);
  if (currentDepth >= 0.99999 || ssrCameraTemporal.historyWeight <= 0.0) {return current;}
  let previousClip = ssrCameraTemporal.currentClipToPreviousClip *
    temporal_getClipPosition(texCoord, currentDepth);
  let previousFrame = temporal_getPreviousFrame(previousClip, vec2f(0.0), 0.000001);
  if (previousFrame.w < 0.5 || previousFrame.z >= 1.0) {return current;}
  let previousCoordinate = previousFrame.xy;
  let currentSurface = textureLoad(normalTexture,
    temporal_getTexelCoordinate(texCoord, textureDimensions(normalTexture)), 0);
  let expectedNormal = normalize((ssrCameraTemporal.currentViewToPreviousView *
    vec4f(currentSurface.xyz * 2.0 - 1.0, 0.0)).xyz);
  let expectedDepth = temporal_getViewDepth(previousCoordinate, previousFrame.z,
    ssrCameraTemporal.previousInverseProjectionMatrix, 0.000001);
  let footprint = temporal_getHistoryFootprint(previousCoordinate, textureDimensions(historyTexture));
  var accumulatedHistory = vec4f(0.0);
  var accumulatedWeight = 0.0;
  // Validate each bilinear tap before mixing to avoid borrowing a foreground edge's history.
  for (var vertical = 0; vertical < 2; vertical++) {
    for (var horizontal = 0; horizontal < 2; horizontal++) {
      let tap = temporal_getHistoryTap(footprint, vec2i(horizontal, vertical));
      let tapCoordinate = tap.normalizedCoordinate;
      let packedDepth = textureLoad(previousDepthTexture,
        temporal_getTexelCoordinate(tapCoordinate, textureDimensions(previousDepthTexture)), 0).rgb;
      let depth = dot(round(packedDepth * 255.0), vec3f(65536.0, 256.0, 1.0)) / 16777215.0;
      let surface = textureLoad(previousNormalTexture,
        temporal_getTexelCoordinate(tapCoordinate, textureDimensions(previousNormalTexture)), 0);
      let normal = normalize(surface.xyz * 2.0 - 1.0);
      let depthDifference = abs(temporal_getViewDepth(tapCoordinate, depth,
        ssrCameraTemporal.previousInverseProjectionMatrix, 0.000001) - expectedDepth) /
        max(expectedDepth, 0.000001);
      let valid = depth < 0.99999 && depthDifference <= ssrCameraTemporal.depthThreshold &&
        dot(normal, expectedNormal) >= ssrCameraTemporal.normalThreshold &&
        abs(surface.a - currentSurface.a) < 0.05;
      let weight = select(0.0, tap.weight, valid);
      accumulatedHistory += textureLoad(historyTexture, tap.coordinate, 0) * weight;
      accumulatedWeight += weight;
    }
  }
  if (accumulatedWeight <= 0.000001) {return current;}
  let history = accumulatedHistory / accumulatedWeight;
  let bounds = temporal_getColorBounds(sourceTexture, sourceTextureSampler, texCoord, current);
  // Missing rays may retain confidence briefly, but never increase it without current support.
  let weight = clamp(ssrCameraTemporal.historyWeight, 0.0, 0.97);
  if (bounds.maximum.a <= 0.001) {return vec4f(history.rgb, history.a * weight);}
  return mix(current, clamp(history, bounds.minimum, bounds.maximum), weight);
}
`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0},
    {name: 'historyTexture', group: 0},
    {name: 'previousDepthTexture', group: 0},
    {name: 'previousNormalTexture', group: 0}
  ],
  props: {} as Partial<SSRCameraTemporalUniforms> & SSRCameraTemporalBindings,
  uniforms: {} as SSRCameraTemporalUniforms,
  bindings: {} as SSRCameraTemporalBindings,
  uniformTypes: {
    currentClipToPreviousClip: 'mat4x4<f32>',
    currentViewToPreviousView: 'mat4x4<f32>',
    previousInverseProjectionMatrix: 'mat4x4<f32>',
    historyWeight: 'f32',
    depthThreshold: 'f32',
    normalThreshold: 'f32'
  },
  propTypes: {
    currentClipToPreviousClip: {value: IDENTITY_MATRIX, private: true},
    currentViewToPreviousView: {value: IDENTITY_MATRIX, private: true},
    previousInverseProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    historyWeight: {value: 0.8, min: 0, max: 0.97},
    depthThreshold: {value: 0.01, min: 0.0001, max: 0.1},
    normalThreshold: {value: 0.96, min: -1, max: 1}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<SSRCameraTemporalUniforms> & SSRCameraTemporalBindings,
  SSRCameraTemporalUniforms,
  SSRCameraTemporalBindings
>;

/** Saves encoded view normals and roughness for reflection history rejection. */
export const ssrNormalHistoryCopy = {
  name: 'ssrNormalHistoryCopy',
  source: /* wgsl */ `
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
fn ssrNormalHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler,
  texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let dimensions = textureDimensions(normalTexture);
  let coordinate = clamp(vec2i(texCoord * vec2f(dimensions)), vec2i(0), vec2i(dimensions) - vec2i(1));
  return textureLoad(normalTexture, coordinate, 0);
}`,
  bindingLayout: [{name: 'normalTexture', group: 0}],
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

/** Preserves 24-bit device depth in a portable rgba8unorm reflection-history texture. */
export const ssrCameraDepthHistoryCopy = {
  name: 'ssrCameraDepthHistoryCopy',
  source: /* wgsl */ `
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
fn ssrCameraDepthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler,
  texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let dimensions = textureDimensions(depthTexture);
  let coordinate = clamp(vec2i(texCoord * vec2f(dimensions)), vec2i(0), vec2i(dimensions) - vec2i(1));
  let depth = textureLoad(depthTexture, coordinate, 0);
  let packed = u32(round(clamp(depth, 0.0, 1.0) * 16777215.0));
  return vec4f(vec3f(f32((packed >> 16u) & 255u), f32((packed >> 8u) & 255u), f32(packed & 255u)) / 255.0, 1.0);
}`,
  bindingLayout: [{name: 'depthTexture', group: 0}],
  passes: [{sampler: true}]
} as const satisfies ShaderPass;
