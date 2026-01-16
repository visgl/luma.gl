// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '../../types';
import type {NormalizedDataType, PrimitiveDataType, SignedDataType} from '../data-types/data-types';
import type {VertexFormat, VertexFormatInfo} from './vertex-formats';
import {getDataTypeInfo, getDataType, getNormalizedDataType} from '../data-types/decode-data-types';

/**
 * Decodes a vertex format, returning type, components, byte  length and flags (integer, signed, normalized)
 */
export function getVertexFormatInfo(format: VertexFormat): VertexFormatInfo {
  // Strip the -webgl ending if present
  let webglOnly: boolean | undefined;
  if (format.endsWith('-webgl')) {
    format.replace('-webgl', '');
    webglOnly = true;
  }
  // split components from type
  const [type_, count] = format.split('x');
  const type = type_ as NormalizedDataType;
  const components = (count ? parseInt(count) : 1) as 1 | 2 | 3 | 4;
  // decode the type
  const decodedType = getDataTypeInfo(type);
  const result: VertexFormatInfo = {
    type,
    components,
    byteLength: decodedType.byteLength * components,
    integer: decodedType.integer,
    signed: decodedType.signed,
    normalized: decodedType.normalized
  };
  if (webglOnly) {
    result.webglOnly = true;
  }
  return result;
}

/** Build a vertex format from a signed data type and a component */
export function makeVertexFormat(
  signedDataType: SignedDataType,
  components: 1 | 2 | 3 | 4,
  normalized?: boolean
): VertexFormat {
  const dataType: NormalizedDataType = normalized
    ? getNormalizedDataType(signedDataType)
    : signedDataType;

  switch (dataType) {
    // Special cases for WebGL (not supported on WebGPU)
    // 8-bit formats: WebGPU requires 16-bit alignment, but WebGL supports x3
    case 'unorm8':
      if (components === 1) {
        return 'unorm8';
      }
      if (components === 3) {
        return 'unorm8x3-webgl';
      }
      return `${dataType}x${components}`;

    case 'snorm8':
      if (components === 1) {
        return 'snorm8';
      }
      if (components === 3) {
        return 'snorm8x3-webgl';
      }
      return `${dataType}x${components}`;

    case 'uint8':
    case 'sint8':
      // WebGPU 8 bit formats must be aligned to 16 bit boundaries
      if (components === 1 || components === 3) {
        throw new Error(`size: ${components}`);
      }
      return `${dataType}x${components}`;

    // 16-bit formats: WebGPU requires 32-bit alignment, but WebGL supports x3
    case 'uint16':
      if (components === 1) {
        return 'uint16';
      }
      if (components === 3) {
        return 'uint16x3-webgl';
      }
      return `${dataType}x${components}`;

    case 'sint16':
      if (components === 1) {
        return 'sint16';
      }
      if (components === 3) {
        return 'sint16x3-webgl';
      }
      return `${dataType}x${components}`;

    case 'unorm16':
      if (components === 1) {
        return 'unorm16';
      }
      if (components === 3) {
        return 'unorm16x3-webgl';
      }
      return `${dataType}x${components}`;

    case 'snorm16':
      if (components === 1) {
        return 'snorm16';
      }
      if (components === 3) {
        return 'snorm16x3-webgl';
      }
      return `${dataType}x${components}`;

    case 'float16':
      // WebGPU 16 bit formats must be aligned to 32 bit boundaries
      if (components === 1 || components === 3) {
        throw new Error(`size: ${components}`);
      }
      return `${dataType}x${components}`;

    default:
      return components === 1 ? dataType : `${dataType}x${components}`;
  }
}

/** Get the vertex format for an attribute with TypedArray and size */
export function getVertexFormatFromAttribute(
  typedArray: TypedArray,
  size: number,
  normalized?: boolean
): VertexFormat {
  if (!size || size > 4) {
    throw new Error(`size ${size}`);
  }

  const components = size as 1 | 2 | 3 | 4;
  const signedDataType = getDataType(typedArray);
  return makeVertexFormat(signedDataType, components, normalized);
}

/** Return a "default" vertex format for a certain shader data type
 The simplest vertex format that matches the shader attribute's data type */

export function getCompatibleVertexFormat(opts: {
  primitiveType: PrimitiveDataType;
  components: 1 | 2 | 3 | 4;
}): VertexFormat {
  let vertexType: NormalizedDataType;
  switch (opts.primitiveType) {
    case 'f32':
      vertexType = 'float32';
      break;
    case 'i32':
      vertexType = 'sint32';
      break;
    case 'u32':
      vertexType = 'uint32';
      break;
    case 'f16':
      return opts.components <= 2 ? 'float16x2' : 'float16x4';
  }

  // TODO logic does not work for float16
  if (opts.components === 1) {
    return vertexType;
  }
  return `${vertexType}x${opts.components}`;
}
