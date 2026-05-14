// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SignedDataType} from '@luma.gl/core';
import {GPUTableEvaluator} from '../operation/gpu-table';

export function deduceOutputProps(...inputs: GPUTableEvaluator[]): {
  isConstant: boolean;
  type: SignedDataType;
  size: number;
  length: number;
} {
  return {
    isConstant: inputs.every(x => x.isConstant),
    type: joinTypes(inputs.map(x => x.type)),
    size: inputs.reduce((s, x) => Math.max(s, x.size), 0),
    length: inputs.reduce((l, x) => Math.max(l, x.length), 0)
  };
}

/** Get the data type that can best represent all values from `types`
 * If none exists, returns float32
 */
function joinTypes(types: SignedDataType[]): SignedDataType {
  let u = 0;
  let s = 0;
  for (const type of types) {
    if (type[0] === 'f') {
      return 'float32';
    }
    const b = type.endsWith('8') ? 8 : type.endsWith('6') ? 16 : 32;
    if (type[0] === 'u') {
      u = Math.max(u, b);
    } else {
      s = Math.max(s, b);
    }
  }
  if (u && !s) {
    return `uint${u}` as SignedDataType;
  }
  if (s && u < 32) {
    return `sint${Math.max(s, u * 2)}` as SignedDataType;
  }
  return 'float32';
}
