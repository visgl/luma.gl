// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isNumberArray} from '../utils/is-array';

export function isUniformValue(value: unknown): boolean {
  return isNumberArray(value) !== null || typeof value === 'number' || typeof value === 'boolean';
}
