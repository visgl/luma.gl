// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isNumberArray} from '../utils/is-array';
import {UniformValue} from '../adapter/types/uniforms';

export function isUniformValue(value: unknown): value is UniformValue {
  return isNumberArray(value) || typeof value === 'number' || typeof value === 'boolean';
}
