// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import {Matrix4} from '@math.gl/core';
import {depthAwareBlur} from './depth-aware-blur';

/** Construction options for the horizon-based GTAO pipeline. */
export type GTAOShaderPassPipelineOptions = {
  /** Fractional AO evaluation resolution. Defaults to half resolution. */
  resolutionScale?: number;
  /** Apply visibility to the full image or only to a separately supplied ambient-light texture. */
  composition?: 'color' | 'ambient-only';
};

type GTAOEvaluateUniforms = {
  projectionMatrix: Matrix4;
  inverseProjectionMatrix: Matrix4;
  radius: number;
  bias: number;
  intensity: number;
  frameIndex: number;
};

type GTAOTemporalUniforms = {
  inverseProjectionMatrix: Matrix4;
  historyWeight: number;
  depthThreshold: number;
};

type GTAOCompositeUniforms = {
  strength: number;
  debugMode: number;
};

type GTAOAmbientCompositeBindings = {
  ambientLightingTexture?: Texture;
};

type GTAOBindings = {
  depthTexture?: Texture;
  normalTexture?: Texture;
};

type GTAOTemporalBindings = {
  depthTexture?: Texture;
  velocityTexture?: Texture;
  historyTexture?: Texture;
  previousDepthTexture?: Texture;
};

/** Half-resolution horizon search over G-buffer depth and view normals. */
export const gtaoEvaluate = {
  name: 'gtaoEvaluate',
  source: /* wgsl */ `\
const GTAO_PI: f32 = 3.141592653589793;
const GTAO_SLICE_COUNT: i32 = 4;
const GTAO_STEPS_PER_SIDE: i32 = 6;

struct GTAOEvaluateUniforms {
  projectionMatrix: mat4x4f,
  inverseProjectionMatrix: mat4x4f,
  radius: f32,
  bias: f32,
  intensity: f32,
  frameIndex: f32,
};

@group(0) @binding(auto) var<uniform> gtaoEvaluate: GTAOEvaluateUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn gtaoEvaluate_reconstructViewPosition(uv: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth, 1.0);
  let viewPosition = gtaoEvaluate.inverseProjectionMatrix * clip;
  return viewPosition.xyz / max(viewPosition.w, 0.00001);
}

fn gtaoEvaluate_hash(value: vec2f) -> f32 {
  return fract(sin(dot(value, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn gtaoEvaluate_sampleHorizon(
  centerPosition: vec3f,
  viewDirection: vec3f,
  sliceDirection: vec3f,
  sceneCoord: vec2f,
  direction: vec2f,
  side: f32,
  radiusPixels: f32,
  depthDimensions: vec2f,
  radialJitter: f32
) -> f32 {
  let hemisphereEdge = side * GTAO_PI * 0.5;
  var horizon = hemisphereEdge;
  for (var stepIndex: i32 = 1; stepIndex <= GTAO_STEPS_PER_SIDE; stepIndex++) {
    let fraction = f32(stepIndex) / f32(GTAO_STEPS_PER_SIDE);
    let jitteredFraction =
      (f32(stepIndex) - 1.0 + radialJitter) / f32(GTAO_STEPS_PER_SIDE);
    let sampleOffset = direction * side * radiusPixels * jitteredFraction / depthDimensions;
    let sampleCoord = sceneCoord + sampleOffset;
    if (any(sampleCoord < vec2f(0.0)) || any(sampleCoord > vec2f(1.0))) {
      continue;
    }
    let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleCoord, 0);
    if (sampleDepth >= 0.99999) {
      continue;
    }
    let samplePosition = gtaoEvaluate_reconstructViewPosition(sampleCoord, sampleDepth);
    let delta = samplePosition - centerPosition;
    let distanceToSample = length(delta);
    if (distanceToSample <= 0.0001 || distanceToSample >= gtaoEvaluate.radius) {
      continue;
    }
    let sampleDirection = delta / distanceToSample;
    let sliceProjection = dot(sampleDirection, sliceDirection);
    if (sliceProjection * side <= 0.0) {
      continue;
    }
    let sampleAngle = atan2(sliceProjection, dot(sampleDirection, viewDirection));
    let biasedAngle = sampleAngle + side * gtaoEvaluate.bias;
    let boundedAngle = select(
      clamp(biasedAngle, -GTAO_PI * 0.5, 0.0),
      clamp(biasedAngle, 0.0, GTAO_PI * 0.5),
      side > 0.0
    );
    let distanceFalloff = 1.0 - smoothstep(gtaoEvaluate.radius * 0.35, gtaoEvaluate.radius, distanceToSample);
    let stepFalloff = 1.0 - fraction * 0.15;
    let weightedAngle = mix(hemisphereEdge, boundedAngle, distanceFalloff * stepFalloff);
    horizon = select(max(horizon, weightedAngle), min(horizon, weightedAngle), side > 0.0);
  }
  return horizon;
}

fn gtaoEvaluate_integrateSlice(
  negativeHorizon: f32,
  positiveHorizon: f32,
  normalAngle: f32
) -> f32 {
  let lowerHemisphere = normalAngle - GTAO_PI * 0.5;
  let upperHemisphere = normalAngle + GTAO_PI * 0.5;
  let visibleLower = clamp(negativeHorizon, lowerHemisphere, upperHemisphere);
  let visibleUpper = clamp(positiveHorizon, lowerHemisphere, upperHemisphere);
  let unoccludedLower = clamp(-GTAO_PI * 0.5, lowerHemisphere, upperHemisphere);
  let unoccludedUpper = clamp(GTAO_PI * 0.5, lowerHemisphere, upperHemisphere);
  let visibilityIntegral = max(
    sin(visibleUpper - normalAngle) - sin(visibleLower - normalAngle),
    0.0
  );
  let hemisphereIntegral = max(
    sin(unoccludedUpper - normalAngle) - sin(unoccludedLower - normalAngle),
    0.0001
  );
  return clamp(visibilityIntegral / hemisphereIntegral, 0.0, 1.0);
}

fn gtaoEvaluate_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sceneCoord = texCoord;
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, sceneCoord, 0);
  if (depth >= 0.99999) {
    return vec4f(1.0);
  }

  let centerPosition = gtaoEvaluate_reconstructViewPosition(sceneCoord, depth);
  let normalSample = textureSampleLevel(normalTexture, normalTextureSampler, sceneCoord, 0);
  let normal = normalize(normalSample.xyz * 2.0 - 1.0);
  let depthDimensions = vec2f(textureDimensions(depthTexture));
  let focalLength = abs(gtaoEvaluate.projectionMatrix[1][1]);
  let projectedRadius = gtaoEvaluate.radius * focalLength /
    max(-centerPosition.z, 0.0001) * depthDimensions.y * 0.5;
  let radiusPixels = clamp(projectedRadius, 2.0, 72.0);
  let pixelCoordinate = sceneCoord * depthDimensions;
  let frameOffset = vec2f(gtaoEvaluate.frameIndex * 0.754877666, gtaoEvaluate.frameIndex * 0.569840291);
  let rotation = gtaoEvaluate_hash(floor(pixelCoordinate) + frameOffset) * GTAO_PI;
  let radialJitter = 0.25 + gtaoEvaluate_hash(floor(pixelCoordinate) + frameOffset.yx + 17.0) * 0.75;
  let viewDirection = normalize(-centerPosition);

  var accumulatedVisibility = 0.0;
  var accumulatedWeight = 0.0;
  for (var sliceIndex: i32 = 0; sliceIndex < GTAO_SLICE_COUNT; sliceIndex++) {
    let angle = rotation + f32(sliceIndex) * GTAO_PI / f32(GTAO_SLICE_COUNT);
    let direction = vec2f(cos(angle), sin(angle));
    let sliceSampleCoord = clamp(sceneCoord + direction / depthDimensions, vec2f(0.0), vec2f(1.0));
    let slicePosition = gtaoEvaluate_reconstructViewPosition(sliceSampleCoord, depth);
    let sliceDelta = slicePosition - centerPosition;
    if (length(sliceDelta) <= 0.00001) {
      continue;
    }
    let slicePlaneNormal = normalize(cross(sliceDelta, viewDirection));
    let sliceDirection = normalize(cross(viewDirection, slicePlaneNormal));
    let projectedNormal = normal - slicePlaneNormal * dot(normal, slicePlaneNormal);
    let projectedNormalLength = length(projectedNormal);
    if (projectedNormalLength <= 0.00001) {
      continue;
    }
    let normalizedProjectedNormal = projectedNormal / projectedNormalLength;
    let normalAngle = atan2(
      dot(normalizedProjectedNormal, sliceDirection),
      dot(normalizedProjectedNormal, viewDirection)
    );
    let positiveHorizon = gtaoEvaluate_sampleHorizon(
      centerPosition,
      viewDirection,
      sliceDirection,
      sceneCoord,
      direction,
      1.0,
      radiusPixels,
      depthDimensions,
      radialJitter
    );
    let negativeHorizon = gtaoEvaluate_sampleHorizon(
      centerPosition,
      viewDirection,
      sliceDirection,
      sceneCoord,
      direction,
      -1.0,
      radiusPixels,
      depthDimensions,
      radialJitter
    );
    let sliceVisibility = gtaoEvaluate_integrateSlice(
      negativeHorizon,
      positiveHorizon,
      normalAngle
    );
    accumulatedVisibility += sliceVisibility * projectedNormalLength;
    accumulatedWeight += projectedNormalLength;
  }

  let integratedVisibility = accumulatedVisibility / max(accumulatedWeight, 0.0001);
  let visibility = clamp(
    1.0 - (1.0 - integratedVisibility) * gtaoEvaluate.intensity,
    0.0,
    1.0
  );
  return vec4f(vec3f(visibility), 1.0);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  props: {} as Partial<GTAOEvaluateUniforms> & GTAOBindings,
  uniforms: {} as GTAOEvaluateUniforms,
  bindings: {} as GTAOBindings,
  uniformTypes: {
    projectionMatrix: 'mat4x4<f32>',
    inverseProjectionMatrix: 'mat4x4<f32>',
    radius: 'f32',
    bias: 'f32',
    intensity: 'f32',
    frameIndex: 'f32'
  },
  propTypes: {
    projectionMatrix: {value: new Matrix4(), private: true},
    inverseProjectionMatrix: {value: new Matrix4(), private: true},
    radius: {value: 2.2, min: 0.1, softMax: 8},
    bias: {value: 0.04, min: 0, softMax: 0.25},
    intensity: {value: 3.2, min: 0, softMax: 8},
    frameIndex: {value: 0, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<GTAOEvaluateUniforms> & GTAOBindings,
  GTAOEvaluateUniforms,
  GTAOBindings
>;

/** Reprojects the previous AO result with G-buffer velocity and rejects disocclusions by depth. */
export const gtaoTemporal = {
  name: 'gtaoTemporal',
  source: /* wgsl */ `\
struct GTAOTemporalUniforms {
  inverseProjectionMatrix: mat4x4f,
  historyWeight: f32,
  depthThreshold: f32,
};

@group(0) @binding(auto) var<uniform> gtaoTemporal: GTAOTemporalUniforms;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTextureSampler: sampler;
@group(0) @binding(auto) var velocityTexture: texture_2d<f32>;
@group(0) @binding(auto) var velocityTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var previousDepthTexture: texture_2d<f32>;
@group(0) @binding(auto) var previousDepthTextureSampler: sampler;

fn gtaoTemporal_reconstructViewDepth(texCoord: vec2f, depth: f32) -> f32 {
  let clip = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, depth, 1.0);
  let viewPosition = gtaoTemporal.inverseProjectionMatrix * clip;
  return abs(viewPosition.z / max(abs(viewPosition.w), 0.00001));
}

fn gtaoTemporal_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let current = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let velocity = textureSample(velocityTexture, velocityTextureSampler, texCoord).xy;
  let previousCoord = texCoord - velocity;
  let validCoord = all(previousCoord >= vec2f(0.0)) && all(previousCoord <= vec2f(1.0));
  let clampedPreviousCoord = clamp(previousCoord, vec2f(0.0), vec2f(1.0));
  let currentDepth = textureSample(depthTexture, depthTextureSampler, texCoord);
  let previousDepth = textureSample(
    previousDepthTexture,
    previousDepthTextureSampler,
    clampedPreviousCoord
  ).r;
  let currentViewDepth = gtaoTemporal_reconstructViewDepth(texCoord, currentDepth);
  let previousViewDepth = gtaoTemporal_reconstructViewDepth(
    clampedPreviousCoord,
    previousDepth
  );
  let relativeDepthDifference = abs(previousViewDepth - currentViewDepth) /
    max(currentViewDepth, 0.0001);
  let validDepth = relativeDepthDifference < gtaoTemporal.depthThreshold;

  let texel = 1.0 / vec2f(textureDimensions(sourceTexture));
  var minimumVisibility = current.r;
  var maximumVisibility = current.r;
  for (var y: i32 = -1; y <= 1; y++) {
    for (var x: i32 = -1; x <= 1; x++) {
      let sampleVisibility = textureSample(
        sourceTexture,
        sourceTextureSampler,
        texCoord + vec2f(f32(x), f32(y)) * texel
      ).r;
      minimumVisibility = min(minimumVisibility, sampleVisibility);
      maximumVisibility = max(maximumVisibility, sampleVisibility);
    }
  }
  let historyVisibility = clamp(
    textureSample(historyTexture, historyTextureSampler, clampedPreviousCoord).r,
    minimumVisibility,
    maximumVisibility
  );
  let historyWeight = select(0.0, gtaoTemporal.historyWeight, validCoord && validDepth);
  let visibility = mix(current.r, historyVisibility, historyWeight);
  return vec4f(vec3f(visibility), 1.0);
}`,
  bindingLayout: [
    {name: 'historyTexture', group: 0},
    {name: 'velocityTexture', group: 0},
    {name: 'depthTexture', group: 0},
    {name: 'previousDepthTexture', group: 0}
  ],
  props: {} as Partial<GTAOTemporalUniforms> & GTAOTemporalBindings,
  uniforms: {} as GTAOTemporalUniforms,
  bindings: {} as GTAOTemporalBindings,
  uniformTypes: {
    inverseProjectionMatrix: 'mat4x4<f32>',
    historyWeight: 'f32',
    depthThreshold: 'f32'
  },
  propTypes: {
    inverseProjectionMatrix: {value: new Matrix4(), private: true},
    historyWeight: {value: 0.88, min: 0, max: 0.97},
    depthThreshold: {value: 0.015, min: 0.0001, softMax: 0.1}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<GTAOTemporalUniforms> & GTAOTemporalBindings,
  GTAOTemporalUniforms,
  GTAOTemporalBindings
>;

/** Stores the current hardware depth for next-frame temporal disocclusion rejection. */
export const gtaoDepthHistoryCopy = {
  name: 'gtaoDepthHistoryCopy',
  source: /* wgsl */ `\
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn gtaoDepthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let depth = textureSample(depthTexture, depthTextureSampler, texCoord);
  return vec4f(depth, 0.0, 0.0, 1.0);
}`,
  bindingLayout: [{name: 'depthTexture', group: 0}],
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

/** Multiplies the lit color by denoised ambient visibility, or exposes it as a debug view. */
export const gtaoComposite = {
  name: 'gtaoComposite',
  source: /* wgsl */ `\
struct GTAOCompositeUniforms {
  strength: f32,
  debugMode: f32,
};

@group(0) @binding(auto) var<uniform> gtaoComposite: GTAOCompositeUniforms;
@group(0) @binding(auto) var ambientOcclusionTexture: texture_2d<f32>;
@group(0) @binding(auto) var ambientOcclusionTextureSampler: sampler;

fn gtaoComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let color = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let visibility = textureSample(
    ambientOcclusionTexture,
    ambientOcclusionTextureSampler,
    texCoord
  ).r;
  if (gtaoComposite.debugMode > 0.5) {
    return vec4f(vec3f(visibility), 1.0);
  }
  let ambientVisibility = mix(1.0, visibility, clamp(gtaoComposite.strength, 0.0, 1.0));
  return vec4f(color.rgb * ambientVisibility, color.a);
}`,
  bindingLayout: [{name: 'ambientOcclusionTexture', group: 0}],
  props: {} as Partial<GTAOCompositeUniforms>,
  uniforms: {} as GTAOCompositeUniforms,
  uniformTypes: {
    strength: 'f32',
    debugMode: 'f32'
  },
  propTypes: {
    strength: {value: 0.68, min: 0, max: 1},
    debugMode: {value: 0, min: 0, max: 1, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<Partial<GTAOCompositeUniforms>, GTAOCompositeUniforms>;

/** Applies ambient visibility without darkening direct lighting or emissive scene color. */
export const gtaoAmbientComposite = {
  name: 'gtaoAmbientComposite',
  source: /* wgsl */ `\
struct GTAOAmbientCompositeUniforms {
  strength: f32,
  debugMode: f32,
};

@group(0) @binding(auto) var<uniform> gtaoAmbientComposite: GTAOAmbientCompositeUniforms;
@group(0) @binding(auto) var ambientOcclusionTexture: texture_2d<f32>;
@group(0) @binding(auto) var ambientOcclusionTextureSampler: sampler;
@group(0) @binding(auto) var ambientLightingTexture: texture_2d<f32>;
@group(0) @binding(auto) var ambientLightingTextureSampler: sampler;

fn gtaoAmbientComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let color = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let visibility = textureSample(
    ambientOcclusionTexture,
    ambientOcclusionTextureSampler,
    texCoord
  ).r;
  if (gtaoAmbientComposite.debugMode > 0.5) {
    return vec4f(vec3f(visibility), 1.0);
  }
  let ambientLighting = textureSample(
    ambientLightingTexture,
    ambientLightingTextureSampler,
    texCoord
  ).rgb;
  let ambientVisibility = mix(
    1.0,
    visibility,
    clamp(gtaoAmbientComposite.strength, 0.0, 1.0)
  );
  return vec4f(color.rgb + ambientLighting * (ambientVisibility - 1.0), color.a);
}`,
  bindingLayout: [
    {name: 'ambientOcclusionTexture', group: 0},
    {name: 'ambientLightingTexture', group: 0}
  ],
  props: {} as Partial<GTAOCompositeUniforms> & GTAOAmbientCompositeBindings,
  uniforms: {} as GTAOCompositeUniforms,
  bindings: {} as GTAOAmbientCompositeBindings,
  uniformTypes: {
    strength: 'f32',
    debugMode: 'f32'
  },
  propTypes: {
    strength: {value: 0.68, min: 0, max: 1},
    debugMode: {value: 0, min: 0, max: 1, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<GTAOCompositeUniforms> & GTAOAmbientCompositeBindings,
  GTAOCompositeUniforms,
  GTAOAmbientCompositeBindings
>;

/** Creates a temporally stabilized horizon-based ambient-occlusion pipeline. */
export function createGTAOShaderPassPipeline(
  options: GTAOShaderPassPipelineOptions = {}
): ShaderPassPipeline<
  'gtaoRaw' | 'gtaoHistory' | 'gtaoHistoryDepth' | 'gtaoScratch' | 'gtaoBlurred'
> {
  const scale = options.resolutionScale || 0.5;
  const composite = options.composition === 'ambient-only' ? gtaoAmbientComposite : gtaoComposite;
  return {
    name: 'gtaoShaderPassPipeline',
    renderTargets: {
      gtaoRaw: {scale: [scale, scale], format: 'rgba8unorm'},
      gtaoHistory: {
        scale: [scale, scale],
        format: 'rgba8unorm',
        lifetime: 'history',
        initialize: {clearColor: [1, 1, 1, 1]}
      },
      gtaoHistoryDepth: {
        scale: [scale, scale],
        format: 'rgba16float',
        lifetime: 'history',
        initialize: {clearColor: [1, 0, 0, 1]}
      },
      gtaoScratch: {scale: [scale, scale], format: 'rgba8unorm'},
      gtaoBlurred: {scale: [scale, scale], format: 'rgba8unorm'}
    },
    steps: [
      {
        shaderPass: gtaoEvaluate,
        inputs: {sourceTexture: 'previous'},
        output: 'gtaoRaw'
      },
      {
        shaderPass: gtaoTemporal,
        inputs: {
          sourceTexture: 'gtaoRaw',
          historyTexture: 'gtaoHistory',
          previousDepthTexture: 'gtaoHistoryDepth'
        },
        output: 'gtaoHistory'
      },
      {
        shaderPass: gtaoDepthHistoryCopy,
        inputs: {sourceTexture: 'previous'},
        output: 'gtaoHistoryDepth'
      },
      {
        shaderPass: depthAwareBlur,
        inputs: {sourceTexture: 'gtaoHistory'},
        output: 'gtaoScratch',
        uniforms: {direction: [1, 0], radius: 3, spatialSigma: 2.5, depthSigma: 0.008}
      },
      {
        shaderPass: depthAwareBlur,
        inputs: {sourceTexture: 'gtaoScratch'},
        output: 'gtaoBlurred',
        uniforms: {direction: [0, 1], radius: 3, spatialSigma: 2.5, depthSigma: 0.008}
      },
      {
        shaderPass: composite,
        inputs: {sourceTexture: 'previous', ambientOcclusionTexture: 'gtaoBlurred'},
        output: 'previous'
      }
    ]
  };
}
