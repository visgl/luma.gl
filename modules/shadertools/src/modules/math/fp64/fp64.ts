// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule} from '../../../lib/shader-module/shader-module';

import {fp64ify, fp64LowPart, fp64ifyMatrix4} from '../../../modules/math/fp64/fp64-utils';
import {fp64arithmeticShader} from './fp64-arithmetic-glsl';
import {fp64functionShader} from './fp64-functions-glsl';

type FP64Props = {};
type FP64Uniforms = {ONE: number};
type FP64Bindings = {};

type FP64Utilities = {
  fp64ify: typeof fp64ify;
  fp64LowPart: typeof fp64LowPart;
  fp64ifyMatrix4: typeof fp64ifyMatrix4;
};

const defaultUniforms: FP64Uniforms = {
  // Used in LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  ONE: 1.0
};

/**
 * 64bit arithmetic: add, sub, mul, div (small subset of fp64 module)
 */
export const fp64arithmetic: ShaderModule<FP64Props, FP64Uniforms, FP64Bindings> & FP64Utilities = {
  name: 'fp64arithmetic',
  vs: fp64arithmeticShader,
  defaultUniforms,
  uniformTypes: {ONE: 'f32'},

  // Additional Functions
  fp64ify,
  fp64LowPart,
  fp64ifyMatrix4
};

/**
 * Full 64 bit math library
 */
export const fp64: ShaderModule<{}> & FP64Utilities = {
  name: 'fp64',
  vs: fp64functionShader,
  dependencies: [fp64arithmetic],

  // Additional Functions
  fp64ify,
  fp64LowPart,
  fp64ifyMatrix4
};

export {fp64ify, fp64LowPart, fp64ifyMatrix4};
