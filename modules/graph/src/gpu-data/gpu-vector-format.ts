// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  AttributeShaderType,
  NormalizedDataType,
  PrimitiveDataType,
  SignedDataType,
  VertexFormat
} from '@luma.gl/core';
import {shaderTypeDecoder, vertexFormatDecoder} from '@luma.gl/core';

/**
 * Variable-length rows of vertex-aligned element values.
 *
 * `vertex-list<float32x3>` means each logical row owns a variable-length list of
 * `float32x3` element values. Offsets and other topology metadata belong to the
 * adapter that produced the vector.
 */
export type VertexList<Format extends VertexFormat = VertexFormat> = `vertex-list<${Format}>`;

/**
 * Variable-length rows of non-vertex element values.
 *
 * `value-list<uint8>` means each logical row owns a variable-length list of
 * `uint8` element values. Offsets and other row metadata belong to the producer
 * that created the vector.
 */
export type ValueList<Format extends VertexFormat = VertexFormat> = `value-list<${Format}>`;

/**
 * Fixed-length rows of element values consumed through GPU storage bindings.
 *
 * `fixed-size-list<float32,768>` stores exactly 768 `float32` elements in every
 * logical row. The list describes physical memory, not a shader vertex format.
 */
export type FixedSizeList<
  Format extends VertexFormat = VertexFormat,
  Size extends number = number
> = `fixed-size-list<${Format},${Size}>`;

/**
 * Memory-layout string used by GPUVector.
 *
 * Fixed formats reuse core `VertexFormat` strings. Variable-length
 * vertex-aligned formats use `vertex-list<${VertexFormat}>`; other
 * variable-length values use `value-list<${VertexFormat}>`. Storage-oriented
 * fixed-length rows use `fixed-size-list<${VertexFormat},${number}>`.
 */
export type GPUVectorFormat = VertexFormat | VertexList | ValueList | FixedSizeList;

/** Decoded memory-layout information for a GPUVector format string. */
export type GPUVectorFormatInfo = {
  /** Original GPUVector format string. */
  format: GPUVectorFormat;
  /** Element memory format. For fixed vectors this is the same as `format`. */
  elementFormat: VertexFormat;
  /** Whether this vector stores row-offset vertex lists. */
  vertexList: boolean;
  /** Whether this vector stores row-offset non-vertex value lists. */
  valueList: boolean;
  /** Whether every logical row contains a fixed number of storage elements. */
  fixedSizeList: boolean;
  /** Number of elements in each fixed-size-list row, when applicable. */
  listSize?: number;
  /** Component memory data type. */
  type: NormalizedDataType;
  /** Component memory data type without normalization. */
  signedDataType: SignedDataType;
  /** Primitive value type visible to compatible shader attributes. */
  primitiveType: PrimitiveDataType;
  /** Number of scalar components per fixed row or list element. */
  components: 1 | 2 | 3 | 4;
  /** Bytes occupied by one scalar or vector element. */
  elementByteLength: number;
  /** Bytes occupied by one fixed row, or by one variable-length list element. */
  byteLength: number;
  /** Whether shader-visible values are integer values. */
  integer: boolean;
  /** Whether memory values are signed. */
  signed: boolean;
  /** Whether integer memory values are normalized to floats. */
  normalized: boolean;
  /** Whether the element format is WebGL-only. */
  webglOnly?: boolean;
};

const VERTEX_LIST_FORMAT_REGEXP = /^vertex-list<([^<>]+)>$/;
const VALUE_LIST_FORMAT_REGEXP = /^value-list<([^<>]+)>$/;
const FIXED_SIZE_LIST_FORMAT_REGEXP = /^fixed-size-list<([^<>,]+),([1-9][0-9]*)>$/;

/** Returns true when a GPUVector format describes row-offset vertex lists. */
export function isVertexListGPUVectorFormat(format: string): format is VertexList {
  return VERTEX_LIST_FORMAT_REGEXP.test(format);
}

/** Returns true when a GPUVector format describes row-offset non-vertex value lists. */
export function isValueListGPUVectorFormat(format: string): format is ValueList {
  return VALUE_LIST_FORMAT_REGEXP.test(format);
}

/** Returns true when a GPUVector format describes canonical fixed-length rows. */
export function isFixedSizeListGPUVectorFormat(format: string): format is FixedSizeList {
  return Boolean(getFixedSizeListFormatParts(format));
}

/** Returns the fixed element memory format for fixed and variable-length vectors. */
export function getGPUVectorElementFormat(format: GPUVectorFormat): VertexFormat {
  const vertexListMatch = VERTEX_LIST_FORMAT_REGEXP.exec(format);
  const valueListMatch = VALUE_LIST_FORMAT_REGEXP.exec(format);
  const fixedSizeListFormat = getFixedSizeListFormatParts(format);
  const elementFormat = (fixedSizeListFormat?.elementFormat ??
    vertexListMatch?.[1] ??
    valueListMatch?.[1] ??
    format) as VertexFormat;
  try {
    vertexFormatDecoder.getVertexFormatInfo(elementFormat);
  } catch {
    throw new Error(`Unsupported GPUVector format ${format}`);
  }
  return elementFormat;
}

/** Decodes one GPUVector memory-layout string. */
export function getGPUVectorFormatInfo(format: GPUVectorFormat): GPUVectorFormatInfo {
  const elementFormat = getGPUVectorElementFormat(format);
  const vertexList = isVertexListGPUVectorFormat(format);
  const valueList = isValueListGPUVectorFormat(format);
  const fixedSizeListFormat = getFixedSizeListFormatParts(format);
  const vertexFormatInfo = vertexFormatDecoder.getVertexFormatInfo(elementFormat);
  const byteLength = vertexFormatInfo.byteLength * (fixedSizeListFormat?.listSize ?? 1);
  if (!Number.isSafeInteger(byteLength)) {
    throw new Error(`Unsupported GPUVector format ${format}`);
  }
  const type = vertexFormatInfo.type;
  const normalized = vertexFormatInfo.normalized;
  const primitiveType = getPrimitiveDataType(type, normalized);

  return {
    format,
    elementFormat,
    vertexList,
    valueList,
    fixedSizeList: Boolean(fixedSizeListFormat),
    ...(fixedSizeListFormat ? {listSize: fixedSizeListFormat.listSize} : {}),
    type,
    signedDataType: getSignedDataType(elementFormat, type),
    primitiveType,
    components: vertexFormatInfo.components,
    elementByteLength: vertexFormatInfo.byteLength,
    byteLength,
    integer: vertexFormatInfo.integer,
    signed: vertexFormatInfo.signed,
    normalized,
    ...(vertexFormatInfo.webglOnly ? {webglOnly: true} : {})
  };
}

/** Returns whether one GPUVector memory format can feed one shader attribute type. */
export function isGPUVectorFormatCompatibleWithShaderType(
  format: GPUVectorFormat,
  shaderType: AttributeShaderType
): boolean {
  const formatInfo = getGPUVectorFormatInfo(format);
  if (formatInfo.fixedSizeList) {
    return false;
  }
  const shaderTypeInfo = shaderTypeDecoder.getAttributeShaderTypeInfo(shaderType);

  if (formatInfo.components !== shaderTypeInfo.components) {
    return false;
  }

  switch (shaderTypeInfo.primitiveType) {
    case 'f32':
      return formatInfo.primitiveType === 'f32' || formatInfo.primitiveType === 'f16';
    case 'f16':
      return formatInfo.primitiveType === 'f16';
    case 'i32':
      return formatInfo.primitiveType === 'i32';
    case 'u32':
      return formatInfo.primitiveType === 'u32';
    default:
      return false;
  }
}

function getFixedSizeListFormatParts(
  format: string
): {elementFormat: string; listSize: number} | undefined {
  const fixedSizeListMatch = FIXED_SIZE_LIST_FORMAT_REGEXP.exec(format);
  if (!fixedSizeListMatch) {
    return undefined;
  }
  const listSize = Number(fixedSizeListMatch[2]);
  if (!Number.isSafeInteger(listSize)) {
    return undefined;
  }
  const elementFormat = fixedSizeListMatch[1];
  try {
    const elementFormatInfo = vertexFormatDecoder.getVertexFormatInfo(
      elementFormat as VertexFormat
    );
    if (
      !Number.isSafeInteger(listSize * elementFormatInfo.components) ||
      !Number.isSafeInteger(listSize * elementFormatInfo.byteLength)
    ) {
      return undefined;
    }
  } catch {
    return undefined;
  }
  return {elementFormat, listSize};
}

function getPrimitiveDataType(type: NormalizedDataType, normalized: boolean): PrimitiveDataType {
  if (normalized) {
    return 'f32';
  }
  switch (type) {
    case 'float32':
      return 'f32';
    case 'float16':
      return 'f16';
    case 'uint8':
    case 'uint16':
    case 'uint32':
      return 'u32';
    case 'sint8':
    case 'sint16':
    case 'sint32':
      return 'i32';
    default:
      throw new Error(`Unsupported GPUVector component type ${type}`);
  }
}

function getSignedDataType(elementFormat: VertexFormat, type: NormalizedDataType): SignedDataType {
  if (elementFormat === 'unorm10-10-10-2') {
    return 'uint32';
  }

  switch (type) {
    case 'unorm8':
      return 'uint8';
    case 'snorm8':
      return 'sint8';
    case 'unorm16':
      return 'uint16';
    case 'snorm16':
      return 'sint16';
    default:
      return type;
  }
}
