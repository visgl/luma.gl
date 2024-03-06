// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '../types';

let arrayBuffer: ArrayBuffer;

export function getScratchArrayBuffer(byteLength: number): ArrayBuffer {
  if (!arrayBuffer || arrayBuffer.byteLength < byteLength) {
    arrayBuffer = new ArrayBuffer(byteLength);
  }
  return arrayBuffer;
}

export function getScratchArray(Type: any, length: number): TypedArray {
  const scratchArrayBuffer = getScratchArrayBuffer(Type.BYTES_PER_ELEMENT * length);
  return new Type(scratchArrayBuffer, 0, length); // arrayBuffer, byteOffset, length (in elements)
}
