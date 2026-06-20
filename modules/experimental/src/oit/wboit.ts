// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule, ShaderPlugin} from '@luma.gl/shadertools';

/** Weighted blended OIT capture pass. */
export type WBOITPass = 'accumulation' | 'revealage';

/** Public props accepted by the weighted blended OIT shader module. */
export type WBOITShaderModuleProps = {
  /** Active capture pass. Omit to return fragment colors unchanged. */
  pass?: WBOITPass;
};

/** Uniforms consumed by the weighted blended OIT shader module. */
export type WBOITShaderModuleUniforms = {
  /** Numeric capture-pass selector. */
  capturePass: number;
};

const WBOIT_PASS_INACTIVE = 0;
const WBOIT_PASS_ACCUMULATION = 1;
const WBOIT_PASS_REVEALAGE = 2;

const WBOIT_WGSL = /* wgsl */ `\
struct WBOITUniforms {
  capturePass: i32,
};

@group(0) @binding(auto) var<uniform> wboit: WBOITUniforms;

fn wboit_getWeight(depth: f32, alpha: f32) -> f32 {
  let alphaWeight = pow(min(1.0, alpha * 10.0) + 0.01, 3.0);
  let depthWeight = pow(1.0 - depth * 0.9, 3.0);
  return clamp(alphaWeight * 1e8 * depthWeight, 1e-2, 3e3);
}

fn wboit_capturePremultipliedColor(
  color: vec4<f32>,
  fragmentPosition: vec4<f32>
) -> vec4<f32> {
  if (wboit.capturePass == ${WBOIT_PASS_ACCUMULATION}) {
    let weight = wboit_getWeight(fragmentPosition.z, color.a);
    return vec4<f32>(color.rgb * weight, color.a * weight);
  }
  if (wboit.capturePass == ${WBOIT_PASS_REVEALAGE}) {
    return vec4<f32>(color.a);
  }
  return color;
}

fn wboit_captureStraightColor(
  color: vec4<f32>,
  fragmentPosition: vec4<f32>
) -> vec4<f32> {
  return wboit_capturePremultipliedColor(
    vec4<f32>(color.rgb * color.a, color.a),
    fragmentPosition
  );
}
`;

const WBOIT_GLSL = /* glsl */ `\
layout(std140) uniform wboitUniforms {
  int capturePass;
} wboit;

float wboit_getWeight(float depth, float alpha) {
  float alphaWeight = pow(min(1.0, alpha * 10.0) + 0.01, 3.0);
  float depthWeight = pow(1.0 - depth * 0.9, 3.0);
  return clamp(alphaWeight * 1e8 * depthWeight, 1e-2, 3e3);
}

vec4 wboit_capturePremultipliedColor(vec4 color, vec4 fragmentPosition) {
  if (wboit.capturePass == ${WBOIT_PASS_ACCUMULATION}) {
    float weight = wboit_getWeight(fragmentPosition.z, color.a);
    return vec4(color.rgb * weight, color.a * weight);
  }
  if (wboit.capturePass == ${WBOIT_PASS_REVEALAGE}) {
    return vec4(color.a);
  }
  return color;
}

vec4 wboit_captureStraightColor(vec4 color, vec4 fragmentPosition) {
  return wboit_capturePremultipliedColor(vec4(color.rgb * color.a, color.a), fragmentPosition);
}
`;

function getUniforms(props: WBOITShaderModuleProps = {}): WBOITShaderModuleUniforms {
  return {
    capturePass:
      props.pass === 'accumulation'
        ? WBOIT_PASS_ACCUMULATION
        : props.pass === 'revealage'
          ? WBOIT_PASS_REVEALAGE
          : WBOIT_PASS_INACTIVE
  };
}

/**
 * Cross-backend shader module that converts final fragment colors into weighted blended OIT
 * accumulation or revealage values.
 */
export const wboit = {
  name: 'wboit',
  source: WBOIT_WGSL,
  fs: WBOIT_GLSL,
  uniformTypes: {capturePass: 'i32'},
  defaultUniforms: {capturePass: WBOIT_PASS_INACTIVE},
  getUniforms
} as const satisfies ShaderModule<WBOITShaderModuleProps, WBOITShaderModuleUniforms, {}>;

/** Shader plugin that installs the portable weighted blended OIT shader module. */
export const wboitPlugin = {
  name: 'wboit',
  modules: [wboit as ShaderModule]
} as const satisfies ShaderPlugin;
