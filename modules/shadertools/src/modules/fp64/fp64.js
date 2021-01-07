/** @typedef {import('../../types').ShaderModule} ShaderModule */

import {fp64ify, fp64LowPart, fp64ifyMatrix4} from './fp64-utils';

import fp64arithmeticShader from './fp64-arithmetic.glsl';
import fp64functionShader from './fp64-functions.glsl';

const CONST_UNIFORMS = {
  // Used in LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  ONE: 1.0
};
export {fp64ify, fp64LowPart, fp64ifyMatrix4};

function getUniforms() {
  return CONST_UNIFORMS;
}

// Arithmetic only
export const fp64arithmetic = {
  name: 'fp64-arithmetic',
  vs: fp64arithmeticShader,
  fs: null,
  getUniforms,
  fp64ify,
  fp64LowPart,
  fp64ifyMatrix4
};

// Full fp64 shader
export const fp64 = {
  name: 'fp64',
  vs: fp64functionShader,
  fs: null,
  dependencies: [fp64arithmetic],
  fp64ify,
  fp64LowPart,
  fp64ifyMatrix4
};
