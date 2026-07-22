// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import type {NumberArray16} from '@math.gl/core';

/** Construction options for temporally stabilized screen-space reflections. */
export type SSRShaderPassPipelineOptions = {
  /** Fractional ray-tracing, history, and denoising resolution. Defaults to half resolution. */
  resolutionScale?: number;
};

type SSRTraceUniforms = {
  projectionMatrix: Readonly<NumberArray16>;
  inverseProjectionMatrix: Readonly<NumberArray16>;
  intensity: number;
  maxDistance: number;
  thickness: number;
  sampleCount: number;
  maxRoughness: number;
  frameIndex: number;
};

type SSRTemporalUniforms = {
  historyWeight: number;
  depthThreshold: number;
};

type SSRSpatialUniforms = {
  direction: [number, number];
  maxRadius: number;
  depthSigma: number;
};

type SSRCompositeUniforms = {
  strength: number;
  debugMode: number;
};

type SSRTraceBindings = {
  depthTexture?: Texture;
  normalTexture?: Texture;
};

type SSRTemporalBindings = {
  depthTexture?: Texture;
  velocityTexture?: Texture;
  historyTexture?: Texture;
  previousDepthTexture?: Texture;
};

type SSRSpatialBindings = {
  depthTexture?: Texture;
  normalTexture?: Texture;
};

const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** Stochastically traces roughness-aware reflection rays through G-buffer depth. */
export const ssrTrace = {
  name: 'ssrTrace',
  source: /* wgsl */ `\
const SSR_TWO_PI: f32 = 6.283185307179586;

struct SSRTraceUniforms {
  projectionMatrix: mat4x4f,
  inverseProjectionMatrix: mat4x4f,
  intensity: f32,
  maxDistance: f32,
  thickness: f32,
  sampleCount: f32,
  maxRoughness: f32,
  frameIndex: f32,
};

@group(0) @binding(auto) var<uniform> ssrTrace: SSRTraceUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn ssrTrace_reconstructViewPosition(uv: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth, 1.0);
  let viewPosition = ssrTrace.inverseProjectionMatrix * clip;
  return viewPosition.xyz / max(viewPosition.w, 0.00001);
}

fn ssrTrace_projectViewPosition(position: vec3f) -> vec2f {
  let clip = ssrTrace.projectionMatrix * vec4f(position, 1.0);
  let normalizedDeviceCoordinate = clip.xy / max(clip.w, 0.00001);
  return vec2f(
    normalizedDeviceCoordinate.x * 0.5 + 0.5,
    0.5 - normalizedDeviceCoordinate.y * 0.5
  );
}

fn ssrTrace_hash(value: vec2f) -> f32 {
  return fract(sin(dot(value, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn ssrTrace_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sceneCoord = texCoord;
  let normalRoughness = textureSampleLevel(normalTexture, normalTextureSampler, sceneCoord, 0);
  let normal = normalize(normalRoughness.xyz * 2.0 - 1.0);
  let roughness = clamp(normalRoughness.a, 0.0, 1.0);
  let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, sceneCoord, 0);
  if (centerDepth >= 0.99999 || roughness >= ssrTrace.maxRoughness) {
    return vec4f(0.0);
  }

  let viewPosition = ssrTrace_reconstructViewPosition(sceneCoord, centerDepth);
  let incidentDirection = normalize(viewPosition);
  let mirrorDirection = normalize(reflect(incidentDirection, normal));
  let pixelCoordinate = floor(sceneCoord * vec2f(textureDimensions(depthTexture)));
  let noise = ssrTrace_hash(
    pixelCoordinate + vec2f(ssrTrace.frameIndex * 0.754877, ssrTrace.frameIndex * 0.56984)
  );
  let noiseAngle = noise * SSR_TWO_PI;
  let referenceAxis = select(
    vec3f(0.0, 1.0, 0.0),
    vec3f(1.0, 0.0, 0.0),
    abs(mirrorDirection.y) > 0.9
  );
  let tangent = normalize(cross(referenceAxis, mirrorDirection));
  let bitangent = normalize(cross(mirrorDirection, tangent));
  let roughnessCone = roughness * roughness * 0.32;
  let reflectedRay = normalize(
    mirrorDirection + (tangent * cos(noiseAngle) + bitangent * sin(noiseAngle)) * roughnessCone
  );
  let rayOrigin = viewPosition + normal * max(ssrTrace.thickness * 0.12, 0.025);

  var reflection = vec3f(0.0);
  var confidence = 0.0;
  var previousTravel = 0.06;
  var previousDepthDelta = -ssrTrace.thickness;
  let minimumSampleCount = ceil(
    ssrTrace.maxDistance / max(ssrTrace.thickness * 0.72, 0.12)
  );
  let effectiveSampleCount = min(96.0, max(ssrTrace.sampleCount, minimumSampleCount));
  for (var sampleIndex: i32 = 1; sampleIndex <= 96; sampleIndex++) {
    if (f32(sampleIndex) > effectiveSampleCount) {
      break;
    }
    let fraction = (f32(sampleIndex) - noise * 0.42) / max(effectiveSampleCount, 1.0);
    let travel = 0.08 + pow(max(fraction, 0.0), 1.3) * ssrTrace.maxDistance;
    let rayPosition = rayOrigin + reflectedRay * travel;
    if (rayPosition.z >= -0.04) {
      break;
    }
    let sampleCoord = ssrTrace_projectViewPosition(rayPosition);
    if (any(sampleCoord <= vec2f(0.0)) || any(sampleCoord >= vec2f(1.0))) {
      break;
    }
    let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleCoord, 0);
    if (sampleDepth >= 0.99999) {
      previousTravel = travel;
      previousDepthDelta = -ssrTrace.thickness;
      continue;
    }
    let scenePosition = ssrTrace_reconstructViewPosition(sampleCoord, sampleDepth);
    let depthDelta = (-rayPosition.z) - (-scenePosition.z);
    let rayStepLength = max(travel - previousTravel, 0.001);
    let hitThickness = max(ssrTrace.thickness, rayStepLength * 1.2) + travel * 0.008;
    let candidateNormal = normalize(
      textureSampleLevel(normalTexture, normalTextureSampler, sampleCoord, 0).rgb * 2.0 - 1.0
    );
    let entersCandidateSurface = dot(reflectedRay, candidateNormal) < -0.015;
    let crossesCandidateSurface = previousDepthDelta <= 0.0 && depthDelta >= 0.0;
    let screenTravelPixels = length((sampleCoord - sceneCoord) * texSize);
    if (crossesCandidateSurface && depthDelta < hitThickness &&
        entersCandidateSurface && screenTravelPixels > 1.25) {
      var nearTravel = previousTravel;
      var farTravel = travel;
      var hitCoord = sampleCoord;
      for (var refinementIndex: i32 = 0; refinementIndex < 5; refinementIndex++) {
        let refinedTravel = (nearTravel + farTravel) * 0.5;
        let refinedPosition = rayOrigin + reflectedRay * refinedTravel;
        let refinedCoord = ssrTrace_projectViewPosition(refinedPosition);
        let refinedDepth = textureSampleLevel(depthTexture, depthTextureSampler, refinedCoord, 0);
        let refinedScenePosition = ssrTrace_reconstructViewPosition(refinedCoord, refinedDepth);
        if ((-refinedPosition.z) - (-refinedScenePosition.z) >= 0.0) {
          farTravel = refinedTravel;
          hitCoord = refinedCoord;
        } else {
          nearTravel = refinedTravel;
        }
      }
      reflection = textureSampleLevel(sourceTexture, sourceTextureSampler, hitCoord, 0).rgb;
      let screenEdge = min(
        min(hitCoord.x, hitCoord.y),
        min(1.0 - hitCoord.x, 1.0 - hitCoord.y)
      );
      let fresnel = mix(
        0.32,
        1.0,
        pow(1.0 - max(dot(-incidentDirection, normal), 0.0), 5.0)
      );
      let roughnessFade = pow(1.0 - roughness / max(ssrTrace.maxRoughness, 0.001), 1.5);
      let distanceFade = 1.0 - clamp(farTravel / ssrTrace.maxDistance, 0.0, 1.0);
      confidence = smoothstep(0.0, 0.09, screenEdge) * roughnessFade * fresnel *
        distanceFade * ssrTrace.intensity;
      break;
    }
    previousTravel = travel;
    previousDepthDelta = select(-ssrTrace.thickness, depthDelta, entersCandidateSurface);
  }

  return vec4f(reflection, clamp(confidence, 0.0, 1.0));
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  props: {} as Partial<SSRTraceUniforms> & SSRTraceBindings,
  uniforms: {} as SSRTraceUniforms,
  bindings: {} as SSRTraceBindings,
  uniformTypes: {
    projectionMatrix: 'mat4x4<f32>',
    inverseProjectionMatrix: 'mat4x4<f32>',
    intensity: 'f32',
    maxDistance: 'f32',
    thickness: 'f32',
    sampleCount: 'f32',
    maxRoughness: 'f32',
    frameIndex: 'f32'
  },
  propTypes: {
    projectionMatrix: {value: IDENTITY_MATRIX, private: true},
    inverseProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    intensity: {value: 1.35, min: 0, softMax: 4},
    maxDistance: {value: 60, min: 1, softMax: 180},
    thickness: {value: 0.45, min: 0.02, softMax: 3},
    sampleCount: {value: 48, min: 8, max: 96},
    maxRoughness: {value: 0.88, min: 0.1, max: 1},
    frameIndex: {value: 0, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<SSRTraceUniforms> & SSRTraceBindings,
  SSRTraceUniforms,
  SSRTraceBindings
>;

/** Reprojects previous-frame reflection radiance with velocity and rejects disocclusions. */
export const ssrTemporal = {
  name: 'ssrTemporal',
  source: /* wgsl */ `\
struct SSRTemporalUniforms {
  historyWeight: f32,
  depthThreshold: f32,
};

@group(0) @binding(auto) var<uniform> ssrTemporal: SSRTemporalUniforms;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTextureSampler: sampler;
@group(0) @binding(auto) var velocityTexture: texture_2d<f32>;
@group(0) @binding(auto) var velocityTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var previousDepthTexture: texture_2d<f32>;
@group(0) @binding(auto) var previousDepthTextureSampler: sampler;

fn ssrTemporal_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let current = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let currentDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (currentDepth >= 0.99999) {
    return vec4f(0.0);
  }

  let velocity = textureSampleLevel(velocityTexture, velocityTextureSampler, texCoord, 0).xy;
  let previousCoord = texCoord - velocity;
  let validCoordinate = all(previousCoord >= vec2f(0.0)) &&
    all(previousCoord <= vec2f(1.0));
  let clampedPreviousCoord = clamp(previousCoord, vec2f(0.0), vec2f(1.0));
  let previousDepth = textureSampleLevel(
    previousDepthTexture,
    previousDepthTextureSampler,
    clampedPreviousCoord,
    0
  ).r;
  let validDepth = abs(previousDepth - currentDepth) < ssrTemporal.depthThreshold;

  let texel = 1.0 / vec2f(textureDimensions(sourceTexture));
  var minimumReflection = current;
  var maximumReflection = current;
  for (var sampleY: i32 = -1; sampleY <= 1; sampleY++) {
    for (var sampleX: i32 = -1; sampleX <= 1; sampleX++) {
      let sampleCoord = clamp(
        texCoord + vec2f(f32(sampleX), f32(sampleY)) * texel,
        vec2f(0.0),
        vec2f(1.0)
      );
      let neighborhoodReflection = textureSampleLevel(
        sourceTexture,
        sourceTextureSampler,
        sampleCoord,
        0
      );
      minimumReflection = min(minimumReflection, neighborhoodReflection);
      maximumReflection = max(maximumReflection, neighborhoodReflection);
    }
  }

  let historyReflection = clamp(
    textureSampleLevel(historyTexture, historyTextureSampler, clampedPreviousCoord, 0),
    minimumReflection,
    maximumReflection
  );
  let validHistory = validCoordinate && validDepth && current.a > 0.001 &&
    historyReflection.a > 0.001;
  let historyWeight = select(0.0, ssrTemporal.historyWeight, validHistory);
  return mix(current, historyReflection, historyWeight);
}`,
  bindingLayout: [
    {name: 'historyTexture', group: 0},
    {name: 'velocityTexture', group: 0},
    {name: 'depthTexture', group: 0},
    {name: 'previousDepthTexture', group: 0}
  ],
  props: {} as Partial<SSRTemporalUniforms> & SSRTemporalBindings,
  uniforms: {} as SSRTemporalUniforms,
  bindings: {} as SSRTemporalBindings,
  uniformTypes: {
    historyWeight: 'f32',
    depthThreshold: 'f32'
  },
  propTypes: {
    historyWeight: {value: 0.86, min: 0, max: 0.97},
    depthThreshold: {value: 0.018, min: 0.0001, softMax: 0.1}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<SSRTemporalUniforms> & SSRTemporalBindings,
  SSRTemporalUniforms,
  SSRTemporalBindings
>;

/** Saves the current scene depth for next-frame reflection disocclusion rejection. */
export const ssrDepthHistoryCopy = {
  name: 'ssrDepthHistoryCopy',
  source: /* wgsl */ `\
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn ssrDepthHistoryCopy_sampleColor(
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

/** Applies roughness-adaptive, depth/normal-aware reflection denoising in one direction. */
export const ssrSpatial = {
  name: 'ssrSpatial',
  source: /* wgsl */ `\
struct SSRSpatialUniforms {
  direction: vec2f,
  maxRadius: f32,
  depthSigma: f32,
};

@group(0) @binding(auto) var<uniform> ssrSpatial: SSRSpatialUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn ssrSpatial_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let centerReflection = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let centerNormalRoughness = textureSampleLevel(normalTexture, normalTextureSampler, texCoord, 0);
  let roughness = clamp(centerNormalRoughness.a, 0.0, 1.0);
  let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (centerDepth >= 0.99999) {
    return vec4f(0.0);
  }
  let hasCenterReflection = centerReflection.a > 0.001;
  if (!hasCenterReflection && roughness >= 0.28) {
    return centerReflection;
  }
  let minimumRadius = select(5.0, 0.95, hasCenterReflection);
  let radius = clamp(
    max(roughness * roughness * ssrSpatial.maxRadius, minimumRadius),
    minimumRadius,
    6.0
  );

  let centerNormal = normalize(centerNormalRoughness.rgb * 2.0 - 1.0);
  let texel = ssrSpatial.direction / vec2f(textureDimensions(sourceTexture));
  let centerWeight = select(0.0, 1.0, hasCenterReflection);
  var reflection = centerReflection * centerWeight;
  var totalWeight = centerWeight;
  var supportingSampleCount = 0u;
  for (var sampleIndex: i32 = 1; sampleIndex <= 6; sampleIndex++) {
    if (f32(sampleIndex) > ceil(radius)) {
      break;
    }
    for (var side: i32 = -1; side <= 1; side += 2) {
      let sampleCoord = clamp(
        texCoord + texel * f32(sampleIndex * side),
        vec2f(0.0),
        vec2f(1.0)
      );
      let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleCoord, 0);
      let sampleNormal = normalize(
        textureSampleLevel(normalTexture, normalTextureSampler, sampleCoord, 0).rgb * 2.0 - 1.0
      );
      let depthDelta = abs(sampleDepth - centerDepth);
      let depthWeight = exp(
        -(depthDelta * depthDelta) /
          max(2.0 * ssrSpatial.depthSigma * ssrSpatial.depthSigma, 0.000001)
      );
      let normalWeight = pow(max(dot(centerNormal, sampleNormal), 0.0), 16.0);
      let distanceWeight = exp(
        -f32(sampleIndex * sampleIndex) / max(2.0 * radius * radius, 0.1)
      );
      let sampleReflection = textureSampleLevel(sourceTexture, sourceTextureSampler, sampleCoord, 0);
      let confidenceWeight = smoothstep(0.001, 0.12, sampleReflection.a);
      let belongsToSamePlane = dot(centerNormal, sampleNormal) > 0.9995;
      let surfaceWeight = select(0.0, 1.0, hasCenterReflection || belongsToSamePlane);
      let weight = depthWeight * normalWeight * distanceWeight * confidenceWeight * surfaceWeight;
      if (weight > 0.001) {
        supportingSampleCount += 1u;
      }
      reflection += sampleReflection * weight;
      totalWeight += weight;
    }
  }

  if ((!hasCenterReflection && supportingSampleCount < 2u) || totalWeight <= 0.0001) {
    return centerReflection;
  }
  return reflection / totalWeight;
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  props: {} as Partial<SSRSpatialUniforms> & SSRSpatialBindings,
  uniforms: {} as SSRSpatialUniforms,
  bindings: {} as SSRSpatialBindings,
  uniformTypes: {
    direction: 'vec2<f32>',
    maxRadius: 'f32',
    depthSigma: 'f32'
  },
  propTypes: {
    direction: {value: [1, 0]},
    maxRadius: {value: 5, min: 0, max: 8},
    depthSigma: {value: 0.012, min: 0.0001, softMax: 0.1}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<SSRSpatialUniforms> & SSRSpatialBindings,
  SSRSpatialUniforms,
  SSRSpatialBindings
>;

/** Composes stabilized reflection radiance or exposes reflection/confidence debug views. */
export const ssrComposite = {
  name: 'ssrComposite',
  source: /* wgsl */ `\
struct SSRCompositeUniforms {
  strength: f32,
  debugMode: f32,
};

@group(0) @binding(auto) var<uniform> ssrComposite: SSRCompositeUniforms;
@group(0) @binding(auto) var reflectionTexture: texture_2d<f32>;
@group(0) @binding(auto) var reflectionTextureSampler: sampler;

fn ssrComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let color = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let reflection = textureSampleLevel(reflectionTexture, reflectionTextureSampler, texCoord, 0);
  if (ssrComposite.debugMode > 1.5) {
    let confidence = clamp(reflection.a, 0.0, 1.0);
    let lowConfidence = vec3f(0.045, 0.08, 0.22);
    let highConfidence = vec3f(1.0, 0.7, 0.16);
    return vec4f(mix(lowConfidence, highConfidence, confidence), 1.0);
  }
  if (ssrComposite.debugMode > 0.5) {
    return vec4f(reflection.rgb * reflection.a, 1.0);
  }
  let reflectionWeight = clamp(reflection.a * ssrComposite.strength, 0.0, 1.0);
  return vec4f(color.rgb + reflection.rgb * reflectionWeight, color.a);
}`,
  bindingLayout: [{name: 'reflectionTexture', group: 0}],
  props: {} as Partial<SSRCompositeUniforms>,
  uniforms: {} as SSRCompositeUniforms,
  uniformTypes: {strength: 'f32', debugMode: 'f32'},
  propTypes: {
    strength: {value: 1, min: 0, softMax: 2},
    debugMode: {value: 0, min: 0, max: 2, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<Partial<SSRCompositeUniforms>, SSRCompositeUniforms>;

/** Creates a roughness-aware, temporally stabilized screen-space reflection pipeline. */
export function createSSRShaderPassPipeline(
  options: SSRShaderPassPipelineOptions = {}
): ShaderPassPipeline<
  'ssrRaw' | 'ssrHistory' | 'ssrHistoryDepth' | 'ssrScratch' | 'ssrReflection'
> {
  const scale = options.resolutionScale || 0.5;
  return {
    name: 'ssrShaderPassPipeline',
    renderTargets: {
      ssrRaw: {scale: [scale, scale], format: 'rgba16float'},
      ssrHistory: {
        scale: [scale, scale],
        format: 'rgba16float',
        lifetime: 'history',
        initialize: {clearColor: [0, 0, 0, 0]}
      },
      ssrHistoryDepth: {
        scale: [scale, scale],
        format: 'rgba16float',
        lifetime: 'history',
        initialize: {clearColor: [1, 0, 0, 1]}
      },
      ssrScratch: {scale: [scale, scale], format: 'rgba16float'},
      ssrReflection: {scale: [scale, scale], format: 'rgba16float'}
    },
    steps: [
      {
        shaderPass: ssrTrace,
        inputs: {sourceTexture: 'previous'},
        output: 'ssrRaw'
      },
      {
        shaderPass: ssrTemporal,
        inputs: {
          sourceTexture: 'ssrRaw',
          historyTexture: 'ssrHistory',
          previousDepthTexture: 'ssrHistoryDepth'
        },
        output: 'ssrHistory'
      },
      {
        shaderPass: ssrDepthHistoryCopy,
        inputs: {sourceTexture: 'previous'},
        output: 'ssrHistoryDepth'
      },
      {
        shaderPass: ssrSpatial,
        inputs: {sourceTexture: 'ssrHistory'},
        output: 'ssrScratch',
        uniforms: {direction: [1, 0]}
      },
      {
        shaderPass: ssrSpatial,
        inputs: {sourceTexture: 'ssrScratch'},
        output: 'ssrReflection',
        uniforms: {direction: [0, 1]}
      },
      {
        shaderPass: ssrComposite,
        inputs: {sourceTexture: 'previous', reflectionTexture: 'ssrReflection'},
        output: 'previous'
      }
    ]
  };
}
