// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray, NumberArray} from '../types';

/**
 * Check is an array is a typed array
 * @param value value to be tested
 * @returns input as TypedArray, or null
 * @todo this should be provided by @math.gl/types
 */
export function isTypedArray(value: unknown): TypedArray | null {
  return ArrayBuffer.isView(value) && !(value instanceof DataView) ? (value as TypedArray) : null;
}

/**
 * Check is an array is a numeric array (typed array or array of numbers)
 * @param value value to be tested
 * @returns input as NumberArray, or null
 * @todo this should be provided by @math.gl/types
 */
export function isNumberArray(value: unknown): NumberArray | null {
  if (Array.isArray(value)) {
    return value.length === 0 || typeof value[0] === 'number' ? (value as number[]) : null;
  }
  return isTypedArray(value);
}
