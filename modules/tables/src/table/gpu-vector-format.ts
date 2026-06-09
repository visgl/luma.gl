// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
 * Memory-layout string used by GPUVector.
 *
 * Fixed formats reuse core `VertexFormat` strings. Variable-length
 * vertex-aligned formats use `vertex-list<${VertexFormat}>`; other
 * variable-length values use `value-list<${VertexFormat}>`.
 */
export type GPUVectorFormat = VertexFormat | VertexList | ValueList;

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
  /** Component memory data type. */
  type: NormalizedDataType;
  /** Component memory data type without normalization. */
  signedDataType: SignedDataType;
  /** Primitive value type visible to compatible shader attributes. */
  primitiveType: PrimitiveDataType;
  /** Number of scalar components per fixed row or list element. */
  components: 1 | 2 | 3 | 4;
  /** Bytes occupied by one fixed row or list element. */
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

/** Returns true when a GPUVector format describes row-offset vertex lists. */
export function isVertexListGPUVectorFormat(format: string): format is VertexList {
  return VERTEX_LIST_FORMAT_REGEXP.test(format);
}

/** Returns true when a GPUVector format describes row-offset non-vertex value lists. */
export function isValueListGPUVectorFormat(format: string): format is ValueList {
  return VALUE_LIST_FORMAT_REGEXP.test(format);
}

/** Returns the fixed element memory format for fixed and variable-length vectors. */
export function getGPUVectorElementFormat(format: GPUVectorFormat): VertexFormat {
  const vertexListMatch = VERTEX_LIST_FORMAT_REGEXP.exec(format);
  const valueListMatch = VALUE_LIST_FORMAT_REGEXP.exec(format);
  const elementFormat = (vertexListMatch?.[1] ?? valueListMatch?.[1] ?? format) as VertexFormat;
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
  const vertexFormatInfo = vertexFormatDecoder.getVertexFormatInfo(elementFormat);
  const type = vertexFormatInfo.type;
  const normalized = vertexFormatInfo.normalized;
  const primitiveType = getPrimitiveDataType(type, normalized);

  return {
    format,
    elementFormat,
    vertexList,
    valueList,
    type,
    signedDataType: getSignedDataType(elementFormat, type),
    primitiveType,
    components: vertexFormatInfo.components,
    byteLength: vertexFormatInfo.byteLength,
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
