// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  type ConfigurableEffectDefinition,
  type EffectDefinition
} from '../../../passes/effect-renderer';

import type {Texture} from '@luma.gl/core';
import type {ShaderPass} from '@luma.gl/shaders';
import {depthAwareBlur} from './depth-aware-blur';
import {depthHelpers} from './screen-space-shader-helpers';

export type SSAOCompositeShaderPassOptions = {
  normalSource?: 'reconstruct-from-depth' | 'normal-texture';
  /** Fractional intermediate framebuffer resolution. Defaults to full resolution. */
  resolutionScale?: number;
};

type SSAOUniforms = {
  nearPlane: number;
  farPlane: number;
  radius: number;
  bias: number;
  intensity: number;
  useNormalTexture: number;
};

type SSAOBindings = {depthTexture?: Texture; normalTexture?: Texture};

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
  let viewNormal = textureSample(normalTexture, normalTextureSampler, sceneCoord).xyz * 2.0 - 1.0;
  // G-buffer normals use +Y up, while WebGPU texture sample offsets use +Y down.
  let textureNormal = normalize(viewNormal * vec3f(1.0, -1.0, 1.0));
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

export const ssaoEvaluate = {
  name: 'ssaoEvaluate',
  source: ssaoEvaluateSource,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  props: {} as Partial<SSAOUniforms> & SSAOBindings,
  uniforms: {} as SSAOUniforms,
  bindings: {} as SSAOBindings,
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
    radius: {value: 7, min: 1, softMax: 32},
    bias: {value: 0.03, min: 0, softMax: 0.2},
    intensity: {value: 1.35, min: 0, softMax: 4},
    useNormalTexture: {value: 0, min: 0, max: 1, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

export const ssaoComposite = {
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
  let rawOcclusion = clamp(1.0 - ambient, 0.0, 1.0);
  let contactOcclusion = smoothstep(0.03, 0.5, rawOcclusion);
  return vec4f(color.rgb * (1.0 - contactOcclusion * 0.48), color.a);
}`,
  bindingLayout: [{name: 'ambientOcclusionTexture', group: 0}],
  uniformTypes: {debugMode: 'f32'},
  propTypes: {debugMode: {value: 0, min: 0, max: 1, private: true}},
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

/** SSAO with normals reconstructed from the scene depth input. */
export const ssao = {
  name: 'ssaoCompositeShaderPass',
  resources: {
    ssaoRaw: {scale: [1, 1], format: 'rgba8unorm'},
    ssaoScratch: {scale: [1, 1], format: 'rgba8unorm'},
    ssaoBlurred: {scale: [1, 1], format: 'rgba8unorm'}
  },
  passes: [
    {
      kind: 'fullscreen',
      shaderPass: ssaoEvaluate,
      inputs: {sourceTexture: 'previous', normalTexture: 'previous'},
      output: 'ssaoRaw',
      uniforms: {useNormalTexture: 0}
    },
    {
      kind: 'fullscreen',
      shaderPass: depthAwareBlur,
      inputs: {sourceTexture: 'ssaoRaw'},
      output: 'ssaoScratch',
      uniforms: {direction: [1, 0]}
    },
    {
      kind: 'fullscreen',
      shaderPass: depthAwareBlur,
      inputs: {sourceTexture: 'ssaoScratch'},
      output: 'ssaoBlurred',
      uniforms: {direction: [0, 1]}
    },
    {
      kind: 'fullscreen',
      shaderPass: ssaoComposite,
      inputs: {sourceTexture: 'previous', ambientOcclusionTexture: 'ssaoBlurred'},
      output: 'previous'
    }
  ]
} as const satisfies EffectDefinition<'ssaoRaw' | 'ssaoScratch' | 'ssaoBlurred'>;

const ssaoOptionDefaults: Required<SSAOCompositeShaderPassOptions> = {
  normalSource: 'reconstruct-from-depth',
  resolutionScale: 1
};

/** Screen-space ambient occlusion with configurable normal input and target size. */
export const ssaoEffect = {
  ...ssao,
  optionDefaults: ssaoOptionDefaults,
  scaleResources: {
    option: 'resolutionScale',
    targets: ['ssaoRaw', 'ssaoScratch', 'ssaoBlurred']
  },
  variants: {
    option: 'normalSource',
    values: {
      'normal-texture': {
        passes: [
          {...ssao.passes[0], inputs: {sourceTexture: 'previous'}, uniforms: {useNormalTexture: 1}},
          ssao.passes[1],
          ssao.passes[2],
          ssao.passes[3]
        ]
      }
    }
  }
} as const satisfies ConfigurableEffectDefinition<
  SSAOCompositeShaderPassOptions,
  'ssaoRaw' | 'ssaoScratch' | 'ssaoBlurred'
>;
