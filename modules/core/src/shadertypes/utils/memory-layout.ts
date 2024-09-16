// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderTypeInfo} from '../shader-types';

/** Aligns a byte offset to a specific alignment by adding required number of bytes to the offset */
export const alignTo = (byteOffset: number, byteAlignment: number) =>
  (((byteOffset + byteAlignment - 1) / byteAlignment) | 0) * byteAlignment;

/** Valid values for uniforms. @note boolean values get converted to 0 or 1 before setting */
export type UniformPrimitiveValue = number | boolean | Readonly<number[]>; // Float32Array> | Readonly<Int32Array> | Readonly<Uint32Array> | Readonly<number[]>;

export type UniformValue = UniformPrimitiveValue | {[field: string]: UniformValue} | UniformValue[];

type MemoryOffsetContext = {
  byteOffset: number;
};

export function calculateMemoryOffsets(
  shaderTypeInfo: ShaderTypeInfo,
  offsetContext: MemoryOffsetContext = {byteOffset: 0}
): void {
  // Add layout (type, size and byteOffset) definitions for each uniform in the layout
  const {kind} = shaderTypeInfo;
  switch (kind) {
    case 'struct':
      for (const fieldType of Object.values(shaderTypeInfo.fields)) {
        calculateMemoryOffsets(fieldType, offsetContext);
      }
      break;
    case 'array':
      calculateMemoryOffsets(shaderTypeInfo.elementType, offsetContext);
      break;
    case 'primitive':
      // First, align bump current byteOffset to match the alignment requirements of the current type.
      offsetContext.byteOffset = alignTo(offsetContext.byteOffset, shaderTypeInfo.byteAlignment);
      shaderTypeInfo.byteOffset = offsetContext.byteOffset;

      // Use the aligned size as the byteOffset of the current uniform.
      // const byteOffset = size;
      // // Then, add our object's padded size ((1, 2, multiple of 4) to the current byteOffset
      // size += count;
      // // this.layout[key] = {type, size: count, byteOffset};
      // size += (4 - (size % 4)) % 4;
      break;
  }
}
