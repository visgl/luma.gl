// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isNumberArray} from './is-array';

const MAX_ELEMENTWISE_ARRAY_COMPARE_LENGTH = 128;

/** Test if two arrays are deep equal, with a small-array length limit that defaults to 16 */
export function arrayEqual(a: unknown, b: unknown, limit: number = 16) {
  if (a === b) {
    return true;
  }

  const arrayA = a;
  const arrayB = b;
  if (!isNumberArray(arrayA) || !isNumberArray(arrayB)) {
    return false;
  }

  if (arrayA.length !== arrayB.length) {
    return false;
  }

  const maxCompareLength = Math.min(limit, MAX_ELEMENTWISE_ARRAY_COMPARE_LENGTH);
  if (arrayA.length > maxCompareLength) {
    return false;
  }

  for (let i = 0; i < arrayA.length; ++i) {
    if (arrayB[i] !== arrayA[i]) {
      return false;
    }
  }

  return true;
}

/** Copy a value */
export function arrayCopy<T>(a: T): T {
  if (isNumberArray(a)) {
    return a.slice() as T;
  }
  return a;
}
