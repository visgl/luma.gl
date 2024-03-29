// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fp64ify, fp64LowPart, fp64ifyMatrix4} from '../../../modules/math/fp64/fp64-utils';

import {fp64arithmeticShader} from './fp64-arithmetic-glsl';
import {fp64functionShader} from './fp64-functions-glsl';

const CONST_UNIFORMS = {
  // Used in LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  ONE: 1.0
};
export {fp64ify, fp64LowPart, fp64ifyMatrix4};

function getUniforms() {
  return CONST_UNIFORMS;
}

/**
 * 64bit arithmetic: add, sub, mul, div (small subset of fp64 module)
 */
export const fp64arithmetic = {
  name: 'fp64-arithmetic',
  vs: fp64arithmeticShader,
  getUniforms,
  fp64ify,
  fp64LowPart,
  fp64ifyMatrix4
};

/**
 * Full 64 bit math library
 */
export const fp64 = {
  name: 'fp64',
  vs: fp64functionShader,
  dependencies: [fp64arithmetic],

  // Additional Functions
  fp64ify,
  fp64LowPart,
  fp64ifyMatrix4
};
