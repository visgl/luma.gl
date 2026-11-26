// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ShaderModule} from '../../../lib/shader-module/shader-module';

import {fp64ify, fp64LowPart, fp64ifyMatrix4} from './fp64-utils';
import {fp64arithmeticShader} from './fp64-arithmetic-glsl';
import {fp64arithmeticWGSL} from './fp64-arithmetic-wgsl';
import {fp64functionShader} from './fp64-functions-glsl';
import {fp64functionsWGSL} from './fp64-functions-wgsl';

type FP64Props = {};
type FP64Uniforms = {ONE: number; SPLIT: number};
type FP64Bindings = {};

type FP64Utilities = {
  fp64ify: typeof fp64ify;
  fp64LowPart: typeof fp64LowPart;
  fp64ifyMatrix4: typeof fp64ifyMatrix4;
};

const defaultUniforms: FP64Uniforms = {
  // Used in LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  ONE: 1.0,
  // Runtime split factor for Dekker splitting. Keeping this as a uniform helps
  // prevent aggressive constant folding in shader compilers.
  SPLIT: 4097.0
};

/**
 * 64bit arithmetic: add, sub, mul, div (small subset of fp64 module)
 */
export const fp64arithmetic: ShaderModule<FP64Props, FP64Uniforms, FP64Bindings> & FP64Utilities = {
  name: 'fp64arithmetic',
  source: fp64arithmeticWGSL,
  fs: fp64arithmeticShader,
  vs: fp64arithmeticShader,
  defaultUniforms,
  uniformTypes: {ONE: 'f32', SPLIT: 'f32'},

  // Additional Functions
  fp64ify,
  fp64LowPart,
  fp64ifyMatrix4
};

/**
 * Double-single math: full GLSL library and WGSL projection functions.
 * WGSL vector/matrix helpers return arrays instead of using GLSL out parameters.
 */
export const fp64: ShaderModule<{}> & FP64Utilities = {
  name: 'fp64',
  source: fp64functionsWGSL,
  vs: fp64functionShader,
  dependencies: [fp64arithmetic],

  // Additional Functions
  fp64ify,
  fp64LowPart,
  fp64ifyMatrix4
};

export {fp64ify, fp64LowPart, fp64ifyMatrix4};
