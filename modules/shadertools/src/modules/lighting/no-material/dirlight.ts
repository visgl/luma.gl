// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray3} from '@math.gl/core';
import {ShaderModule} from '../../../lib/shader-module/shader-module';

export type DirlightProps = {
  lightDirection?: NumberArray3;
};

export type DirlightUniforms = DirlightProps;

// TODO
export const SOURCE_WGSL = /* WGSL */ `\  
struct dirlightUniforms {
  lightDirection: vec3<f32>,
};

alias DirlightNormal = vec3<f32>;

struct DirlightInputs {
  normal: DirlightNormal,
};

@binding(1) @group(0) var<uniform> dirlight : dirlightUniforms;

// For vertex
fn dirlight_setNormal(normal: vec3<f32>) -> DirlightNormal {
  return normalize(normal);
}

// Returns color attenuated by angle from light source
fn dirlight_filterColor(color: vec4<f32>, inputs: DirlightInputs) -> vec4<f32> {
  // TODO - fix default light direction
  // let lightDirection = dirlight.lightDirection;
  let lightDirection = vec3<f32>(1, 1, 1);
  let d: f32 = abs(dot(inputs.normal, normalize(lightDirection)));
  return vec4<f32>(color.rgb * d, color.a);
}
`;

const VS_GLSL = /* glsl */ `\
out vec3 dirlight_vNormal;

void dirlight_setNormal(vec3 normal) {
  dirlight_vNormal = normalize(normal);
}
`;

const FS_GLSL = /* glsl */ `\
uniform dirlightUniforms {
  vec3 lightDirection;
} dirlight;

in vec3 dirlight_vNormal;

// Returns color attenuated by angle from light source
vec4 dirlight_filterColor(vec4 color) {
  float d = abs(dot(dirlight_vNormal, normalize(dirlight.lightDirection)));
  return vec4(color.rgb * d, color.a);
}
`;

/**
 * Cheap lighting - single directional light, single dot product, one uniform
 */
export const dirlight = {
  props: {} as DirlightProps,
  uniforms: {} as DirlightUniforms,

  name: 'dirlight',
  dependencies: [],
  source: SOURCE_WGSL,
  vs: VS_GLSL,
  fs: FS_GLSL,

  // fragmentInputs: [
  //   {
  //     name: 'dirlight_vNormal',
  //     type: 'vec3<f32>'
  //   }
  // ],
  uniformTypes: {
    lightDirection: 'vec3<f32>'
  },
  defaultUniforms: {
    lightDirection: [1, 1, 2]
  },
  getUniforms
} as const satisfies ShaderModule<DirlightProps, DirlightUniforms>;

function getUniforms(opts: DirlightProps = dirlight.defaultUniforms): DirlightUniforms {
  const uniforms: Record<string, unknown> = {};
  if (opts.lightDirection) {
    // eslint-disable-next-line camelcase
    uniforms.dirlight_uLightDirection = opts.lightDirection;
  }
  return uniforms;
}
