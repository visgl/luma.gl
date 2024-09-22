// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray} from '@luma.gl/core';

/** deeply compare two arrays */
export function deepArrayEqual(
  x: unknown | unknown[] | TypedArray,
  y: unknown | unknown[] | TypedArray
): boolean {
  if (x === y) {
    return true;
  }
  if (isArray(x) && isArray(y) && x.length === y.length) {
    for (let i = 0; i < x.length; ++i) {
      if (x[i] !== y[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function isArray(x: unknown): x is unknown[] {
  return Array.isArray(x) || ArrayBuffer.isView(x);
}
