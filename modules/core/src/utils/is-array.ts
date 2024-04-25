// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray, NumberArray} from '../types';

/**
 * Check is an array is a typed array
 * @param value value to be tested
 * @returns input as TypedArray, or null
 * @todo this should be provided by @math.gl/types
 */
export function isTypedArray(value: unknown): value is TypedArray {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

/**
 * Check is an array is a numeric array (typed array or array of numbers)
 * @param value value to be tested
 * @returns input as NumberArray, or null
 * @todo this should be provided by @math.gl/types
 */
export function isNumberArray(value: unknown): value is NumberArray {
  if (Array.isArray(value)) {
    return value.length === 0 || typeof value[0] === 'number';
  }
  return isTypedArray(value);
}
