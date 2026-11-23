// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, getFloat16ArrayConstructor, type BigTypedArrayConstructor} from '@luma.gl/core';
import type {GLTFAccessorPostprocessed} from '../types/gltf-postprocessed-schema';

const ARRAY_TYPES: Record<number, BigTypedArrayConstructor> = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5124: Int32Array,
  5125: Uint32Array,
  5126: Float32Array,
  5130: Float64Array,
  // Preserve binary16 payloads in runtimes without Float16Array.
  5131: getFloat16ArrayConstructor(),
  5134: BigInt64Array,
  5135: BigUint64Array
};

export function getAccessorArrayTypeAndLength(
  accessor: GLTFAccessorPostprocessed,
  bufferView: {byteLength: number}
): {ArrayType: BigTypedArrayConstructor; byteLength: number} {
  const ArrayType = ARRAY_TYPES[accessor.componentType];
  // The component type must have a supported storage representation.
  assert(ArrayType);
  const byteLength = accessor.count * accessor.components * ArrayType.BYTES_PER_ELEMENT;
  // Accessor storage must fit within its buffer view.
  assert(byteLength >= 0 && byteLength <= bufferView.byteLength);
  return {ArrayType, byteLength};
}

/** Copies an exact range, including unaligned or borrowed input buffers. */
export function copyToArrayBuffer(
  buffer: ArrayBuffer,
  byteOffset: number,
  byteLength: number
): ArrayBuffer {
  return new Uint8Array(buffer, byteOffset, byteLength).slice().buffer;
}

/** Materializes accessor elements, removing interleaving and matrix column padding. */
export function readAccessorValues(
  accessor: GLTFAccessorPostprocessed,
  bufferView: import('../types/gltf-postprocessed-schema').GLTFBufferViewPostprocessed,
  byteOffset = accessor.byteOffset || 0,
  count = accessor.count
): import('../types/gltf-types').GLTFTypedArray {
  const {ArrayType} = getAccessorArrayTypeAndLength(accessor, bufferView);
  const matrixDimensions: Record<string, number> = {MAT2: 2, MAT3: 3, MAT4: 4};
  const matrixDimension = matrixDimensions[accessor.type];
  const columns = matrixDimension || 1;
  const columnByteLength = (accessor.components / columns) * accessor.bytesPerComponent;
  const columnByteStride = matrixDimension ? Math.ceil(columnByteLength / 4) * 4 : columnByteLength;
  const elementByteStride = bufferView.byteStride || columns * columnByteStride;
  const storageByteLength =
    count > 0
      ? (count - 1) * elementByteStride + (columns - 1) * columnByteStride + columnByteLength
      : 0;
  // Read only the declared buffer view and borrowed buffer range.
  assert(byteOffset >= 0 && byteOffset + storageByteLength <= bufferView.byteLength);
  const buffer = bufferView.buffer;
  const viewByteOffset = bufferView.byteOffset || 0;
  assert(viewByteOffset >= 0 && viewByteOffset + bufferView.byteLength <= buffer.byteLength);
  const sourceBytes = new Uint8Array(
    buffer.arrayBuffer,
    buffer.byteOffset + viewByteOffset + byteOffset,
    storageByteLength
  );
  const packedBytes = new Uint8Array(count * accessor.bytesPerElement);
  for (let elementIndex = 0; elementIndex < count; elementIndex++) {
    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
      const sourceOffset = elementIndex * elementByteStride + columnIndex * columnByteStride;
      const targetOffset = elementIndex * accessor.bytesPerElement + columnIndex * columnByteLength;
      packedBytes.set(
        sourceBytes.subarray(sourceOffset, sourceOffset + columnByteLength),
        targetOffset
      );
    }
  }
  return new ArrayType(packedBytes.buffer);
}
