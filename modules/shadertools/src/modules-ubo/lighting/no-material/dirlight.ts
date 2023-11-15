// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import type {NumberArray} from '@math.gl/types';
import {glsl} from '../../../lib/glsl-utils/highlight';
import {ShaderModule} from '../../../lib/shader-module/shader-module';

export type DirlightProps = {
  lightDirection?: NumberArray | [number, number, number]
}

const vs = glsl`\
varying vec3 dirlight_vNormal;

void dirlight_setNormal(vec3 normal) {
  dirlight_vNormal = normalize(normal);
}
`;

const fs = glsl`\
uniform dirlightUniforms {
  vec3 lightDirection;
} dirlight;

varying vec3 dirlight_vNormal;

// Returns color attenuated by angle from light source
vec4 dirlight_filterColor(vec4 color) {
  float d = abs(dot(dirlight_vNormal, normalize(dirlight.lightDirection)));
  return vec4(color.rgb * d, color.a);
}
`;

/**
 * Cheap lighting - single directional light, single dot product, one uniform
 */
export const dirlight: ShaderModule<DirlightProps> = {
  name: 'dirlight',
  dependencies: [],
  vs,
  fs,
  uniformTypes: {
    lightDirection: 'vec3<f32>'
  },
  defaultUniforms: {
    lightDirection: new Float32Array([1, 1, 2])
  },
  getUniforms
};

function getUniforms(opts: DirlightProps = dirlight.defaultUniforms): Record<string, unknown> {
  const uniforms: Record<string, unknown> = {};
  if (opts.lightDirection) {
    // eslint-disable-next-line camelcase
    uniforms.dirlight_uLightDirection = opts.lightDirection;
  }
  return uniforms;
}
