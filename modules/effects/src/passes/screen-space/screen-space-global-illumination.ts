// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import type {NumberArray16} from '@math.gl/core';

/** Construction options for temporally stabilized diffuse screen-space global illumination. */
export type SSGIShaderPassPipelineOptions = {
  /** Fractional tracing, history, and denoising resolution. Defaults to half resolution. */
  resolutionScale?: number;
};

type SSGITraceUniforms = {
  projectionMatrix: Readonly<NumberArray16>;
  inverseProjectionMatrix: Readonly<NumberArray16>;
  radius: number;
  thickness: number;
  intensity: number;
  rayCount: number;
  stepCount: number;
  frameIndex: number;
};

type SSGITemporalUniforms = {
  inverseProjectionMatrix: Readonly<NumberArray16>;
  historyWeight: number;
  depthThreshold: number;
};

type SSGISpatialUniforms = {
  direction: [number, number];
  radius: number;
  depthSigma: number;
};

type SSGICompositeUniforms = {
  strength: number;
  debugMode: number;
};

type SSGITraceBindings = {
  depthTexture?: Texture;
  normalTexture?: Texture;
};

type SSGITemporalBindings = {
  depthTexture?: Texture;
  velocityTexture?: Texture;
  historyTexture?: Texture;
  previousDepthTexture?: Texture;
};

type SSGISpatialBindings = {
  depthTexture?: Texture;
  normalTexture?: Texture;
};

const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** Traces cosine-weighted hemisphere rays through lit scene color and G-buffer depth. */
export const ssgiTrace = {
  name: 'ssgiTrace',
  source: /* wgsl */ `\
const SSGI_TWO_PI: f32 = 6.283185307179586;
const SSGI_GOLDEN_ANGLE: f32 = 2.399963229728653;
const SSGI_MAX_RAYS: i32 = 12;
const SSGI_MAX_STEPS: i32 = 12;

struct SSGITraceUniforms {
  projectionMatrix: mat4x4f,
  inverseProjectionMatrix: mat4x4f,
  radius: f32,
  thickness: f32,
  intensity: f32,
  rayCount: f32,
  stepCount: f32,
  frameIndex: f32,
};

@group(0) @binding(auto) var<uniform> ssgiTrace: SSGITraceUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn ssgiTrace_reconstructViewPosition(texCoord: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, depth, 1.0);
  let viewPosition = ssgiTrace.inverseProjectionMatrix * clip;
  return viewPosition.xyz / max(viewPosition.w, 0.00001);
}

fn ssgiTrace_projectViewPosition(viewPosition: vec3f) -> vec2f {
  let clip = ssgiTrace.projectionMatrix * vec4f(viewPosition, 1.0);
  let normalizedDeviceCoordinate = clip.xy / max(clip.w, 0.00001);
  return normalizedDeviceCoordinate * vec2f(0.5, -0.5) + vec2f(0.5);
}

fn ssgiTrace_hash(value: vec2f) -> f32 {
  return fract(sin(dot(value, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn ssgiTrace_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (centerDepth >= 0.99999 || ssgiTrace.intensity <= 0.0001) {
    return vec4f(0.0);
  }

  let centerPosition = ssgiTrace_reconstructViewPosition(texCoord, centerDepth);
  let centerNormalSample = textureSampleLevel(normalTexture, normalTextureSampler, texCoord, 0);
  let centerNormal = normalize(centerNormalSample.rgb * 2.0 - 1.0);
  let roughness = clamp(centerNormalSample.a, 0.0, 1.0);
  let referenceAxis = select(
    vec3f(0.0, 1.0, 0.0),
    vec3f(1.0, 0.0, 0.0),
    abs(centerNormal.y) > 0.9
  );
  let tangent = normalize(cross(referenceAxis, centerNormal));
  let bitangent = normalize(cross(centerNormal, tangent));
  let pixelCoordinate = floor(texCoord * vec2f(textureDimensions(depthTexture)));
  let rotation = ssgiTrace_hash(pixelCoordinate) * SSGI_TWO_PI;
  let activeRayCount = clamp(i32(ssgiTrace.rayCount), 1, SSGI_MAX_RAYS);
  let activeStepCount = clamp(i32(ssgiTrace.stepCount), 2, SSGI_MAX_STEPS);

  var indirectRadiance = vec3f(0.0);
  var accumulatedWeight = 0.0;
  var hitCount = 0.0;
  for (var rayIndex: i32 = 0; rayIndex < SSGI_MAX_RAYS; rayIndex++) {
    if (rayIndex >= activeRayCount) {
      break;
    }

    let distribution = (f32(rayIndex) + 0.5) / f32(activeRayCount);
    let cosine = sqrt(1.0 - distribution * 0.82);
    let sine = sqrt(max(1.0 - cosine * cosine, 0.0));
    let angle = rotation + f32(rayIndex) * SSGI_GOLDEN_ANGLE;
    let rayDirection = normalize(
      centerNormal * cosine +
        (tangent * cos(angle) + bitangent * sin(angle)) * sine
    );
    let rayOrigin = centerPosition + centerNormal * max(ssgiTrace.thickness * 0.2, 0.025);
    var previousDepthDelta = -ssgiTrace.thickness;

    for (var stepIndex: i32 = 1; stepIndex <= SSGI_MAX_STEPS; stepIndex++) {
      if (stepIndex > activeStepCount) {
        break;
      }

      let stepFraction = f32(stepIndex) / f32(activeStepCount);
      let travel = max(ssgiTrace.radius * pow(stepFraction, 1.35), 0.04);
      let rayPosition = rayOrigin + rayDirection * travel;
      if (rayPosition.z >= -0.04) {
        break;
      }

      let sampleCoord = ssgiTrace_projectViewPosition(rayPosition);
      if (any(sampleCoord <= vec2f(0.0)) || any(sampleCoord >= vec2f(1.0))) {
        break;
      }

      let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleCoord, 0);
      if (sampleDepth >= 0.99999) {
        previousDepthDelta = -ssgiTrace.thickness;
        continue;
      }

      let samplePosition = ssgiTrace_reconstructViewPosition(sampleCoord, sampleDepth);
      let depthDelta = (-rayPosition.z) - (-samplePosition.z);
      let stepDistance = ssgiTrace.radius / f32(activeStepCount);
      let hitThickness = max(ssgiTrace.thickness, stepDistance * 1.25);
      let screenDistance = length((sampleCoord - texCoord) * texSize);
      if (previousDepthDelta <= 0.0 && depthDelta >= 0.0 &&
          depthDelta <= hitThickness && screenDistance > 1.5) {
        let sampleNormal = normalize(
          textureSampleLevel(normalTexture, normalTextureSampler, sampleCoord, 0).rgb * 2.0 - 1.0
        );
        let emitterFacing = max(dot(sampleNormal, -rayDirection), 0.0);
        let receiverFacing = max(dot(centerNormal, rayDirection), 0.0);
        let distanceFalloff = 1.0 - smoothstep(
          ssgiTrace.radius * 0.28,
          ssgiTrace.radius,
          travel
        );
        let edgeDistance = min(
          min(sampleCoord.x, sampleCoord.y),
          min(1.0 - sampleCoord.x, 1.0 - sampleCoord.y)
        );
        let edgeWeight = smoothstep(0.0, 0.075, edgeDistance);
        let sampleWeight = receiverFacing * (0.2 + emitterFacing * 0.8) *
          distanceFalloff * edgeWeight;
        let sourceRadiance = textureSampleLevel(
          sourceTexture,
          sourceTextureSampler,
          sampleCoord,
          0
        ).rgb;
        indirectRadiance += sourceRadiance * sampleWeight;
        accumulatedWeight += sampleWeight;
        hitCount += select(0.0, 1.0, sampleWeight > 0.0001);
        break;
      }
      previousDepthDelta = depthDelta;
    }
  }

  let diffuseResponse = mix(0.18, 1.0, roughness);
  let radiance = indirectRadiance /
    max(f32(activeRayCount), 1.0) * ssgiTrace.intensity * diffuseResponse;
  let confidence = clamp(hitCount / max(f32(activeRayCount), 1.0), 0.0, 1.0);
  return vec4f(radiance, confidence);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  props: {} as Partial<SSGITraceUniforms> & SSGITraceBindings,
  uniforms: {} as SSGITraceUniforms,
  bindings: {} as SSGITraceBindings,
  uniformTypes: {
    projectionMatrix: 'mat4x4<f32>',
    inverseProjectionMatrix: 'mat4x4<f32>',
    radius: 'f32',
    thickness: 'f32',
    intensity: 'f32',
    rayCount: 'f32',
    stepCount: 'f32',
    frameIndex: 'f32'
  },
  propTypes: {
    projectionMatrix: {value: IDENTITY_MATRIX, private: true},
    inverseProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    radius: {value: 4.5, min: 0.2, softMax: 12},
    thickness: {value: 0.32, min: 0.02, softMax: 2},
    intensity: {value: 2.2, min: 0, softMax: 6},
    rayCount: {value: 7, min: 1, max: 12},
    stepCount: {value: 8, min: 2, max: 12},
    frameIndex: {value: 0, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<SSGITraceUniforms> & SSGITraceBindings,
  SSGITraceUniforms,
  SSGITraceBindings
>;

/** Reprojects diffuse bounce history with velocity and relative linear-depth rejection. */
export const ssgiTemporal = {
  name: 'ssgiTemporal',
  source: /* wgsl */ `\
struct SSGITemporalUniforms {
  inverseProjectionMatrix: mat4x4f,
  historyWeight: f32,
  depthThreshold: f32,
};

@group(0) @binding(auto) var<uniform> ssgiTemporal: SSGITemporalUniforms;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTextureSampler: sampler;
@group(0) @binding(auto) var velocityTexture: texture_2d<f32>;
@group(0) @binding(auto) var velocityTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var previousDepthTexture: texture_2d<f32>;
@group(0) @binding(auto) var previousDepthTextureSampler: sampler;

fn ssgiTemporal_reconstructViewDepth(texCoord: vec2f, depth: f32) -> f32 {
  let clip = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, depth, 1.0);
  let viewPosition = ssgiTemporal.inverseProjectionMatrix * clip;
  return abs(viewPosition.z / max(abs(viewPosition.w), 0.00001));
}

fn ssgiTemporal_sampleColor(
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
  let currentViewDepth = ssgiTemporal_reconstructViewDepth(texCoord, currentDepth);
  let previousViewDepth = ssgiTemporal_reconstructViewDepth(clampedPreviousCoord, previousDepth);
  let relativeDepthDifference = abs(previousViewDepth - currentViewDepth) /
    max(currentViewDepth, 0.0001);
  let validDepth = relativeDepthDifference < ssgiTemporal.depthThreshold;

  let texel = 1.0 / vec2f(textureDimensions(sourceTexture));
  var minimumRadiance = current;
  var maximumRadiance = current;
  for (var sampleY: i32 = -1; sampleY <= 1; sampleY++) {
    for (var sampleX: i32 = -1; sampleX <= 1; sampleX++) {
      let sampleCoord = clamp(
        texCoord + vec2f(f32(sampleX), f32(sampleY)) * texel,
        vec2f(0.0),
        vec2f(1.0)
      );
      let neighborhoodRadiance = textureSampleLevel(
        sourceTexture,
        sourceTextureSampler,
        sampleCoord,
        0
      );
      minimumRadiance = min(minimumRadiance, neighborhoodRadiance);
      maximumRadiance = max(maximumRadiance, neighborhoodRadiance);
    }
  }

  let historyRadiance = clamp(
    textureSampleLevel(historyTexture, historyTextureSampler, clampedPreviousCoord, 0),
    minimumRadiance,
    maximumRadiance
  );
  let historyWeight = select(
    0.0,
    ssgiTemporal.historyWeight,
    validCoordinate && validDepth
  );
  return mix(current, historyRadiance, historyWeight);
}`,
  bindingLayout: [
    {name: 'historyTexture', group: 0},
    {name: 'velocityTexture', group: 0},
    {name: 'depthTexture', group: 0},
    {name: 'previousDepthTexture', group: 0}
  ],
  props: {} as Partial<SSGITemporalUniforms> & SSGITemporalBindings,
  uniforms: {} as SSGITemporalUniforms,
  bindings: {} as SSGITemporalBindings,
  uniformTypes: {
    inverseProjectionMatrix: 'mat4x4<f32>',
    historyWeight: 'f32',
    depthThreshold: 'f32'
  },
  propTypes: {
    inverseProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    historyWeight: {value: 0.89, min: 0, max: 0.97},
    depthThreshold: {value: 0.022, min: 0.0001, softMax: 0.1}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<SSGITemporalUniforms> & SSGITemporalBindings,
  SSGITemporalUniforms,
  SSGITemporalBindings
>;

/** Stores scene depth for diffuse-bounce temporal disocclusion rejection. */
export const ssgiDepthHistoryCopy = {
  name: 'ssgiDepthHistoryCopy',
  source: /* wgsl */ `\
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn ssgiDepthHistoryCopy_sampleColor(
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

/** Applies depth/normal-aware separable diffuse-irradiance denoising. */
export const ssgiSpatial = {
  name: 'ssgiSpatial',
  source: /* wgsl */ `\
struct SSGISpatialUniforms {
  direction: vec2f,
  radius: f32,
  depthSigma: f32,
};

@group(0) @binding(auto) var<uniform> ssgiSpatial: SSGISpatialUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn ssgiSpatial_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let centerRadiance = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (centerDepth >= 0.99999) {
    return vec4f(0.0);
  }

  let centerNormal = normalize(
    textureSampleLevel(normalTexture, normalTextureSampler, texCoord, 0).rgb * 2.0 - 1.0
  );
  let texel = ssgiSpatial.direction / vec2f(textureDimensions(sourceTexture));
  var radiance = centerRadiance;
  var accumulatedWeight = 1.0;
  for (var sampleIndex: i32 = 1; sampleIndex <= 5; sampleIndex++) {
    if (f32(sampleIndex) > ssgiSpatial.radius) {
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
          max(2.0 * ssgiSpatial.depthSigma * ssgiSpatial.depthSigma, 0.000001)
      );
      let normalWeight = pow(max(dot(centerNormal, sampleNormal), 0.0), 12.0);
      let distanceWeight = exp(
        -f32(sampleIndex * sampleIndex) /
          max(2.0 * ssgiSpatial.radius * ssgiSpatial.radius, 0.1)
      );
      let weight = depthWeight * normalWeight * distanceWeight;
      radiance += textureSampleLevel(sourceTexture, sourceTextureSampler, sampleCoord, 0) * weight;
      accumulatedWeight += weight;
    }
  }

  return radiance / max(accumulatedWeight, 0.0001);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  props: {} as Partial<SSGISpatialUniforms> & SSGISpatialBindings,
  uniforms: {} as SSGISpatialUniforms,
  bindings: {} as SSGISpatialBindings,
  uniformTypes: {
    direction: 'vec2<f32>',
    radius: 'f32',
    depthSigma: 'f32'
  },
  propTypes: {
    direction: {value: [1, 0]},
    radius: {value: 3, min: 0, max: 5},
    depthSigma: {value: 0.012, min: 0.0001, softMax: 0.1}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<SSGISpatialUniforms> & SSGISpatialBindings,
  SSGISpatialUniforms,
  SSGISpatialBindings
>;

/** Adds diffuse bounced radiance or exposes indirect-lighting/confidence debug views. */
export const ssgiComposite = {
  name: 'ssgiComposite',
  source: /* wgsl */ `\
struct SSGICompositeUniforms {
  strength: f32,
  debugMode: f32,
};

@group(0) @binding(auto) var<uniform> ssgiComposite: SSGICompositeUniforms;
@group(0) @binding(auto) var indirectLightingTexture: texture_2d<f32>;
@group(0) @binding(auto) var indirectLightingTextureSampler: sampler;

fn ssgiComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let color = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let indirect = textureSampleLevel(
    indirectLightingTexture,
    indirectLightingTextureSampler,
    texCoord,
    0
  );
  if (ssgiComposite.debugMode > 1.5) {
    let confidence = clamp(indirect.a, 0.0, 1.0);
    return vec4f(
      mix(vec3f(0.025, 0.05, 0.18), vec3f(1.0, 0.72, 0.18), confidence),
      1.0
    );
  }
  if (ssgiComposite.debugMode > 0.5) {
    return vec4f(indirect.rgb * 2.2, 1.0);
  }
  return vec4f(color.rgb + indirect.rgb * ssgiComposite.strength, color.a);
}`,
  bindingLayout: [{name: 'indirectLightingTexture', group: 0}],
  props: {} as Partial<SSGICompositeUniforms>,
  uniforms: {} as SSGICompositeUniforms,
  uniformTypes: {strength: 'f32', debugMode: 'f32'},
  propTypes: {
    strength: {value: 1, min: 0, softMax: 3},
    debugMode: {value: 0, min: 0, max: 2, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<Partial<SSGICompositeUniforms>, SSGICompositeUniforms>;

/** Creates a hemisphere-traced, temporally stabilized screen-space diffuse GI pipeline. */
export function createSSGIShaderPassPipeline(
  options: SSGIShaderPassPipelineOptions = {}
): ShaderPassPipeline<
  'ssgiRaw' | 'ssgiHistory' | 'ssgiHistoryDepth' | 'ssgiScratch' | 'ssgiIndirect'
> {
  const scale = options.resolutionScale || 0.5;
  return {
    name: 'ssgiShaderPassPipeline',
    renderTargets: {
      ssgiRaw: {scale: [scale, scale], format: 'rgba16float'},
      ssgiHistory: {
        scale: [scale, scale],
        format: 'rgba16float',
        lifetime: 'history',
        initialize: {clearColor: [0, 0, 0, 0]}
      },
      ssgiHistoryDepth: {
        scale: [scale, scale],
        format: 'rgba16float',
        lifetime: 'history',
        initialize: {clearColor: [1, 0, 0, 1]}
      },
      ssgiScratch: {scale: [scale, scale], format: 'rgba16float'},
      ssgiIndirect: {scale: [scale, scale], format: 'rgba16float'}
    },
    steps: [
      {
        shaderPass: ssgiTrace,
        inputs: {sourceTexture: 'previous'},
        output: 'ssgiRaw'
      },
      {
        shaderPass: ssgiTemporal,
        inputs: {
          sourceTexture: 'ssgiRaw',
          historyTexture: 'ssgiHistory',
          previousDepthTexture: 'ssgiHistoryDepth'
        },
        output: 'ssgiHistory'
      },
      {
        shaderPass: ssgiDepthHistoryCopy,
        inputs: {sourceTexture: 'previous'},
        output: 'ssgiHistoryDepth'
      },
      {
        shaderPass: ssgiSpatial,
        inputs: {sourceTexture: 'ssgiHistory'},
        output: 'ssgiScratch',
        uniforms: {direction: [1, 0]}
      },
      {
        shaderPass: ssgiSpatial,
        inputs: {sourceTexture: 'ssgiScratch'},
        output: 'ssgiIndirect',
        uniforms: {direction: [0, 1]}
      },
      {
        shaderPass: ssgiComposite,
        inputs: {sourceTexture: 'previous', indirectLightingTexture: 'ssgiIndirect'},
        output: 'previous'
      }
    ]
  };
}
