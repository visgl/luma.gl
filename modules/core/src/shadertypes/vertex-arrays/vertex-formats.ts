// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NormalizedDataType} from '../data-types/data-types';

/*
 */
/**
 * Describes the **memory format** and interpretation (normalization) of a buffer that will be supplied to vertex attributes
 * @note Must be compatible with the AttributeShaderType of the shaders, see documentation.
 * @note This is a superset of WebGPU vertex formats to allow for some flexibility for WebGL only applications
 * @todo Add device.isTextureFormatSupported() method?
 */
export type VertexFormat =
  // 8 bit integers, note that only 16 bit aligned formats are supported in WebGPU (x2 and x4)
  | 'uint8' // Chrome 133+
  | 'uint8x2'
  | 'uint8x4'
  | 'sint8' // Chrome 133+
  | 'sint8x2'
  | 'sint8x4'
  | 'unorm8' // Chrome 133+
  | 'unorm8x2'
  | 'unorm8x3-webgl' // Not in WebGPU
  | 'unorm8x4'
  | 'unorm8x4-bgra' // Chrome 133+
  | 'unorm10-10-10-2' // Chrome 119+
  // | 'snorm-10-10-10-2' // Not in WebGPU, DXD12 doesn't support
  | 'snorm8' // Chrome 133+
  | 'snorm8x2'
  | 'snorm8x3-webgl'
  | 'snorm8x4'
  // 16 bit integers, that only 32 bit aligned formats are supported in WebGPU (x2 and x4)
  | 'uint16' // Chrome 133+
  | 'sint16' // Chrome 133+
  | 'unorm16' // Chrome 133+
  | 'snorm16' // Chrome 133+
  | 'uint16x2'
  | 'uint16x4'
  | 'sint16x2'
  | 'sint16x4'
  | 'unorm16x2'
  | 'unorm16x4'
  | 'snorm16x2'
  | 'snorm16x4'
  // 32 bit integers
  | 'uint32'
  | 'uint32x2'
  | 'uint32x3'
  | 'uint32x4'
  | 'sint32'
  | 'sint32x2'
  | 'sint32x3'
  | 'sint32x4'
  // No normalized 32 bit integers in WebGPU...
  // | 'unorm32'
  // | 'unorm32x2'
  // | 'unorm32x3'
  // | 'unorm32x4'
  // | 'snorm32'
  // | 'snorm32x2'
  // | 'snorm32x3'
  // | 'snorm32x4'
  // floats
  | 'float16' // Chrome 133+
  | 'float16x2'
  | 'float16x4'
  | 'float32'
  | 'float32x2'
  | 'float32x3'
  | 'float32x4';

export type VertexFormatInfo = {
  /** Type of each component */
  type: NormalizedDataType;
  /** Length in bytes */
  byteLength: number;
  /** Number of components per vertex / row */
  components: 1 | 2 | 3 | 4;
  /** Is this an integer format (normalized integer formats are not integer) */
  integer: boolean;
  /** Is this a signed format? */
  signed: boolean;
  /** Is this a normalized format? */
  normalized: boolean;
  /** Is this a bgra format? */
  bgra?: boolean;
  /** Is this a webgl only format? */
  webglOnly?: boolean;
};
