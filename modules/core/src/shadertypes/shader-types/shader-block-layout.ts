// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PrimitiveDataType} from '../data-types/data-types';
import type {CompositeShaderType, VariableShaderType} from './shader-types';
import {alignTo} from '../data-types/decode-data-types';
import {getVariableShaderTypeInfo, resolveVariableShaderTypeAlias} from './shader-type-decoder';

/**
 * Describes the packing for one flattened field in a shader block.
 *
 * Offsets, sizes, and strides are expressed in 32-bit words so the result can
 * be consumed directly by typed-array writers.
 */
export type ShaderBlockLayoutEntry = {
  /** Offset in 32-bit words from the start of the block. */
  offset: number;
  /** Occupied size in 32-bit words, excluding external array stride. */
  size: number;
  /** Number of logical scalar components in the declared value. */
  components: number;
  /** Number of matrix columns, or `1` for scalars and vectors. */
  columns: number;
  /** Number of rows in each column, or vector length for vectors. */
  rows: number;
  /** Distance between matrix columns in 32-bit words. */
  columnStride: number;
  /** Canonical shader type after alias resolution. */
  shaderType: VariableShaderType;
  /** Scalar data type used to write the value. */
  type: PrimitiveDataType;
};

/**
 * Options for {@link makeShaderBlockLayout}.
 */
export type ShaderBlockLayoutOptions = {
  /**
   * Packing rules to apply when building the layout.
   *
   * Defaults to `'std140'`.
   */
  format?: 'std140' | 'wgsl-uniform' | 'wgsl-storage';
};

/**
 * Immutable layout metadata for a uniform or storage-style shader block.
 */
export type ShaderBlockLayout = {
  /** Packing rules used when this layout was created. */
  format: 'std140' | 'wgsl-uniform' | 'wgsl-storage';
  /** Exact number of packed bytes required by the block. */
  byteLength: number;
  /** Original composite shader type declarations keyed by top-level field. */
  uniformTypes: Record<string, CompositeShaderType>;
  /** Flattened leaf field layouts keyed by field path. */
  fields: Record<string, ShaderBlockLayoutEntry>;
};

/**
 * Builds a deterministic shader-block layout from composite shader type declarations.
 *
 * The returned value is pure layout metadata. It records the packed field
 * offsets and exact packed byte length, but it does not allocate buffers or
 * serialize values.
 */
export function makeShaderBlockLayout(
  uniformTypes: Readonly<Record<string, CompositeShaderType>>,
  options: ShaderBlockLayoutOptions = {}
): ShaderBlockLayout {
  const copiedUniformTypes = {...uniformTypes};
  const format = options.format ?? 'std140';
  const fields: Record<string, ShaderBlockLayoutEntry> = {};

  let size = 0;
  for (const [key, uniformType] of Object.entries(copiedUniformTypes)) {
    size = addToLayout(fields, key, uniformType, size, format);
  }

  size = alignTo(size, getTypeAlignment(copiedUniformTypes, format));

  return {
    format,
    byteLength: size * 4,
    uniformTypes: copiedUniformTypes,
    fields
  };
}

/**
 * Returns the layout metadata for a scalar, vector, or matrix leaf type.
 *
 * The result includes both the occupied size in 32-bit words and the alignment
 * requirement that must be applied before placing the value in a shader block.
 */
export function getLeafLayoutInfo(
  type: VariableShaderType,
  format: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): Omit<ShaderBlockLayoutEntry, 'offset'> & {alignment: 1 | 2 | 4} {
  const resolvedType = resolveVariableShaderTypeAlias(type);
  const decodedType = getVariableShaderTypeInfo(resolvedType);
  const matrixMatch = /^mat(\d)x(\d)<.+>$/.exec(resolvedType);

  if (matrixMatch) {
    const columns = Number(matrixMatch[1]);
    const rows = Number(matrixMatch[2]);
    const columnInfo = getVectorLayoutInfo(
      rows as 2 | 3 | 4,
      resolvedType,
      decodedType.type,
      format
    );
    const columnStride = getMatrixColumnStride(columnInfo.size, columnInfo.alignment, format);

    return {
      alignment: columnInfo.alignment,
      size: columns * columnStride,
      components: columns * rows,
      columns,
      rows,
      columnStride,
      shaderType: resolvedType,
      type: decodedType.type
    };
  }

  const vectorMatch = /^vec(\d)<.+>$/.exec(resolvedType);
  if (vectorMatch) {
    return getVectorLayoutInfo(
      Number(vectorMatch[1]) as 2 | 3 | 4,
      resolvedType,
      decodedType.type,
      format
    );
  }

  return {
    alignment: 1,
    size: 1,
    components: 1,
    columns: 1,
    rows: 1,
    columnStride: 1,
    shaderType: resolvedType,
    type: decodedType.type
  };
}

/**
 * Type guard for composite struct declarations.
 */
export function isCompositeShaderTypeStruct(
  value: CompositeShaderType
): value is Record<string, CompositeShaderType> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Recursively adds a composite type to the flattened field map.
 *
 * @returns The next free 32-bit-word offset after the inserted type.
 */
function addToLayout(
  fields: Record<string, ShaderBlockLayoutEntry>,
  name: string,
  type: CompositeShaderType,
  offset: number,
  format: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): number {
  if (typeof type === 'string') {
    const info = getLeafLayoutInfo(type, format);
    const alignedOffset = alignTo(offset, info.alignment);
    fields[name] = {
      offset: alignedOffset,
      ...info
    };
    return alignedOffset + info.size;
  }

  if (Array.isArray(type)) {
    if (Array.isArray(type[0])) {
      throw new Error(`Nested arrays are not supported for ${name}`);
    }

    const elementType = type[0] as CompositeShaderType;
    const length = type[1] as number;
    const stride = getArrayStride(elementType, format);
    const arrayOffset = alignTo(offset, getTypeAlignment(type, format));

    for (let i = 0; i < length; i++) {
      addToLayout(fields, `${name}[${i}]`, elementType, arrayOffset + i * stride, format);
    }
    return arrayOffset + stride * length;
  }

  if (isCompositeShaderTypeStruct(type)) {
    const structAlignment = getTypeAlignment(type, format);
    let structOffset = alignTo(offset, structAlignment);
    for (const [memberName, memberType] of Object.entries(type)) {
      structOffset = addToLayout(fields, `${name}.${memberName}`, memberType, structOffset, format);
    }
    return alignTo(structOffset, structAlignment);
  }

  throw new Error(`Unsupported CompositeShaderType for ${name}`);
}

/**
 * Returns the occupied size of a composite type in 32-bit words.
 */
function getTypeSize(
  type: CompositeShaderType,
  format: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): number {
  if (typeof type === 'string') {
    return getLeafLayoutInfo(type, format).size;
  }

  if (Array.isArray(type)) {
    const elementType = type[0] as CompositeShaderType;
    const length = type[1] as number;

    if (Array.isArray(elementType)) {
      throw new Error('Nested arrays are not supported');
    }

    return getArrayStride(elementType, format) * length;
  }

  let size = 0;
  for (const memberType of Object.values(type)) {
    const compositeMemberType = memberType as CompositeShaderType;
    size = alignTo(size, getTypeAlignment(compositeMemberType, format));
    size += getTypeSize(compositeMemberType, format);
  }

  return alignTo(size, getTypeAlignment(type, format));
}

/**
 * Returns the required alignment of a composite type in 32-bit words.
 */
function getTypeAlignment(
  type: CompositeShaderType,
  format: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): 1 | 2 | 4 {
  if (typeof type === 'string') {
    return getLeafLayoutInfo(type, format).alignment;
  }

  if (Array.isArray(type)) {
    const elementType = type[0] as CompositeShaderType;
    const elementAlignment = getTypeAlignment(elementType, format);
    return uses16ByteArrayAlignment(format)
      ? (Math.max(elementAlignment, 4) as 1 | 2 | 4)
      : elementAlignment;
  }

  let maxAlignment: 1 | 2 | 4 = 1;
  for (const memberType of Object.values(type)) {
    const memberAlignment = getTypeAlignment(memberType as CompositeShaderType, format);
    maxAlignment = Math.max(maxAlignment, memberAlignment) as 1 | 2 | 4;
  }

  return uses16ByteStructAlignment(format)
    ? (Math.max(maxAlignment, 4) as 1 | 2 | 4)
    : maxAlignment;
}

/**
 * Returns the layout metadata for a vector leaf type.
 */
function getVectorLayoutInfo(
  components: 2 | 3 | 4,
  shaderType: VariableShaderType,
  type: PrimitiveDataType,
  format: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): Omit<ShaderBlockLayoutEntry, 'offset'> & {alignment: 1 | 2 | 4} {
  return {
    alignment: components === 2 ? 2 : 4,
    size: components === 3 ? 3 : components,
    components,
    columns: 1,
    rows: components,
    columnStride: components === 3 ? 3 : components,
    shaderType,
    type
  };
}

/**
 * Returns the stride of an array element in 32-bit words.
 *
 * This includes any format-specific padding between adjacent array elements.
 */
function getArrayStride(
  elementType: CompositeShaderType,
  format: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): number {
  const elementSize = getTypeSize(elementType, format);
  const elementAlignment = getTypeAlignment(elementType, format);
  return getArrayLikeStride(elementSize, elementAlignment, format);
}

/**
 * Returns the common stride rule shared by array-like elements in the target format.
 */
function getArrayLikeStride(
  size: number,
  alignment: 1 | 2 | 4,
  format: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): number {
  return alignTo(size, uses16ByteArrayAlignment(format) ? 4 : alignment);
}

/**
 * Returns the stride of a matrix column in 32-bit words.
 */
function getMatrixColumnStride(
  size: number,
  alignment: 1 | 2 | 4,
  format: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): number {
  return format === 'std140' ? 4 : alignTo(size, alignment);
}

/**
 * Returns `true` when arrays must be rounded up to 16-byte boundaries.
 */
function uses16ByteArrayAlignment(format: 'std140' | 'wgsl-uniform' | 'wgsl-storage'): boolean {
  return format === 'std140' || format === 'wgsl-uniform';
}

/**
 * Returns `true` when structs must be rounded up to 16-byte boundaries.
 */
function uses16ByteStructAlignment(format: 'std140' | 'wgsl-uniform' | 'wgsl-storage'): boolean {
  return format === 'std140' || format === 'wgsl-uniform';
}
