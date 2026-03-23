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
  layout?: 'std140' | 'wgsl-uniform' | 'wgsl-storage';
};

/**
 * Immutable layout metadata for a uniform or storage-style shader block.
 */
export type ShaderBlockLayout = {
  /** Packing rules used when this layout was created. */
  layout: 'std140' | 'wgsl-uniform' | 'wgsl-storage';
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
  const layout = options.layout ?? 'std140';
  const fields: Record<string, ShaderBlockLayoutEntry> = {};

  let size = 0;
  for (const [key, uniformType] of Object.entries(copiedUniformTypes)) {
    size = addToLayout(fields, key, uniformType, size, layout);
  }

  size = alignTo(size, getTypeAlignment(copiedUniformTypes, layout));

  return {
    layout,
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
  layout: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
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
      layout
    );
    const columnStride = getMatrixColumnStride(columnInfo.size, columnInfo.alignment, layout);

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
      layout
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
  layout: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): number {
  if (typeof type === 'string') {
    const info = getLeafLayoutInfo(type, layout);
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
    const stride = getArrayStride(elementType, layout);
    const arrayOffset = alignTo(offset, getTypeAlignment(type, layout));

    for (let i = 0; i < length; i++) {
      addToLayout(fields, `${name}[${i}]`, elementType, arrayOffset + i * stride, layout);
    }
    return arrayOffset + stride * length;
  }

  if (isCompositeShaderTypeStruct(type)) {
    const structAlignment = getTypeAlignment(type, layout);
    let structOffset = alignTo(offset, structAlignment);
    for (const [memberName, memberType] of Object.entries(type)) {
      structOffset = addToLayout(fields, `${name}.${memberName}`, memberType, structOffset, layout);
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
  layout: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): number {
  if (typeof type === 'string') {
    return getLeafLayoutInfo(type, layout).size;
  }

  if (Array.isArray(type)) {
    const elementType = type[0] as CompositeShaderType;
    const length = type[1] as number;

    if (Array.isArray(elementType)) {
      throw new Error('Nested arrays are not supported');
    }

    return getArrayStride(elementType, layout) * length;
  }

  let size = 0;
  for (const memberType of Object.values(type)) {
    const compositeMemberType = memberType as CompositeShaderType;
    size = alignTo(size, getTypeAlignment(compositeMemberType, layout));
    size += getTypeSize(compositeMemberType, layout);
  }

  return alignTo(size, getTypeAlignment(type, layout));
}

/**
 * Returns the required alignment of a composite type in 32-bit words.
 */
function getTypeAlignment(
  type: CompositeShaderType,
  layout: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): 1 | 2 | 4 {
  if (typeof type === 'string') {
    return getLeafLayoutInfo(type, layout).alignment;
  }

  if (Array.isArray(type)) {
    const elementType = type[0] as CompositeShaderType;
    const elementAlignment = getTypeAlignment(elementType, layout);
    return uses16ByteArrayAlignment(layout)
      ? (Math.max(elementAlignment, 4) as 1 | 2 | 4)
      : elementAlignment;
  }

  let maxAlignment: 1 | 2 | 4 = 1;
  for (const memberType of Object.values(type)) {
    const memberAlignment = getTypeAlignment(memberType as CompositeShaderType, layout);
    maxAlignment = Math.max(maxAlignment, memberAlignment) as 1 | 2 | 4;
  }

  return uses16ByteStructAlignment(layout)
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
  layout: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
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
 * This includes any layout-specific padding between adjacent array elements.
 */
function getArrayStride(
  elementType: CompositeShaderType,
  layout: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): number {
  const elementSize = getTypeSize(elementType, layout);
  const elementAlignment = getTypeAlignment(elementType, layout);
  return getArrayLikeStride(elementSize, elementAlignment, layout);
}

/**
 * Returns the common stride rule shared by array-like elements in the target layout.
 */
function getArrayLikeStride(
  size: number,
  alignment: 1 | 2 | 4,
  layout: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): number {
  return alignTo(size, uses16ByteArrayAlignment(layout) ? 4 : alignment);
}

/**
 * Returns the stride of a matrix column in 32-bit words.
 */
function getMatrixColumnStride(
  size: number,
  alignment: 1 | 2 | 4,
  layout: 'std140' | 'wgsl-uniform' | 'wgsl-storage'
): number {
  return layout === 'std140' ? 4 : alignTo(size, alignment);
}

/**
 * Returns `true` when arrays must be rounded up to 16-byte boundaries.
 */
function uses16ByteArrayAlignment(layout: 'std140' | 'wgsl-uniform' | 'wgsl-storage'): boolean {
  return layout === 'std140' || layout === 'wgsl-uniform';
}

/**
 * Returns `true` when structs must be rounded up to 16-byte boundaries.
 */
function uses16ByteStructAlignment(layout: 'std140' | 'wgsl-uniform' | 'wgsl-storage'): boolean {
  return layout === 'std140' || layout === 'wgsl-uniform';
}
