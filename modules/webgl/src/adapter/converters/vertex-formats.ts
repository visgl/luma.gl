// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GL} from '@luma.gl/constants';
import {VertexFormat, VertexType} from '@luma.gl/core';

type GLDataType =
  | GL.UNSIGNED_BYTE
  | GL.BYTE
  | GL.UNSIGNED_SHORT
  | GL.SHORT
  | GL.UNSIGNED_INT
  | GL.INT
  | GL.HALF_FLOAT
  | GL.FLOAT;

/** Get vertex format from GL constants */
export function getVertexFormatFromGL(type: GLDataType, components: 1 | 2 | 3 | 4): VertexFormat {
  const base = getVertexTypeFromGL(type);
  // prettier-ignore
  switch (components) {
    // @ts-expect-error TODO deal with lack of formats
    case 1: return base;
    case 2: return `${base}x2`;
    // @ts-expect-error TODO deal with lack of formats
    case 3: return `${base}x3`;
    case 4: return `${base}x4`;
  }
  // @ts-ignore unreachable
  throw new Error(String(components));
}

/** Get data type from GL constants */
export function getVertexTypeFromGL(type: GLDataType, normalized = false): VertexType {
  // prettier-ignore
  switch (type) {
    // WebGPU does not support normalized 32 bit integer attributes
    case GL.INT: return normalized ? 'sint32' : 'sint32';
    case GL.UNSIGNED_INT: return normalized ? 'uint32' : 'uint32';
    case GL.SHORT: return normalized ? 'sint16' : 'unorm16';
    case GL.UNSIGNED_SHORT: return normalized ? 'uint16' : 'unorm16';
    case GL.BYTE: return normalized ? 'sint8' : 'snorm16';
    case GL.UNSIGNED_BYTE: return normalized ? 'uint8' : 'unorm8';
    case GL.FLOAT: return 'float32';
    case GL.HALF_FLOAT: return 'float16';
  }
  // @ts-ignore unreachable
  throw new Error(String(type));
}

export function getGLFromVertexType(
  dataType: VertexType
):
  | GL.UNSIGNED_BYTE
  | GL.BYTE
  | GL.UNSIGNED_SHORT
  | GL.SHORT
  | GL.UNSIGNED_INT
  | GL.INT
  | GL.HALF_FLOAT
  | GL.FLOAT {
  // prettier-ignore
  switch (dataType) {
    case 'uint8': return GL.UNSIGNED_BYTE;
    case 'sint8': return GL.BYTE;
    case 'unorm8': return GL.UNSIGNED_BYTE;
    case 'snorm8': return GL.BYTE;
    case 'uint16': return GL.UNSIGNED_SHORT;
    case 'sint16': return GL.SHORT;
    case 'unorm16': return GL.UNSIGNED_SHORT;
    case 'snorm16': return GL.SHORT;
    case 'uint32': return GL.UNSIGNED_INT;
    case 'sint32': return GL.INT;
    // WebGPU does not support normalized 32 bit integer attributes
    // case 'unorm32': return GL.UNSIGNED_INT;
    // case 'snorm32': return GL.INT;
    case 'float16': return GL.HALF_FLOAT;
    case 'float32': return GL.FLOAT;
  }
  // @ts-ignore unreachable
  throw new Error(String(dataType));
}
