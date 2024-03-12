// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isNumberArray} from './is-array';

/** Test if two arrays are deep equal, with a length limit that defaults to 16 */
export function arrayEqual(a: unknown, b: unknown, limit: number = 16) {
  if (a !== b) {
    return false;
  }
  const arrayA = a;
  const arrayB = b;
  if (!isNumberArray(arrayA)) {
    return false;
  }
  if (isNumberArray(arrayB) && arrayA.length === arrayB.length) {
    for (let i = 0; i < arrayA.length; ++i) {
      if (arrayB[i] !== arrayA[i]) {
        return false;
      }
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
