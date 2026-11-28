// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type ConfigurableEffectDefinition} from '../../../passes/effect-renderer';
import type {ShaderPass} from '@luma.gl/shaders';
import {depthHelpers} from './screen-space-shader-helpers';

export type OutlineCompositeShaderPassOptions = {
  mode?: 'depth-normal' | 'image';
  normalSource?: 'reconstruct-from-depth' | 'normal-texture';
  quality?: 'fast' | 'high';
};

type OutlineUniforms = {
  color: [number, number, number, number];
  thickness: number;
  depthThreshold: number;
  normalThreshold: number;
  useNormalTexture: number;
  useDiagonalSamples: number;
};

export const outlinePass = {
  name: 'screenSpaceOutline',
  source: /* wgsl */ `\
struct screenSpaceOutlineUniforms {
  color: vec4f,
  thickness: f32,
  depthThreshold: f32,
  normalThreshold: f32,
  useNormalTexture: f32,
  useDiagonalSamples: f32,
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
  let offsets = array<vec2f, 8>(vec2f(texel.x, 0.0), vec2f(-texel.x, 0.0), vec2f(0.0, texel.y), vec2f(0.0, -texel.y), vec2f(texel.x, texel.y), vec2f(-texel.x, texel.y), vec2f(texel.x, -texel.y), vec2f(-texel.x, -texel.y));
  for (var index: i32 = 0; index < 8; index++) {
    if (index >= 4 && screenSpaceOutline.useDiagonalSamples < 0.5) { continue; }
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
  fs: /* glsl */ `\
layout(std140) uniform screenSpaceOutlineUniforms {
  vec4 color;
  float thickness;
  float depthThreshold;
  float normalThreshold;
  float useNormalTexture;
  float useDiagonalSamples;
} screenSpaceOutline;
uniform sampler2D depthTexture;
uniform sampler2D normalTexture;
vec3 screenSpaceOutline_depthNormal(vec2 uv, vec2 texSize) {
  float center = texture(depthTexture, uv).r;
  float right = texture(depthTexture, clamp(uv + vec2(1.0 / texSize.x, 0.0), 0.0, 1.0)).r;
  float up = texture(depthTexture, clamp(uv + vec2(0.0, 1.0 / texSize.y), 0.0, 1.0)).r;
  return normalize(vec3((center - right) * texSize.x, (center - up) * texSize.y, 1.0));
}
vec4 screenSpaceOutline_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec2 texel = screenSpaceOutline.thickness / texSize;
  vec4 sourceColor = texture(sourceTexture, texCoord);
  float centerDepth = texture(depthTexture, texCoord).r;
  vec3 centerNormal = normalize(mix(screenSpaceOutline_depthNormal(texCoord, texSize), texture(normalTexture, texCoord).xyz * 2.0 - 1.0, screenSpaceOutline.useNormalTexture));
  float depthEdge = 0.0;
  float normalEdge = 0.0;
  for (int index = 0; index < 8; index++) {
    if (index >= 4 && screenSpaceOutline.useDiagonalSamples < 0.5) continue;
    vec2 offset = index == 0 ? vec2(texel.x, 0.0) : index == 1 ? vec2(-texel.x, 0.0) : index == 2 ? vec2(0.0, texel.y) : index == 3 ? vec2(0.0, -texel.y) : index == 4 ? texel : index == 5 ? vec2(-texel.x, texel.y) : index == 6 ? vec2(texel.x, -texel.y) : -texel;
    vec2 sampleUv = clamp(texCoord + offset, 0.0, 1.0);
    float sampleDepth = texture(depthTexture, sampleUv).r;
    depthEdge = max(depthEdge, abs(sampleDepth - centerDepth));
    vec3 sampleNormal = normalize(mix(screenSpaceOutline_depthNormal(sampleUv, texSize), texture(normalTexture, sampleUv).xyz * 2.0 - 1.0, screenSpaceOutline.useNormalTexture));
    normalEdge = max(normalEdge, 1.0 - max(dot(centerNormal, sampleNormal), 0.0));
  }
  float edge = max(smoothstep(screenSpaceOutline.depthThreshold, screenSpaceOutline.depthThreshold * 2.0, depthEdge), smoothstep(screenSpaceOutline.normalThreshold, screenSpaceOutline.normalThreshold * 2.0, normalEdge));
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
    useNormalTexture: 'f32',
    useDiagonalSamples: 'f32'
  },
  propTypes: {
    color: {value: [0.02, 0.08, 0.12, 0.48]},
    thickness: {value: 1.5, min: 0.5, softMax: 5},
    depthThreshold: {value: 0.003, min: 0.0001, softMax: 0.05},
    normalThreshold: {value: 0.18, min: 0.01, softMax: 1},
    useNormalTexture: {value: 0, min: 0, max: 1, private: true},
    useDiagonalSamples: {value: 1, min: 0, max: 1, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

const imageOutlinePass = {
  name: 'imageOutline',
  source: /* wgsl */ `\
struct imageOutlineUniforms {
  color: vec4f,
  thickness: f32,
  useDiagonalSamples: f32,
};
@group(0) @binding(auto) var<uniform> imageOutline: imageOutlineUniforms;
fn imageOutline_sampleColor(sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f) -> vec4f {
  let texel = imageOutline.thickness / texSize;
  let center = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  var edge = 0.0;
  let offsets = array<vec2f, 8>(vec2f(texel.x, 0.0), vec2f(-texel.x, 0.0), vec2f(0.0, texel.y), vec2f(0.0, -texel.y), vec2f(texel.x, texel.y), vec2f(-texel.x, texel.y), vec2f(texel.x, -texel.y), vec2f(-texel.x, -texel.y));
  for (var index: i32 = 0; index < 8; index++) { if (index >= 4 && imageOutline.useDiagonalSamples < 0.5) { continue; } let sample = textureSample(sourceTexture, sourceTextureSampler, clamp(texCoord + offsets[index], vec2f(0.0), vec2f(1.0))); edge = max(edge, length(sample.rgb - center.rgb) + abs(sample.a - center.a)); }
  let coverage = smoothstep(0.04, 0.22, edge) * imageOutline.color.a;
  return vec4f(mix(center.rgb, imageOutline.color.rgb, coverage), center.a);
}`,
  fs: /* glsl */ `\
layout(std140) uniform imageOutlineUniforms {
  vec4 color;
  float thickness;
  float useDiagonalSamples;
} imageOutline;
vec4 imageOutline_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec2 texel = imageOutline.thickness / texSize;
  vec4 center = texture(sourceTexture, texCoord);
  float edge = 0.0;
  for (int index = 0; index < 8; index++) {
    if (index >= 4 && imageOutline.useDiagonalSamples < 0.5) continue;
    vec2 offset = index == 0 ? vec2(texel.x, 0.0) : index == 1 ? vec2(-texel.x, 0.0) : index == 2 ? vec2(0.0, texel.y) : index == 3 ? vec2(0.0, -texel.y) : index == 4 ? texel : index == 5 ? vec2(-texel.x, texel.y) : index == 6 ? vec2(texel.x, -texel.y) : -texel;
    vec4 sampleColor = texture(sourceTexture, clamp(texCoord + offset, 0.0, 1.0));
    edge = max(edge, length(sampleColor.rgb - center.rgb) + abs(sampleColor.a - center.a));
  }
  float coverage = smoothstep(0.04, 0.22, edge) * imageOutline.color.a;
  return vec4(mix(center.rgb, imageOutline.color.rgb, coverage), center.a);
}`,
  uniforms: {} as Pick<OutlineUniforms, 'color' | 'thickness' | 'useDiagonalSamples'>,
  uniformTypes: {color: 'vec4<f32>', thickness: 'f32', useDiagonalSamples: 'f32'},
  propTypes: {
    color: {value: [0.02, 0.08, 0.12, 0.48]},
    thickness: {value: 1.5, min: 0.5, softMax: 5},
    useDiagonalSamples: {value: 1, min: 0, max: 1, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

/** Use depth and reconstructed normals with the full sample pattern. */
const outlineOptionDefaults: Required<OutlineCompositeShaderPassOptions> = {
  mode: 'depth-normal',
  normalSource: 'reconstruct-from-depth',
  quality: 'high'
};
/** Enable diagonal edge samples for the high-quality outline. */
const diagonalSamples = {option: 'quality', values: {fast: 0, high: 1}} as const;

/** Selects depth-normal or image-based outlines with declarative quality options. */
export const outlines = {
  name: 'outlineCompositeShaderPass',
  optionDefaults: outlineOptionDefaults,
  optionUniforms: {
    screenSpaceOutline: {
      useNormalTexture: {
        option: 'normalSource',
        values: {'normal-texture': 1, 'reconstruct-from-depth': 0}
      },
      useDiagonalSamples: diagonalSamples
    },
    imageOutline: {useDiagonalSamples: diagonalSamples}
  },
  optionInputs: {
    screenSpaceOutline: {
      normalTexture: {option: 'normalSource', values: {'reconstruct-from-depth': 'previous'}}
    }
  },
  variants: {
    option: 'mode',
    values: {
      image: {
        name: 'imageOutlineCompositeShaderPass',
        passes: [
          {
            kind: 'sample',
            module: imageOutlinePass,
            inputs: {sourceTexture: 'previous'},
            output: 'previous'
          }
        ]
      }
    }
  },
  passes: [
    {kind: 'sample', module: outlinePass, inputs: {sourceTexture: 'previous'}, output: 'previous'}
  ]
} as const satisfies ConfigurableEffectDefinition<OutlineCompositeShaderPassOptions>;
