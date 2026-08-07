// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import type {NumberArray16} from '@math.gl/core';
import {copyPass} from './copy-pass';

/** Uniforms needed to reproject a static-world pixel into the previous camera frame. */
export type CameraReprojectionTAAUniforms = {
  /**
   * Inverse of the current unjittered view-projection matrix.
   * Jitter is supplied separately in UV units.
   */
  inverseViewProjectionMatrix: Readonly<NumberArray16>;
  /** Previous unjittered view-projection matrix. */
  previousViewProjectionMatrix: Readonly<NumberArray16>;
  /** Fraction of validated history blended into the current frame. */
  historyWeight: number;
  /** Maximum normalized-device-depth disagreement before history is rejected. */
  depthThreshold: number;
  /** Current projection jitter in UV units. */
  currentJitter: [number, number];
  /** Previous projection jitter in UV units. */
  previousJitter: [number, number];
};

type CameraReprojectionTAABindings = {
  depthTexture?: Texture;
  historyTexture?: Texture;
  previousDepthTexture?: Texture;
};

const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/**
 * Reprojects current depth into a previous camera frame, rejecting disoccluded history.
 *
 * This is intentionally camera-only. Moving objects need a velocity-aware pass or their
 * history must be reset by the caller.
 */
export const cameraReprojectionTaaResolve = {
  name: 'cameraReprojectionTaaResolve',
  source: /* wgsl */ `\
const CAMERA_REPROJECTION_TAA_EPSILON: f32 = 0.00001;

struct CameraReprojectionTaaResolveUniforms {
  inverseViewProjectionMatrix: mat4x4f,
  previousViewProjectionMatrix: mat4x4f,
  historyWeight: f32,
  depthThreshold: f32,
  currentJitter: vec2f,
  previousJitter: vec2f,
};

@group(0) @binding(auto) var<uniform> cameraReprojectionTaaResolve:
  CameraReprojectionTaaResolveUniforms;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var previousDepthTexture: texture_2d<f32>;

fn cameraReprojectionTaaResolve_previousFrameCoordinate(
  texCoord: vec2f,
  depth: f32
) -> vec4f {
  let unjitteredCoordinate = texCoord - cameraReprojectionTaaResolve.currentJitter;
  if (any(unjitteredCoordinate < vec2f(0.0)) ||
      any(unjitteredCoordinate > vec2f(1.0))) {
    return vec4f(0.0);
  }

  let currentClip = vec4f(
    unjitteredCoordinate.x * 2.0 - 1.0,
    1.0 - unjitteredCoordinate.y * 2.0,
    depth,
    1.0
  );
  let worldPositionHomogeneous =
    cameraReprojectionTaaResolve.inverseViewProjectionMatrix * currentClip;
  if (abs(worldPositionHomogeneous.w) <= CAMERA_REPROJECTION_TAA_EPSILON) {
    return vec4f(0.0);
  }

  let worldPosition = worldPositionHomogeneous.xyz / worldPositionHomogeneous.w;
  let previousClip =
    cameraReprojectionTaaResolve.previousViewProjectionMatrix * vec4f(worldPosition, 1.0);
  if (previousClip.w <= CAMERA_REPROJECTION_TAA_EPSILON) {
    return vec4f(0.0);
  }

  let previousNormalizedDeviceCoordinate = previousClip.xyz / previousClip.w;
  let previousCoordinate =
    previousNormalizedDeviceCoordinate.xy * vec2f(0.5, -0.5) +
    vec2f(0.5) +
    cameraReprojectionTaaResolve.previousJitter;
  let expectedPreviousDepth = previousNormalizedDeviceCoordinate.z;
  let validCoordinate = all(previousCoordinate >= vec2f(0.0)) &&
    all(previousCoordinate <= vec2f(1.0));
  let validDepthRange = expectedPreviousDepth >= 0.0 && expectedPreviousDepth <= 1.0;
  return vec4f(
    previousCoordinate,
    expectedPreviousDepth,
    select(0.0, 1.0, validCoordinate && validDepthRange)
  );
}

fn cameraReprojectionTaaResolve_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let currentColor = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let currentDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (currentDepth >= 0.99999) {
    return currentColor;
  }

  let previousFrame = cameraReprojectionTaaResolve_previousFrameCoordinate(
    texCoord,
    currentDepth
  );
  if (previousFrame.w < 0.5) {
    return currentColor;
  }

  let sourceTexel = 1.0 / vec2f(textureDimensions(sourceTexture));
  var minimumColor = currentColor.rgb;
  var maximumColor = currentColor.rgb;
  for (var sampleY: i32 = -1; sampleY <= 1; sampleY++) {
    for (var sampleX: i32 = -1; sampleX <= 1; sampleX++) {
      let sampleCoordinate = clamp(
        texCoord + vec2f(f32(sampleX), f32(sampleY)) * sourceTexel,
        vec2f(0.0),
        vec2f(1.0)
      );
      let sampleColor = textureSampleLevel(
        sourceTexture,
        sourceTextureSampler,
        sampleCoordinate,
        0
      ).rgb;
      minimumColor = min(minimumColor, sampleColor);
      maximumColor = max(maximumColor, sampleColor);
    }
  }

  let historyDimensions = textureDimensions(historyTexture);
  let historyPosition = previousFrame.xy * vec2f(historyDimensions) - vec2f(0.5);
  let baseHistoryCoordinate = vec2i(floor(historyPosition));
  let historyFraction = fract(historyPosition);
  var accumulatedHistoryColor = vec3f(0.0);
  var accumulatedHistoryWeight = 0.0;
  for (var tapY: i32 = 0; tapY <= 1; tapY++) {
    for (var tapX: i32 = 0; tapX <= 1; tapX++) {
      let historyCoordinate = clamp(
        baseHistoryCoordinate + vec2i(tapX, tapY),
        vec2i(0),
        vec2i(historyDimensions) - vec2i(1)
      );
      let tapDepth = textureLoad(previousDepthTexture, historyCoordinate, 0).r;
      let validTapDepth =
        abs(tapDepth - previousFrame.z) <= cameraReprojectionTaaResolve.depthThreshold;
      let horizontalWeight = select(1.0 - historyFraction.x, historyFraction.x, tapX == 1);
      let verticalWeight = select(1.0 - historyFraction.y, historyFraction.y, tapY == 1);
      let tapWeight = select(0.0, horizontalWeight * verticalWeight, validTapDepth);
      accumulatedHistoryColor += textureLoad(historyTexture, historyCoordinate, 0).rgb *
        tapWeight;
      accumulatedHistoryWeight += tapWeight;
    }
  }

  if (accumulatedHistoryWeight <= CAMERA_REPROJECTION_TAA_EPSILON) {
    return currentColor;
  }

  let historyColor = accumulatedHistoryColor / accumulatedHistoryWeight;
  let clampedHistoryColor = clamp(historyColor, minimumColor, maximumColor);
  let resolvedColor = mix(
    currentColor.rgb,
    clampedHistoryColor,
    cameraReprojectionTaaResolve.historyWeight
  );
  return vec4f(resolvedColor, currentColor.a);
}`,
  bindingLayout: [
    {name: 'historyTexture', group: 0},
    {name: 'depthTexture', group: 0},
    {name: 'previousDepthTexture', group: 0}
  ],
  props: {} as Partial<CameraReprojectionTAAUniforms> & CameraReprojectionTAABindings,
  uniforms: {} as CameraReprojectionTAAUniforms,
  bindings: {} as CameraReprojectionTAABindings,
  uniformTypes: {
    inverseViewProjectionMatrix: 'mat4x4<f32>',
    previousViewProjectionMatrix: 'mat4x4<f32>',
    historyWeight: 'f32',
    depthThreshold: 'f32',
    currentJitter: 'vec2<f32>',
    previousJitter: 'vec2<f32>'
  },
  propTypes: {
    inverseViewProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    previousViewProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    historyWeight: {value: 0.9, min: 0, max: 0.98},
    depthThreshold: {value: 0.0025, min: 0.00001, softMax: 0.05},
    currentJitter: {value: [0, 0], private: true},
    previousJitter: {value: [0, 0], private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<CameraReprojectionTAAUniforms> & CameraReprojectionTAABindings,
  CameraReprojectionTAAUniforms,
  CameraReprojectionTAABindings
>;

/** Copies current device depth into a filterable history texture for the next frame. */
export const cameraReprojectionTaaDepthHistoryCopy = {
  name: 'cameraReprojectionTaaDepthHistoryCopy',
  source: /* wgsl */ `\
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn cameraReprojectionTaaDepthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  return vec4f(depth, 0.0, 0.0, 1.0);
}`,
  bindingLayout: [{name: 'depthTexture', group: 0}],
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

/**
 * Creates a full-resolution HDR camera-reprojection TAA pipeline.
 *
 * The caller must bind current depth and update both matrices/jitter every frame. Reset the
 * renderer history after resize, camera cuts, or moving-object topology changes.
 */
export function createCameraReprojectionTAAShaderPassPipeline(): ShaderPassPipeline<
  'cameraReprojectionTaaHistoryColor' | 'cameraReprojectionTaaHistoryDepth'
> {
  return {
    name: 'cameraReprojectionTaaShaderPassPipeline',
    renderTargets: {
      cameraReprojectionTaaHistoryColor: {
        format: 'rgba16float',
        lifetime: 'history',
        initialize: 'original'
      },
      cameraReprojectionTaaHistoryDepth: {
        format: 'rgba16float',
        lifetime: 'history',
        initialize: {clearColor: [1, 0, 0, 1]}
      }
    },
    steps: [
      {
        shaderPass: cameraReprojectionTaaResolve,
        inputs: {
          sourceTexture: 'previous',
          historyTexture: 'cameraReprojectionTaaHistoryColor',
          previousDepthTexture: 'cameraReprojectionTaaHistoryDepth'
        },
        output: 'cameraReprojectionTaaHistoryColor'
      },
      {
        shaderPass: copyPass,
        inputs: {sourceTexture: 'cameraReprojectionTaaHistoryColor'},
        output: 'previous'
      },
      {
        shaderPass: cameraReprojectionTaaDepthHistoryCopy,
        inputs: {sourceTexture: 'previous'},
        output: 'cameraReprojectionTaaHistoryDepth'
      }
    ]
  };
}
