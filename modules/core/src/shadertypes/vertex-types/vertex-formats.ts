// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  DataTypeIsIntegerT,
  DataTypeIsNormalizedT,
  DataTypeIsSignedT
} from '../data-types/data-types';

/**
 * Describes the **memory format** and interpretation (normalization) of a buffer that will be supplied to vertex attributes
 * @note Must be compatible with the AttributeShaderType of the shaders, see documentation.
 * @note This is a superset of WebGPU vertex formats to allow for some flexibility for WebGL only applications
 * @todo Add device.isVertexFormatSupported() method?
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

/**
 * @type Information about a vertex format
 */
export type VertexFormatInfo<T extends VertexFormat = VertexFormat> = {
  /** Type of each component */
  type: VertexFormatDataTypeT<T>;
  /** Number of components per vertex / row */
  components: VertexFormatComponentsT<T>;
  /** Is this an integer format (normalized integer formats are not integer) */
  integer: DataTypeIsIntegerT<VertexFormatDataTypeT<T>>;
  /** Is this a signed format? */
  signed: DataTypeIsSignedT<VertexFormatDataTypeT<T>>;
  /** Is this a normalized format? */
  normalized: DataTypeIsNormalizedT<VertexFormatDataTypeT<T>>;
  /** Length in bytes */
  byteLength: number;
  /** Is this a bgra format? */
  bgra?: boolean;
  /** Is this a webgl only format? */
  webglOnly?: boolean;
};

/** @type the NormalizedDataType of the components in a VertexFormat */
export type VertexFormatDataTypeT<T extends VertexFormat> = T extends VertexFormatUint8
  ? 'uint8'
  : T extends VertexFormatSint8
    ? 'sint8'
    : T extends VertexFormatUnorm8
      ? 'unorm8'
      : T extends VertexFormatSnorm8
        ? 'snorm8'
        : T extends VertexFormatUint16
          ? 'uint16'
          : T extends VertexFormatSint16
            ? 'sint16'
            : T extends VertexFormatUnorm16
              ? 'unorm16'
              : T extends VertexFormatSnorm16
                ? 'snorm16'
                : T extends VertexFormatUint32
                  ? 'uint32'
                  : T extends VertexFormatSint32
                    ? 'sint32'
                    : T extends VertexFormatFloat16
                      ? 'float16'
                      : T extends VertexFormatFloat32
                        ? 'float32'
                        : never;

/** @type number - the number of components in a VertexFormat */
export type VertexFormatComponentsT<T extends VertexFormat> = T extends VertexFormat2Components
  ? 2
  : T extends VertexFormat3Components
    ? 3
    : T extends VertexFormat4Components
      ? 4
      : 1;

// Helper types for the above

type VertexFormatUint8 = 'uint8' | 'uint8x2' | 'uint8x4';
type VertexFormatSint8 = 'sint8' | 'sint8x2' | 'sint8x4';
type VertexFormatUnorm8 =
  | 'unorm8'
  | 'unorm8x2'
  | 'unorm8x3-webgl'
  | 'unorm8x4'
  | 'unorm8x4-bgra'
  | 'unorm10-10-10-2';
type VertexFormatSnorm8 = 'snorm8' | 'snorm8x2' | 'snorm8x3-webgl' | 'snorm8x4';
type VertexFormatUint16 = 'uint16' | 'uint16x2' | 'uint16x4';
type VertexFormatSint16 = 'sint16' | 'sint16x2' | 'sint16x4';
type VertexFormatUnorm16 = 'unorm16' | 'unorm16x2' | 'unorm16x4';
type VertexFormatSnorm16 = 'snorm16' | 'snorm16x2' | 'snorm16x4';
type VertexFormatUint32 = 'uint32' | 'uint32x2' | 'uint32x3' | 'uint32x4';
type VertexFormatSint32 = 'sint32' | 'sint32x2' | 'sint32x3' | 'sint32x4';
type VertexFormatFloat16 = 'float16' | 'float16x2' | 'float16x4';
type VertexFormatFloat32 = 'float32' | 'float32x2' | 'float32x3' | 'float32x4';

type VertexFormat2Components =
  | 'uint8x2'
  | 'sint8x2'
  | 'unorm8x2'
  | 'snorm8x2'
  | 'uint16x2'
  | 'sint16x2'
  | 'unorm16x2'
  | 'snorm16x2'
  | 'uint32x2'
  | 'sint32x2'
  | 'float16x2'
  | 'float32x2';
type VertexFormat3Components = 'unorm8x3-webgl' | 'uint32x3' | 'sint32x3' | 'float32x3';
type VertexFormat4Components =
  | 'uint8x4'
  | 'sint8x4'
  | 'unorm8x4'
  | 'unorm8x4-bgra'
  | 'unorm10-10-10-2'
  | 'snorm8x4'
  | 'uint16x4'
  | 'sint16x4'
  | 'unorm16x4'
  | 'snorm16x4'
  | 'uint32x4'
  | 'sint32x4'
  | 'float16x4'
  | 'float32x4';
