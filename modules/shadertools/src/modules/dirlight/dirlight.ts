// luma.gl, MIT license
import type {NumberArray} from '../../types';
import {project} from '../project/project';

export type DirlightOptions = {
  lightDirection?: NumberArray
}

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

var fs = `\
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
 export const dirlight = {
  name: 'dirlight',
  // vs // TODO - reuse normal from geometry module
  fs,
  getUniforms,
  dependencies: [project]
};
