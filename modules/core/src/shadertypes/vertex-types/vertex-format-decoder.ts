// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '../../types';
import type {
  DataTypeInfo,
  NormalizedDataType,
  PrimitiveDataType,
  SignedDataType
} from '../data-types/data-types';
import type {VertexFormat, VertexFormatInfo} from './vertex-formats';
import {dataTypeDecoder} from '../data-types/data-type-decoder';

export class VertexFormatDecoder {
  /**
   * Decodes a vertex format, returning type, components, byte  length and flags (integer, signed, normalized)
   */
  getVertexFormatInfo<T extends VertexFormat = VertexFormat>(format: T): VertexFormatInfo<T> {
    if (format === 'unorm10-10-10-2') {
      return {
        type: 'unorm8',
        components: 4,
        byteLength: 4,
        integer: false,
        signed: false,
        normalized: true
      } as VertexFormatInfo<T>;
    }

    let normalizedFormat = format === 'unorm8x4-bgra' ? 'unorm8x4' : (format as string);
    let webglOnly: boolean | undefined;
    if (normalizedFormat.endsWith('-webgl')) {
      normalizedFormat = normalizedFormat.slice(0, -'-webgl'.length);
      webglOnly = true;
    }

    const formatParts = normalizedFormat.split('x');
    if (formatParts.length > 2) {
      throw new Error(`Unsupported vertex format: ${format}`);
    }
    const [typeString, componentString] = formatParts;
    const type = typeString as NormalizedDataType;
    const components = getVertexFormatComponents(format, componentString);
    const decodedType = getVertexFormatDataTypeInfo(format, type);
    let expectedFormat: VertexFormat;
    try {
      expectedFormat = webglOnly
        ? getWebGLOnlyVertexFormat(format, type, components)
        : this.makeVertexFormat(decodedType.signedType, components, decodedType.normalized);
    } catch {
      throw new Error(`Unsupported vertex format: ${format}`);
    }
    if (expectedFormat !== (webglOnly ? format : normalizedFormat)) {
      throw new Error(`Unsupported vertex format: ${format}`);
    }
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
    return result as VertexFormatInfo<T>;
  }

  /** Build a vertex format from a signed data type and a component */
  makeVertexFormat(
    signedDataType: SignedDataType,
    components: 1 | 2 | 3 | 4,
    normalized?: boolean
  ): VertexFormat {
    const dataType: NormalizedDataType = normalized
      ? dataTypeDecoder.getNormalizedDataType(signedDataType)
      : signedDataType;

    switch (dataType) {
      // Special cases for WebGL-only x3 formats that WebGPU does not support.
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
        // WebGPU does not support 3-component 8 bit formats.
        if (components === 3) {
          throw new Error(`size: ${components}`);
        }
        return components === 1 ? dataType : `${dataType}x${components}`;

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
        // WebGPU does not support 3-component float16 formats.
        if (components === 3) {
          throw new Error(`size: ${components}`);
        }
        return components === 1 ? dataType : `${dataType}x${components}`;

      default:
        return components === 1 ? dataType : `${dataType}x${components}`;
    }
  }

  /** Get the vertex format for an attribute with TypedArray and size */
  getVertexFormatFromAttribute(
    typedArray: TypedArray,
    size: number,
    normalized?: boolean
  ): VertexFormat {
    if (!size || size > 4) {
      throw new Error(`size ${size}`);
    }

    const components = size as 1 | 2 | 3 | 4;
    const signedDataType = dataTypeDecoder.getDataType(typedArray);
    return this.makeVertexFormat(signedDataType, components, normalized);
  }

  /**
   * Return a "default" vertex format for a certain shader data type
   * The simplest vertex format that matches the shader attribute's data type
   */

  getCompatibleVertexFormat(opts: {
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
}

/** Decoder for luma.gl vertex types */
export const vertexFormatDecoder = new VertexFormatDecoder();

function getVertexFormatDataTypeInfo(format: string, type: NormalizedDataType): DataTypeInfo {
  try {
    return dataTypeDecoder.getDataTypeInfo(type);
  } catch {
    throw new Error(`Unsupported vertex format: ${format}`);
  }
}

function getVertexFormatComponents(
  format: string,
  componentString: string | undefined
): 1 | 2 | 3 | 4 {
  if (!componentString) {
    return 1;
  }

  const components = Number(componentString);
  if (components === 2 || components === 3 || components === 4) {
    return components;
  }
  throw new Error(`Unsupported vertex format: ${format}`);
}

function getWebGLOnlyVertexFormat(
  format: string,
  type: NormalizedDataType,
  components: 1 | 2 | 3 | 4
): VertexFormat {
  if (components !== 3) {
    throw new Error(`Unsupported vertex format: ${format}`);
  }

  switch (type) {
    case 'uint8':
    case 'sint8':
    case 'unorm8':
    case 'snorm8':
    case 'uint16':
    case 'sint16':
    case 'unorm16':
    case 'snorm16':
      return `${type}x3-webgl`;
    default:
      throw new Error(`Unsupported vertex format: ${format}`);
  }
}
