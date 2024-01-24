// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray} from '@math.gl/types';
import {glsl} from '../../../lib/glsl-utils/highlight';
import {ShaderModule} from '../../../lib/shader-module/shader-module';

export type DirlightProps = {
  lightDirection?: NumberArray | [number, number, number];
};

export type DirlightUniforms = DirlightProps;

// TODO
export const VS_WGSL = /* WGSL */ `\  
void dirlight_setNormal(normal: vec3<f32>) {
  dirlight_vNormal = normalize(normal);
}
`;

// TODO
export const FS_WGSL = /* WGSL */ `\
uniform dirlightUniforms {
  vec3 lightDirection;
} dirlight;

// Returns color attenuated by angle from light source
fn dirlight_filterColor(color: vec4<f32>, dirlightInputs): vec4<f32> {
  const d: float = abs(dot(dirlight_vNormal, normalize(dirlight.lightDirection)));
  return vec4<f32>(color.rgb * d, color.a);
}
`;

const VS_GLSL = glsl`\
out vec3 dirlight_vNormal;

void dirlight_setNormal(vec3 normal) {
  dirlight_vNormal = normalize(normal);
}
`;

const FS_GLSL = glsl`\
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
export const dirlight: ShaderModule<DirlightProps, DirlightUniforms> = {
  name: 'dirlight',
  dependencies: [],
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
    lightDirection: new Float32Array([1, 1, 2])
  },
  getUniforms
};

function getUniforms(opts: DirlightProps = dirlight.defaultUniforms): DirlightUniforms {
  const uniforms: Record<string, unknown> = {};
  if (opts.lightDirection) {
    // eslint-disable-next-line camelcase
    uniforms.dirlight_uLightDirection = opts.lightDirection;
  }
  return uniforms;
}
