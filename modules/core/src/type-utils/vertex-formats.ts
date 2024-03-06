// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Basic data types signed and unsigned integers, and floats, of varying sizes */
export type DataType =
  | 'uint8'
  | 'sint8'
  | 'uint16'
  | 'sint16'
  | 'uint32'
  | 'sint32'
  | 'float16'
  | 'float32';

/** Vertex and Pixel data types. Include normalized integers */
export type NormalizedDataType =
  | 'uint8'
  | 'sint8'
  | 'unorm8'
  | 'snorm8'
  | 'uint16'
  | 'sint16'
  | 'unorm16'
  | 'snorm16'
  | 'uint32'
  | 'sint32'
  // WebGPU does not support normalized 32 bit integer attributes...
  // | 'unorm32'
  // | 'snorm32'
  | 'float32'
  | 'float16';

/** Describes the type (without number of components) of a vertex format */
export type VertexType = NormalizedDataType;

/**
 * Describes the memory format of a buffer that will be supplied to vertex attributes
 * @note Must be compatible with the ShaderAttributeType of the shaders, see documentation.
 * @note This is a superset of WebGPU vertex formats to allow foe some flexibility for WebGL only applications
 * @todo Add device.isTextureFormatSupported() method?
 */
export type VertexFormat =
  // 8 bit integers, note that only 16 bit aligned formats are supported in WebGPU (x2 and x4)
  | 'uint8x2'
  | 'uint8x4'
  | 'sint8x2'
  | 'sint8x4'
  | 'unorm8-webgl'
  | 'unorm8x2'
  | 'unorm8x3-webgl'
  | 'unorm8x4'
  | 'snorm8-webgl'
  | 'snorm8x2'
  | 'snorm8x3-webgl'
  | 'snorm8x4'
  // 16 bit integers, note that only 32 bit aligned formats are supported in WebGPU (x2 and x4)
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
  | 'float16x2'
  | 'float16x4'
  | 'float32'
  | 'float32x2'
  | 'float32x3'
  | 'float32x4';
