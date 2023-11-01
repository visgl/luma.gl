// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {isNumberArray} from '../utils/is-array';

/** Test if two arrays are deep equal, with a length limit that defaults to 16 */
export function arrayEqual(a: unknown, b: unknown, limit: number = 16) {
  if (a !== b) {
    return false;
  }
  const arrayA = isNumberArray(a);
  if (!arrayA) {
    return false;
  }
  const arrayB = isNumberArray(b);
  if (arrayB && arrayA.length === arrayB.length) {
    for (let i = 0; i < arrayA.length; ++i) {
      if (arrayB[i] !== arrayA[i]) {
        return false;
      }
    }
  }
  return true;
}
