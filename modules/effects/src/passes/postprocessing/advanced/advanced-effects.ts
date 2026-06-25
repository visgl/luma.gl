// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';

export type ScreenSpaceNormalSource = 'reconstruct-from-depth' | 'normal-texture';

export type ScreenSpaceEffectOptions = {
  normalSource?: ScreenSpaceNormalSource;
  resolutionScale?: number;
};

type SceneDepthBindings = {depthTexture?: Texture};
type SceneNormalBindings = SceneDepthBindings & {normalTexture?: Texture};
type SceneVelocityBindings = SceneDepthBindings & {velocityTexture?: Texture};

const depthHelpers = /* wgsl */ `\
fn advancedSceneUV(uv: vec2f) -> vec2f {
  return uv;
}

fn advancedLinearDepth(depth: f32, nearPlane: f32, farPlane: f32) -> f32 {
  return (nearPlane * farPlane) / max(farPlane - depth * (farPlane - nearPlane), 0.0001);
}

fn advancedDepthNormal(depthTexture: texture_depth_2d, depthTextureSampler: sampler, uv: vec2f) -> vec3f {
  let dimensions = vec2i(textureDimensions(depthTexture));
  let coordinate = clamp(vec2i(uv * vec2f(dimensions)), vec2i(0), dimensions - vec2i(1));
  let center = textureLoad(depthTexture, coordinate, 0);
  let right = textureLoad(depthTexture, min(coordinate + vec2i(1, 0), dimensions - vec2i(1)), 0);
  let up = textureLoad(depthTexture, min(coordinate + vec2i(0, 1), dimensions - vec2i(1)), 0);
  return normalize(vec3f((center - right) * f32(dimensions.x), (center - up) * f32(dimensions.y), 1.0));
}
`;

export type DepthAwareBlurProps = {
  direction?: [number, number];
  radius?: number;
  depthSigma?: number;
  spatialSigma?: number;
};

type DepthAwareBlurUniforms = Required<DepthAwareBlurProps>;

const depthAwareBlurSource = /* wgsl */ `\
struct depthAwareBlurUniforms {
  direction: vec2f,
  radius: f32,
  depthSigma: f32,
  spatialSigma: f32,
};

@group(0) @binding(auto) var<uniform> depthAwareBlur: depthAwareBlurUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn depthAwareBlur_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceDimensions = vec2f(textureDimensions(sourceTexture));
  let texel = depthAwareBlur.direction / sourceDimensions;
  let centerDepth = textureSample(depthTexture, depthTextureSampler, texCoord);
  var color = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  var totalWeight = 1.0;
  for (var index: i32 = 1; index <= 8; index++) {
    if (f32(index) > depthAwareBlur.radius) { break; }
    let offset = texel * f32(index);
    for (var side: i32 = -1; side <= 1; side += 2) {
      let sampleUv = clamp(texCoord + offset * f32(side), vec2f(0.0), vec2f(1.0));
      let sampleDepth = textureSample(depthTexture, depthTextureSampler, sampleUv);
      let spatialWeight = exp(-f32(index * index) / max(2.0 * depthAwareBlur.spatialSigma * depthAwareBlur.spatialSigma, 0.0001));
      let depthDelta = abs(sampleDepth - centerDepth);
      let depthWeight = exp(-(depthDelta * depthDelta) / max(2.0 * depthAwareBlur.depthSigma * depthAwareBlur.depthSigma, 0.000001));
      let weight = spatialWeight * depthWeight;
      color += textureSample(sourceTexture, sourceTextureSampler, sampleUv) * weight;
      totalWeight += weight;
    }
  }
  return color / totalWeight;
}
`;

export const depthAwareBlur = {
  name: 'depthAwareBlur',
  source: depthAwareBlurSource,
  bindingLayout: [{name: 'depthTexture', group: 0}],
  props: {} as DepthAwareBlurProps & SceneDepthBindings,
  uniforms: {} as DepthAwareBlurUniforms,
  bindings: {} as SceneDepthBindings,
  uniformTypes: {
    direction: 'vec2<f32>',
    radius: 'f32',
    depthSigma: 'f32',
    spatialSigma: 'f32'
  },
  propTypes: {
    direction: {value: [1, 0]},
    radius: {value: 4, min: 1, max: 8},
    depthSigma: {value: 0.01, min: 0.0001, softMax: 0.1},
    spatialSigma: {value: 3, min: 0.1, softMax: 8}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  DepthAwareBlurProps & SceneDepthBindings,
  DepthAwareBlurUniforms,
  SceneDepthBindings
>;

export const depthAwareBlurShaderPassPipeline = {
  name: 'depthAwareBlurShaderPassPipeline',
  renderTargets: {depthAwareBlurScratch: {}},
  steps: [
    {
      shaderPass: depthAwareBlur,
      inputs: {sourceTexture: 'previous'},
      output: 'depthAwareBlurScratch',
      uniforms: {direction: [1, 0]}
    },
    {
      shaderPass: depthAwareBlur,
      inputs: {sourceTexture: 'depthAwareBlurScratch'},
      output: 'previous',
      uniforms: {direction: [0, 1]}
    }
  ]
} satisfies ShaderPassPipeline<'depthAwareBlurScratch'>;

type SSAOUniforms = {
  nearPlane: number;
  farPlane: number;
  radius: number;
  bias: number;
  intensity: number;
  useNormalTexture: number;
};

const ssaoEvaluateSource = /* wgsl */ `\
${depthHelpers}
struct ssaoEvaluateUniforms {
  nearPlane: f32,
  farPlane: f32,
  radius: f32,
  bias: f32,
  intensity: f32,
  useNormalTexture: f32,
};
@group(0) @binding(auto) var<uniform> ssaoEvaluate: ssaoEvaluateUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn ssaoEvaluate_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let sceneCoord = advancedSceneUV(texCoord);
  let depth = textureSample(depthTexture, depthTextureSampler, sceneCoord);
  let dimensions = vec2f(textureDimensions(depthTexture));
  let linearDepth = advancedLinearDepth(depth, ssaoEvaluate.nearPlane, ssaoEvaluate.farPlane);
  let reconstructedNormal = advancedDepthNormal(depthTexture, depthTextureSampler, sceneCoord);
  let textureNormal = normalize(textureSample(normalTexture, normalTextureSampler, sceneCoord).xyz * 2.0 - 1.0);
  let normal = normalize(mix(reconstructedNormal, textureNormal, ssaoEvaluate.useNormalTexture));
  let angle = fract(sin(dot(texCoord * dimensions, vec2f(12.9898, 78.233))) * 43758.5453) * 6.2831853;
  var occlusion = 0.0;
  for (var index: i32 = 0; index < 12; index++) {
    let sampleAngle = angle + f32(index) * 2.399963;
    let sampleRadius = (0.25 + 0.75 * f32(index + 1) / 12.0) * ssaoEvaluate.radius;
    let direction = vec2f(cos(sampleAngle), sin(sampleAngle));
    let sampleUv = clamp(texCoord + direction * sampleRadius / dimensions, vec2f(0.0), vec2f(1.0));
    let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, advancedSceneUV(sampleUv), 0);
    let sampleLinearDepth = advancedLinearDepth(sampleDepth, ssaoEvaluate.nearPlane, ssaoEvaluate.farPlane);
    let rangeWeight = smoothstep(ssaoEvaluate.radius * 2.0, 0.0, abs(sampleLinearDepth - linearDepth));
    let horizonWeight = max(dot(normal, normalize(vec3f(direction, 0.35))), 0.15);
    occlusion += select(0.0, rangeWeight * horizonWeight, sampleLinearDepth + ssaoEvaluate.bias < linearDepth);
  }
  let ambient = select(clamp(1.0 - occlusion / 12.0 * ssaoEvaluate.intensity, 0.0, 1.0), 1.0, depth >= 0.99999);
  return vec4f(vec3f(ambient), 1.0);
}
`;

const ssaoEvaluate = {
  name: 'ssaoEvaluate',
  source: ssaoEvaluateSource,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  props: {} as Partial<SSAOUniforms> & SceneNormalBindings,
  uniforms: {} as SSAOUniforms,
  bindings: {} as SceneNormalBindings,
  uniformTypes: {
    nearPlane: 'f32',
    farPlane: 'f32',
    radius: 'f32',
    bias: 'f32',
    intensity: 'f32',
    useNormalTexture: 'f32'
  },
  propTypes: {
    nearPlane: {value: 0.1},
    farPlane: {value: 200},
    radius: {value: 8, min: 1, softMax: 32},
    bias: {value: 0.02, min: 0, softMax: 0.2},
    intensity: {value: 1.6, min: 0, softMax: 4},
    useNormalTexture: {value: 0, min: 0, max: 1, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

const ssaoComposite = {
  name: 'ssaoComposite',
  source: /* wgsl */ `\
struct ssaoCompositeUniforms {
  debugMode: f32,
};
@group(0) @binding(auto) var<uniform> ssaoComposite: ssaoCompositeUniforms;
@group(0) @binding(auto) var ambientOcclusionTexture: texture_2d<f32>;
@group(0) @binding(auto) var ambientOcclusionTextureSampler: sampler;
fn ssaoComposite_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let color = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let ambient = textureSample(ambientOcclusionTexture, ambientOcclusionTextureSampler, texCoord).r;
  if (ssaoComposite.debugMode > 0.5) { return vec4f(vec3f(ambient), 1.0); }
  return vec4f(color.rgb * mix(0.35, 1.0, ambient), color.a);
}`,
  bindingLayout: [{name: 'ambientOcclusionTexture', group: 0}],
  uniformTypes: {debugMode: 'f32'},
  propTypes: {debugMode: {value: 0, min: 0, max: 1, private: true}},
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

export function createSSAOShaderPassPipeline(
  options: ScreenSpaceEffectOptions = {}
): ShaderPassPipeline<'ssaoRaw' | 'ssaoScratch' | 'ssaoBlurred'> {
  const scale = options.resolutionScale || 0.5;
  const useNormalTexture = options.normalSource === 'normal-texture' ? 1 : 0;
  const evaluateInputs: Record<string, 'previous'> = {sourceTexture: 'previous'};
  if (!useNormalTexture) {
    evaluateInputs['normalTexture'] = 'previous';
  }
  return {
    name: 'ssaoShaderPassPipeline',
    renderTargets: {
      ssaoRaw: {scale: [scale, scale], format: 'rgba8unorm'},
      ssaoScratch: {scale: [scale, scale], format: 'rgba8unorm'},
      ssaoBlurred: {scale: [scale, scale], format: 'rgba8unorm'}
    },
    steps: [
      {
        shaderPass: ssaoEvaluate,
        inputs: evaluateInputs,
        output: 'ssaoRaw',
        uniforms: {useNormalTexture}
      },
      {
        shaderPass: depthAwareBlur,
        inputs: {sourceTexture: 'ssaoRaw'},
        output: 'ssaoScratch',
        uniforms: {direction: [1, 0]}
      },
      {
        shaderPass: depthAwareBlur,
        inputs: {sourceTexture: 'ssaoScratch'},
        output: 'ssaoBlurred',
        uniforms: {direction: [0, 1]}
      },
      {
        shaderPass: ssaoComposite,
        inputs: {sourceTexture: 'previous', ambientOcclusionTexture: 'ssaoBlurred'},
        output: 'previous'
      }
    ]
  };
}

type OutlineUniforms = {
  color: [number, number, number, number];
  thickness: number;
  depthThreshold: number;
  normalThreshold: number;
  useNormalTexture: number;
};

const outlinePass = {
  name: 'screenSpaceOutline',
  source: /* wgsl */ `\
struct screenSpaceOutlineUniforms {
  color: vec4f,
  thickness: f32,
  depthThreshold: f32,
  normalThreshold: f32,
  useNormalTexture: f32,
};
@group(0) @binding(auto) var<uniform> screenSpaceOutline: screenSpaceOutlineUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
${depthHelpers}
fn screenSpaceOutline_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let texel = screenSpaceOutline.thickness / vec2f(textureDimensions(depthTexture));
  let centerSceneUv = advancedSceneUV(texCoord);
  let centerDepth = textureSample(depthTexture, depthTextureSampler, centerSceneUv);
  let centerReconstructed = advancedDepthNormal(depthTexture, depthTextureSampler, centerSceneUv);
  let centerTextureNormal = normalize(textureSample(normalTexture, normalTextureSampler, centerSceneUv).xyz * 2.0 - 1.0);
  let centerNormal = normalize(mix(centerReconstructed, centerTextureNormal, screenSpaceOutline.useNormalTexture));
  var depthEdge = 0.0;
  var normalEdge = 0.0;
  let offsets = array<vec2f, 4>(vec2f(texel.x, 0.0), vec2f(-texel.x, 0.0), vec2f(0.0, texel.y), vec2f(0.0, -texel.y));
  for (var index: i32 = 0; index < 4; index++) {
    let sampleUv = clamp(texCoord + offsets[index], vec2f(0.0), vec2f(1.0));
    let sampleSceneUv = advancedSceneUV(sampleUv);
    let sampleDepth = textureSample(depthTexture, depthTextureSampler, sampleSceneUv);
    depthEdge = max(depthEdge, abs(sampleDepth - centerDepth));
    let reconstructed = advancedDepthNormal(depthTexture, depthTextureSampler, sampleSceneUv);
    let textureNormal = normalize(textureSample(normalTexture, normalTextureSampler, sampleSceneUv).xyz * 2.0 - 1.0);
    let sampleNormal = normalize(mix(reconstructed, textureNormal, screenSpaceOutline.useNormalTexture));
    normalEdge = max(normalEdge, 1.0 - max(dot(centerNormal, sampleNormal), 0.0));
  }
  let edge = max(smoothstep(screenSpaceOutline.depthThreshold, screenSpaceOutline.depthThreshold * 2.0, depthEdge),
                 smoothstep(screenSpaceOutline.normalThreshold, screenSpaceOutline.normalThreshold * 2.0, normalEdge));
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  return mix(sourceColor, screenSpaceOutline.color, edge * screenSpaceOutline.color.a);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  uniforms: {} as OutlineUniforms,
  uniformTypes: {
    color: 'vec4<f32>',
    thickness: 'f32',
    depthThreshold: 'f32',
    normalThreshold: 'f32',
    useNormalTexture: 'f32'
  },
  propTypes: {
    color: {value: [0.02, 0.08, 0.12, 0.48]},
    thickness: {value: 1.5, min: 0.5, softMax: 5},
    depthThreshold: {value: 0.003, min: 0.0001, softMax: 0.05},
    normalThreshold: {value: 0.18, min: 0.01, softMax: 1},
    useNormalTexture: {value: 0, min: 0, max: 1, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

export function createOutlineShaderPassPipeline(
  options: ScreenSpaceEffectOptions = {}
): ShaderPassPipeline {
  const useNormalTexture = options.normalSource === 'normal-texture' ? 1 : 0;
  const inputs: Record<string, 'previous'> = {sourceTexture: 'previous'};
  if (!useNormalTexture) {
    inputs['normalTexture'] = 'previous';
  }
  return {
    name: 'outlineShaderPassPipeline',
    steps: [{shaderPass: outlinePass, inputs, output: 'previous', uniforms: {useNormalTexture}}]
  };
}

const copyPass = {
  name: 'advancedCopy',
  source: /* wgsl */ `\
fn advancedCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f { return textureSample(sourceTexture, sourceTextureSampler, texCoord); }`,
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

type TAAUniforms = {
  historyWeight: number;
  depthThreshold: number;
  currentJitter: [number, number];
  previousJitter: [number, number];
};

const taaResolve = {
  name: 'taaResolve',
  source: /* wgsl */ `\
struct taaResolveUniforms {
  historyWeight: f32,
  depthThreshold: f32,
  currentJitter: vec2f,
  previousJitter: vec2f,
};
@group(0) @binding(auto) var<uniform> taaResolve: taaResolveUniforms;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTextureSampler: sampler;
@group(0) @binding(auto) var velocityTexture: texture_2d<f32>;
@group(0) @binding(auto) var velocityTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var previousDepthTexture: texture_2d<f32>;
@group(0) @binding(auto) var previousDepthTextureSampler: sampler;
fn taaResolve_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let dimensions = vec2f(textureDimensions(sourceTexture));
  let texel = 1.0 / dimensions;
  let sceneCoord = texCoord;
  let velocity = textureSample(velocityTexture, velocityTextureSampler, sceneCoord).xy;
  let previousUv = texCoord - velocity + taaResolve.previousJitter - taaResolve.currentJitter;
  let currentDepth = textureSample(depthTexture, depthTextureSampler, sceneCoord);
  let previousDepth = textureSample(previousDepthTexture, previousDepthTextureSampler, clamp(previousUv, vec2f(0.0), vec2f(1.0))).r;
  let current = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  var minimumColor = current.rgb;
  var maximumColor = current.rgb;
  for (var y: i32 = -1; y <= 1; y++) {
    for (var x: i32 = -1; x <= 1; x++) {
      let sampleColor = textureSample(sourceTexture, sourceTextureSampler, texCoord + vec2f(f32(x), f32(y)) * texel).rgb;
      minimumColor = min(minimumColor, sampleColor);
      maximumColor = max(maximumColor, sampleColor);
    }
  }
  let history = clamp(textureSample(historyTexture, historyTextureSampler, clamp(previousUv, vec2f(0.0), vec2f(1.0))).rgb, minimumColor, maximumColor);
  let validUv = all(previousUv >= vec2f(0.0)) && all(previousUv <= vec2f(1.0));
  let validDepth = abs(previousDepth - currentDepth) < taaResolve.depthThreshold;
  let weight = select(0.0, taaResolve.historyWeight, validUv && validDepth);
  return vec4f(mix(current.rgb, history, weight), current.a);
}`,
  bindingLayout: [
    {name: 'historyTexture', group: 0},
    {name: 'velocityTexture', group: 0},
    {name: 'depthTexture', group: 0},
    {name: 'previousDepthTexture', group: 0}
  ],
  uniforms: {} as TAAUniforms,
  uniformTypes: {
    historyWeight: 'f32',
    depthThreshold: 'f32',
    currentJitter: 'vec2<f32>',
    previousJitter: 'vec2<f32>'
  },
  propTypes: {
    historyWeight: {value: 0.9, min: 0, max: 0.98},
    depthThreshold: {value: 0.01, min: 0.0001, softMax: 0.1},
    currentJitter: {value: [0, 0], private: true},
    previousJitter: {value: [0, 0], private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

const depthHistoryCopy = {
  name: 'depthHistoryCopy',
  source: /* wgsl */ `\
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
fn depthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f { let depth = textureSample(depthTexture, depthTextureSampler, texCoord); return vec4f(depth, 0.0, 0.0, 1.0); }`,
  bindingLayout: [{name: 'depthTexture', group: 0}],
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

export function createTAAShaderPassPipeline(): ShaderPassPipeline<
  'taaHistoryColor' | 'taaHistoryDepth'
> {
  return {
    name: 'taaShaderPassPipeline',
    renderTargets: {
      taaHistoryColor: {lifetime: 'history', initialize: 'original'},
      taaHistoryDepth: {
        format: 'rgba16float',
        lifetime: 'history',
        initialize: {clearColor: [1, 0, 0, 1]}
      }
    },
    steps: [
      {
        shaderPass: taaResolve,
        inputs: {
          sourceTexture: 'previous',
          historyTexture: 'taaHistoryColor',
          previousDepthTexture: 'taaHistoryDepth'
        },
        output: 'taaHistoryColor'
      },
      {shaderPass: copyPass, inputs: {sourceTexture: 'taaHistoryColor'}, output: 'previous'},
      {shaderPass: depthHistoryCopy, inputs: {sourceTexture: 'previous'}, output: 'taaHistoryDepth'}
    ]
  };
}

type MotionBlurUniforms = {strength: number; sampleCount: number};
const motionBlurPass = {
  name: 'motionBlur',
  source: /* wgsl */ `\
struct motionBlurUniforms {
  strength: f32,
  sampleCount: f32,
};
@group(0) @binding(auto) var<uniform> motionBlur: motionBlurUniforms;
@group(0) @binding(auto) var velocityTexture: texture_2d<f32>;
@group(0) @binding(auto) var velocityTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
fn motionBlur_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let sceneCoord = texCoord;
  let velocity = textureSample(velocityTexture, velocityTextureSampler, sceneCoord).xy * motionBlur.strength;
  let centerDepth = textureSample(depthTexture, depthTextureSampler, sceneCoord);
  var color = vec4f(0.0);
  var totalWeight = 0.0;
  for (var index: i32 = 0; index < 16; index++) {
    if (f32(index) >= motionBlur.sampleCount) { break; }
    let amount = (f32(index) / max(motionBlur.sampleCount - 1.0, 1.0)) - 0.5;
    let sampleUv = clamp(texCoord - velocity * amount, vec2f(0.0), vec2f(1.0));
    let sampleDepth = textureSample(depthTexture, depthTextureSampler, sampleUv);
    let weight = exp(-abs(sampleDepth - centerDepth) * 240.0);
    color += textureSample(sourceTexture, sourceTextureSampler, sampleUv) * weight;
    totalWeight += weight;
  }
  return color / max(totalWeight, 0.0001);
}`,
  bindingLayout: [
    {name: 'velocityTexture', group: 0},
    {name: 'depthTexture', group: 0}
  ],
  props: {} as Partial<MotionBlurUniforms> & SceneVelocityBindings,
  uniforms: {} as MotionBlurUniforms,
  uniformTypes: {strength: 'f32', sampleCount: 'f32'},
  propTypes: {strength: {value: 1, min: 0, softMax: 4}, sampleCount: {value: 10, min: 2, max: 16}},
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

export function createMotionBlurShaderPassPipeline(): ShaderPassPipeline {
  return {
    name: 'motionBlurShaderPassPipeline',
    steps: [{shaderPass: motionBlurPass, output: 'previous'}]
  };
}

type SSRUniforms = {intensity: number; maxDistance: number; thickness: number};
const ssrTrace = {
  name: 'ssrTrace',
  source: /* wgsl */ `\
struct ssrTraceUniforms {
  intensity: f32,
  maxDistance: f32,
  thickness: f32,
};
@group(0) @binding(auto) var<uniform> ssrTrace: ssrTraceUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
fn ssrTrace_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let sceneCoord = texCoord;
  let normalRoughness = textureSampleLevel(normalTexture, normalTextureSampler, sceneCoord, 0.0);
  let normal = normalize(normalRoughness.xyz * 2.0 - 1.0);
  let roughness = normalRoughness.a;
  let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, sceneCoord, 0);
  let viewRay = normalize(vec3f(texCoord * 2.0 - 1.0, 1.0));
  let reflectedRay = reflect(viewRay, normal);
  let direction = normalize(vec2f(reflectedRay.x, -reflectedRay.y));
  var reflection = vec3f(0.0);
  var confidence = 0.0;
  for (var index: i32 = 1; index <= 32; index++) {
    let travel = f32(index) / 32.0 * ssrTrace.maxDistance;
    let sampleUv = texCoord + direction * travel;
    if (any(sampleUv <= vec2f(0.0)) || any(sampleUv >= vec2f(1.0))) { break; }
    let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleUv, 0);
    let expectedDepth = centerDepth + travel * reflectedRay.z * 0.08;
    if (abs(sampleDepth - expectedDepth) < ssrTrace.thickness) {
      reflection = textureSampleLevel(sourceTexture, sourceTextureSampler, sampleUv, 0.0).rgb;
      let edge = min(min(sampleUv.x, sampleUv.y), min(1.0 - sampleUv.x, 1.0 - sampleUv.y));
      confidence = smoothstep(0.0, 0.12, edge) * (1.0 - roughness) * ssrTrace.intensity;
      break;
    }
  }
  return vec4f(reflection, clamp(confidence, 0.0, 1.0));
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  uniforms: {} as SSRUniforms,
  uniformTypes: {intensity: 'f32', maxDistance: 'f32', thickness: 'f32'},
  propTypes: {
    intensity: {value: 0.8, min: 0, softMax: 2},
    maxDistance: {value: 0.35, min: 0.02, max: 1},
    thickness: {value: 0.018, min: 0.001, softMax: 0.1}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

const ssrComposite = {
  name: 'ssrComposite',
  source: /* wgsl */ `\
struct ssrCompositeUniforms {
  debugMode: f32,
};
@group(0) @binding(auto) var<uniform> ssrComposite: ssrCompositeUniforms;
@group(0) @binding(auto) var reflectionTexture: texture_2d<f32>;
@group(0) @binding(auto) var reflectionTextureSampler: sampler;
fn ssrComposite_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let color = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let reflection = textureSample(reflectionTexture, reflectionTextureSampler, texCoord);
  if (ssrComposite.debugMode > 0.5) { return vec4f(reflection.rgb, 1.0); }
  return vec4f(mix(color.rgb, color.rgb + reflection.rgb, reflection.a), color.a);
}`,
  bindingLayout: [{name: 'reflectionTexture', group: 0}],
  uniformTypes: {debugMode: 'f32'},
  propTypes: {debugMode: {value: 0, min: 0, max: 1, private: true}},
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

export function createSSRShaderPassPipeline(
  options: {resolutionScale?: number} = {}
): ShaderPassPipeline<'ssrReflection'> {
  const scale = options.resolutionScale || 0.5;
  return {
    name: 'ssrShaderPassPipeline',
    renderTargets: {ssrReflection: {scale: [scale, scale], format: 'rgba16float'}},
    steps: [
      {shaderPass: ssrTrace, inputs: {sourceTexture: 'previous'}, output: 'ssrReflection'},
      {
        shaderPass: ssrComposite,
        inputs: {sourceTexture: 'previous', reflectionTexture: 'ssrReflection'},
        output: 'previous'
      }
    ]
  };
}

type FogUniforms = {
  fogColor: [number, number, number, number];
  density: number;
  heightFalloff: number;
  scattering: number;
  historyWeight: number;
  time: number;
};
const volumetricFogPass = {
  name: 'volumetricFog',
  source: /* wgsl */ `\
struct volumetricFogUniforms {
  fogColor: vec4f,
  density: f32,
  heightFalloff: f32,
  scattering: f32,
  historyWeight: f32,
  time: f32,
};
@group(0) @binding(auto) var<uniform> volumetricFog: volumetricFogUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTextureSampler: sampler;
fn volumetricFog_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let depth = textureSample(depthTexture, depthTextureSampler, texCoord);
  let noise = fract(sin(dot(texCoord * vec2f(textureDimensions(depthTexture)) + volumetricFog.time, vec2f(12.9898, 78.233))) * 43758.5453);
  var opticalDepth = 0.0;
  for (var index: i32 = 0; index < 20; index++) {
    let distance = (f32(index) + noise) / 20.0 * depth;
    let heightDensity = exp(-max((texCoord.y - 0.42) + distance * 0.18, 0.0) * volumetricFog.heightFalloff);
    opticalDepth += heightDensity * volumetricFog.density * depth / 20.0;
  }
  let fogAmount = clamp(1.0 - exp(-opticalDepth * 8.0), 0.0, 0.96);
  let sun = pow(max(1.0 - distance(texCoord, vec2f(0.72, 0.24)) * 1.7, 0.0), 8.0) * volumetricFog.scattering;
  let fogged = vec4f(mix(sourceColor.rgb, volumetricFog.fogColor.rgb + sun * volumetricFog.fogColor.a, fogAmount), sourceColor.a);
  let history = textureSample(historyTexture, historyTextureSampler, texCoord);
  return mix(fogged, history, volumetricFog.historyWeight);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'historyTexture', group: 0}
  ],
  uniforms: {} as FogUniforms,
  uniformTypes: {
    fogColor: 'vec4<f32>',
    density: 'f32',
    heightFalloff: 'f32',
    scattering: 'f32',
    historyWeight: 'f32',
    time: 'f32'
  },
  propTypes: {
    fogColor: {value: [0.18, 0.34, 0.48, 0.6]},
    density: {value: 0.22, min: 0, softMax: 1},
    heightFalloff: {value: 3, min: 0, softMax: 10},
    scattering: {value: 0.35, min: 0, softMax: 2},
    historyWeight: {value: 0.82, min: 0, max: 0.98},
    time: {value: 0, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

export function createVolumetricFogShaderPassPipeline(): ShaderPassPipeline<'fogHistory'> {
  return {
    name: 'volumetricFogShaderPassPipeline',
    renderTargets: {fogHistory: {lifetime: 'history', initialize: 'original'}},
    steps: [
      {
        shaderPass: volumetricFogPass,
        inputs: {sourceTexture: 'previous', historyTexture: 'fogHistory'},
        output: 'fogHistory'
      },
      {shaderPass: copyPass, inputs: {sourceTexture: 'fogHistory'}, output: 'previous'}
    ]
  };
}
