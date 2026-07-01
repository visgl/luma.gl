// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {NumberArray3, NumberArray16} from '@math.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import {SHADOW_QUALITY_SETTINGS, type ShadowQuality} from './shadow-quality';

const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1];

type ContactShadowBindings = {
  depthTexture?: Texture;
  normalTexture?: Texture;
};

type ContactTraceUniforms = {
  projectionMatrix: Readonly<NumberArray16>;
  inverseProjectionMatrix: Readonly<NumberArray16>;
  lightDirectionView: Readonly<NumberArray3>;
  maxDistance: number;
  thickness: number;
  stepCount: number;
  frameIndex: number;
};

/** Runtime controls accepted by the contact-shadow trace and composite passes. */
export type ContactShadowProps = Partial<ContactTraceUniforms> & {
  strength?: number;
  debugMode?: number;
  directionalDirectTexture?: Texture;
  shadowDebugTexture?: Texture;
};

export const contactShadowTrace = {
  name: 'contactShadowTrace',
  source: /* wgsl */ `\
struct contactShadowTraceUniforms {
  projectionMatrix: mat4x4f,
  inverseProjectionMatrix: mat4x4f,
  lightDirectionView: vec3f,
  maxDistance: f32,
  thickness: f32,
  stepCount: f32,
  frameIndex: f32,
};
@group(0) @binding(auto) var<uniform> contactShadowTrace: contactShadowTraceUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn contactShadow_reconstructViewPosition(uv: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth, 1.0);
  let view = contactShadowTrace.inverseProjectionMatrix * clip;
  return view.xyz / max(abs(view.w), 0.00001);
}

fn contactShadow_projectViewPosition(position: vec3f) -> vec2f {
  let clip = contactShadowTrace.projectionMatrix * vec4f(position, 1.0);
  let ndc = clip.xy / max(abs(clip.w), 0.00001);
  return vec2f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);
}

fn contactShadowTrace_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (centerDepth >= 0.99999) { return vec4f(1.0); }
  let centerNormal = normalize(textureSampleLevel(normalTexture, normalTextureSampler, texCoord, 0.0).xyz * 2.0 - 1.0);
  let centerPosition = contactShadow_reconstructViewPosition(texCoord, centerDepth) + centerNormal * 0.035;
  let rayDirection = normalize(contactShadowTrace.lightDirectionView);
  let noise = fract(sin(dot(texCoord * texSize + contactShadowTrace.frameIndex, vec2f(12.9898, 78.233))) * 43758.5453);
  for (var index: i32 = 0; index < 40; index++) {
    if (f32(index) >= contactShadowTrace.stepCount) { break; }
    let fraction = (f32(index) + 0.35 + noise * 0.5) / max(contactShadowTrace.stepCount, 1.0);
    let travel = contactShadowTrace.maxDistance * fraction * fraction;
    let rayPosition = centerPosition + rayDirection * travel;
    let sampleUv = contactShadow_projectViewPosition(rayPosition);
    if (any(sampleUv <= vec2f(0.0)) || any(sampleUv >= vec2f(1.0))) { break; }
    let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleUv, 0);
    if (sampleDepth >= 0.99999) { continue; }
    let scenePosition = contactShadow_reconstructViewPosition(sampleUv, sampleDepth);
    let depthDelta = (-rayPosition.z) - (-scenePosition.z);
    let hitThickness = contactShadowTrace.thickness + travel * 0.02;
    if (depthDelta >= 0.0 && depthDelta <= hitThickness) {
      let distanceFade = 1.0 - clamp(travel / contactShadowTrace.maxDistance, 0.0, 1.0);
      return vec4f(vec3f(1.0 - distanceFade), 1.0);
    }
    if (depthDelta > hitThickness * 8.0) { break; }
  }
  return vec4f(1.0);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  props: {} as Partial<ContactTraceUniforms> & ContactShadowBindings,
  uniforms: {} as ContactTraceUniforms,
  bindings: {} as ContactShadowBindings,
  uniformTypes: {
    projectionMatrix: 'mat4x4<f32>',
    inverseProjectionMatrix: 'mat4x4<f32>',
    lightDirectionView: 'vec3<f32>',
    maxDistance: 'f32',
    thickness: 'f32',
    stepCount: 'f32',
    frameIndex: 'f32'
  },
  propTypes: {
    projectionMatrix: {value: IDENTITY_MATRIX, private: true},
    inverseProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    lightDirectionView: {value: [0, 1, 0], private: true},
    maxDistance: {value: 4, min: 0.1, softMax: 16},
    thickness: {value: 0.12, min: 0.005, softMax: 1},
    stepCount: {value: 24, min: 1, max: 40},
    frameIndex: {value: 0, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<ContactTraceUniforms> & ContactShadowBindings,
  ContactTraceUniforms,
  ContactShadowBindings
>;

type ContactBlurUniforms = {
  direction: [number, number];
  radius: number;
  depthSigma: number;
  normalPower: number;
};

export const contactShadowBilateralBlur = {
  name: 'contactShadowBilateralBlur',
  source: /* wgsl */ `\
struct contactShadowBilateralBlurUniforms {
  direction: vec2f,
  radius: f32,
  depthSigma: f32,
  normalPower: f32,
};
@group(0) @binding(auto) var<uniform> contactShadowBilateralBlur: contactShadowBilateralBlurUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn contactShadowBilateralBlur_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let sourceDimensions = vec2f(textureDimensions(sourceTexture));
  let texel = contactShadowBilateralBlur.direction / sourceDimensions;
  let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  let centerNormal = normalize(textureSampleLevel(normalTexture, normalTextureSampler, texCoord, 0.0).xyz * 2.0 - 1.0);
  var result = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0.0).r;
  var totalWeight = 1.0;
  for (var index: i32 = 1; index <= 6; index++) {
    if (f32(index) > contactShadowBilateralBlur.radius) { break; }
    for (var side: i32 = -1; side <= 1; side += 2) {
      let sampleUv = clamp(texCoord + texel * f32(index * side), vec2f(0.0), vec2f(1.0));
      let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleUv, 0);
      let sampleNormal = normalize(textureSampleLevel(normalTexture, normalTextureSampler, sampleUv, 0.0).xyz * 2.0 - 1.0);
      let depthDelta = abs(sampleDepth - centerDepth);
      let depthWeight = exp(-(depthDelta * depthDelta) / max(2.0 * contactShadowBilateralBlur.depthSigma * contactShadowBilateralBlur.depthSigma, 0.000001));
      let normalWeight = pow(max(dot(centerNormal, sampleNormal), 0.0), contactShadowBilateralBlur.normalPower);
      let spatialWeight = exp(-f32(index * index) / 8.0);
      let weight = depthWeight * normalWeight * spatialWeight;
      result += textureSampleLevel(sourceTexture, sourceTextureSampler, sampleUv, 0.0).r * weight;
      totalWeight += weight;
    }
  }
  let visibility = result / totalWeight;
  return vec4f(vec3f(visibility), 1.0);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  props: {} as Partial<ContactBlurUniforms> & ContactShadowBindings,
  uniforms: {} as ContactBlurUniforms,
  bindings: {} as ContactShadowBindings,
  uniformTypes: {
    direction: 'vec2<f32>',
    radius: 'f32',
    depthSigma: 'f32',
    normalPower: 'f32'
  },
  propTypes: {
    direction: {value: [1, 0], private: true},
    radius: {value: 4, min: 1, max: 6},
    depthSigma: {value: 0.006, min: 0.0001, softMax: 0.05},
    normalPower: {value: 24, min: 1, softMax: 64}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<ContactBlurUniforms> & ContactShadowBindings,
  ContactBlurUniforms,
  ContactShadowBindings
>;

type ContactCompositeBindings = {
  contactShadowTexture?: Texture;
  directionalDirectTexture?: Texture;
  shadowDebugTexture?: Texture;
};

type ContactCompositeUniforms = {strength: number; debugMode: number};

export const contactShadowComposite = {
  name: 'contactShadowComposite',
  source: /* wgsl */ `\
struct contactShadowCompositeUniforms {
  strength: f32,
  debugMode: f32,
};
@group(0) @binding(auto) var<uniform> contactShadowComposite: contactShadowCompositeUniforms;
@group(0) @binding(auto) var contactShadowTexture: texture_2d<f32>;
@group(0) @binding(auto) var contactShadowTextureSampler: sampler;
@group(0) @binding(auto) var directionalDirectTexture: texture_2d<f32>;
@group(0) @binding(auto) var directionalDirectTextureSampler: sampler;
@group(0) @binding(auto) var shadowDebugTexture: texture_2d<f32>;
@group(0) @binding(auto) var shadowDebugTextureSampler: sampler;

fn contactShadowComposite_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let color = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0.0);
  let contact = textureSampleLevel(contactShadowTexture, contactShadowTextureSampler, texCoord, 0.0).r;
  let appliedContact = mix(1.0, contact, contactShadowComposite.strength);
  if (contactShadowComposite.debugMode > 0.5 && contactShadowComposite.debugMode < 1.5) {
    return vec4f(vec3f(contact), 1.0);
  }
  if (contactShadowComposite.debugMode >= 1.5) {
    let factors = textureSampleLevel(shadowDebugTexture, shadowDebugTextureSampler, texCoord, 0.0).rgb;
    return vec4f(vec3f(factors.x * factors.y * factors.z * contact), 1.0);
  }
  let directionalDirect = textureSampleLevel(
    directionalDirectTexture,
    directionalDirectTextureSampler,
    texCoord,
    0.0
  ).rgb;
  return vec4f(max(color.rgb - directionalDirect * (1.0 - appliedContact), vec3f(0.0)), color.a);
}`,
  bindingLayout: [
    {name: 'contactShadowTexture', group: 0},
    {name: 'directionalDirectTexture', group: 0},
    {name: 'shadowDebugTexture', group: 0}
  ],
  props: {} as Partial<ContactCompositeUniforms> & ContactCompositeBindings,
  uniforms: {} as ContactCompositeUniforms,
  bindings: {} as ContactCompositeBindings,
  uniformTypes: {strength: 'f32', debugMode: 'f32'},
  propTypes: {
    strength: {value: 1, min: 0, max: 1},
    debugMode: {value: 0, min: 0, max: 2, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<ContactCompositeUniforms> & ContactCompositeBindings,
  ContactCompositeUniforms,
  ContactCompositeBindings,
  'contactShadowFiltered'
>;

/** Builds the quality-scaled trace, bilateral cleanup, and direct-light composite pipeline. */
export function createContactShadowShaderPassPipeline(
  options: {quality?: ShadowQuality} = {}
): ShaderPassPipeline<'contactShadowRaw' | 'contactShadowScratch' | 'contactShadowFiltered'> {
  const quality = options.quality || 'Balanced';
  const settings = SHADOW_QUALITY_SETTINGS[quality];
  if (!settings) {
    throw new Error(`Unknown shadow quality: ${String(quality)}.`);
  }
  return {
    name: 'contactShadowShaderPassPipeline',
    renderTargets: {
      contactShadowRaw: {
        scale: [settings.contactScale, settings.contactScale],
        format: 'rgba8unorm'
      },
      contactShadowScratch: {
        scale: [settings.contactScale, settings.contactScale],
        format: 'rgba8unorm'
      },
      contactShadowFiltered: {
        scale: [settings.contactScale, settings.contactScale],
        format: 'rgba8unorm'
      }
    },
    steps: [
      {
        shaderPass: contactShadowTrace,
        inputs: {sourceTexture: 'previous'},
        output: 'contactShadowRaw',
        uniforms: {stepCount: settings.contactStepCount}
      },
      {
        shaderPass: contactShadowBilateralBlur,
        inputs: {sourceTexture: 'contactShadowRaw'},
        output: 'contactShadowScratch',
        uniforms: {direction: [1, 0]}
      },
      {
        shaderPass: contactShadowBilateralBlur,
        inputs: {sourceTexture: 'contactShadowScratch'},
        output: 'contactShadowFiltered',
        uniforms: {direction: [0, 1]}
      },
      {
        shaderPass: contactShadowComposite,
        inputs: {
          sourceTexture: 'previous',
          contactShadowTexture: 'contactShadowFiltered'
        },
        output: 'previous'
      }
    ]
  };
}
