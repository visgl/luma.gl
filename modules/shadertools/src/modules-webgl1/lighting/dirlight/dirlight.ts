// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import type {NumericArray} from '../../../types';
import {project} from '../../project/project';

/* eslint-disable camelcase */

export type DirlightOptions = {
  lightDirection?: NumericArray;
};

const DEFAULT_MODULE_OPTIONS: Required<DirlightOptions> = {
  lightDirection: new Float32Array([1, 1, 2])
};

function getUniforms(opts: DirlightOptions = DEFAULT_MODULE_OPTIONS): Record<string, any> {
  const uniforms = {};
  if (opts.lightDirection) {
    // @ts-expect-error TODO add types
    uniforms.dirlight_uLightDirection = opts.lightDirection;
  }
  return uniforms;
}

const fs = /* glsl */ `\
uniform vec3 dirlight_uLightDirection;

/*
 * Returns color attenuated by angle from light source
 */
vec4 dirlight_filterColor(vec4 color) {
  vec3 normal = project_getNormal_World();
  float d = abs(dot(normalize(normal), normalize(dirlight_uLightDirection)));
  return vec4(color.rgb * d, color.a);
}
`;

/**
 * Cheap lighting - single directional light, single dot product, one uniform
 */
export const dirlight: ShaderModule = {
  name: 'dirlight',
  // vs // TODO - reuse normal from geometry module
  fs,
  getUniforms,
  dependencies: [project]
};
