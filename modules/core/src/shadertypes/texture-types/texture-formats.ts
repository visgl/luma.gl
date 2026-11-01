// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  TextureFormat,
  TextureFormatUnorm8,
  TextureFormatSnorm8,
  TextureFormatUint8,
  TextureFormatSint8,
  TextureFormatUnorm16,
  TextureFormatSnorm16,
  TextureFormatUint16,
  TextureFormatSint16,
  TextureFormatFloat16,
  TextureFormatUint32,
  TextureFormatSint32,
  TextureFormatFloat32,
  TextureFormatPacked16,
  TextureFormatPacked32,
  TextureFormatCompressed,
  TextureFormatDepthStencil
} from '@luma.gl/shaders/types';

import type {
  NormalizedDataType,
  TypedArrayConstructorT,
  NormalizedTypedArrayConstructorT
} from '../data-types/data-types';

/** Information about the structure of a texture format */
export type TextureFormatInfo = {
  /** The format that is described */
  format: TextureFormat;
  /** Color or depth stencil attachment formats */
  attachment?: 'color' | 'depth' | 'stencil' | 'depth-stencil';
  /** String describing which channels this texture has */
  channels: 'r' | 'rg' | 'rgb' | 'rgba' | 'bgra';
  /** Number of components (corresponds to channels string) */
  components: 1 | 2 | 3 | 4;
  /** What is the data type of each component */
  dataType?: NormalizedDataType;
  /** Number of bytes per pixel */
  bytesPerPixel: number;
  /** Compressed formats only: Number of bytes per block */
  bytesPerBlock?: number;
  /** Number of bits per channel (may be unreliable for packed formats) */
  bitsPerChannel: [number, number, number, number];
  /** If this is a packed data type */
  packed?: boolean;
  /** SRGB texture format? */
  srgb?: boolean;
  /** WebGL specific texture format? */
  webgl?: boolean;
  /** Is this an integer or floating point format? */
  integer: boolean;
  /** Is this a signed or unsigned format? */
  signed: boolean;
  /** Is this a normalized integer format? */
  normalized: boolean;
  /** Is this a compressed texture format */
  compressed?: boolean;
  /** Compressed formats only: Block size for ASTC formats (texture width must be a multiple of this value) */
  blockWidth?: number;
  /** Compressed formats only: Block size for ASTC formats (texture height must be a multiple of this value) */
  blockHeight?: number;
};

/**
 * Texture format capabilities.
 * @note Not directly usable. Can contain TextureFeature strings that need to be checked against a specific device.
 */
export type TextureFormatCapabilities = {
  format: TextureFormat;
  /** Can the format be created */
  create: TextureFeature | boolean;
  /** If a feature string, the specified device feature determines if format is renderable. */
  render: TextureFeature | boolean;
  /** If a feature string, the specified device feature determines if format is filterable. */
  filter: TextureFeature | boolean;
  /** If a feature string, the specified device feature determines if format is blendable. */
  blend: TextureFeature | boolean;
  /** If a feature string, the specified device feature determines if format is storeable. */
  store: TextureFeature | boolean;
};

/**
 * Memory layout for reading/writing data to a texture's memory.
 *
 * @note Due to alignment, GPU texture data is typically not contiguous.
 *
 * @note  GPU texure data must be accessed according to this layout.
 * - On CPU, only the range of rows that are actually read or written need to be allocated.
 * - However, space for the full, padded/aligned rows must be allocated in the buffer,
 *   even if just a partial horizontal range `{x, width}` is actually read or written.
 *
 * @note byteLength = bytesPerRow * rowsPerImage * depthOrArrayLayers.
 */
export type TextureMemoryLayout = {
  /** Total length in bytes */
  byteLength: number;
  /** Number of images */
  depthOrArrayLayers: number;
  /** Stride between successive images (Use when depthOrArrayLayers > 1) */
  bytesPerImage: number;
  /** Number of rows per image */
  rowsPerImage: number;
  /** Number of bytes per row (padded) */
  bytesPerRow: number;
  /** Number of bytes per pixel */
  bytesPerPixel: number;
};

/**
 * These represent the main compressed texture formats
 * Each format typically has a number of more specific subformats
 */
export type TextureCompression =
  | 'dxt'
  | 'dxt-srgb'
  | 'etc1'
  | 'etc2'
  | 'pvrtc'
  | 'atc'
  | 'astc'
  | 'rgtc';

// TEXTURE FEATURES (optionally supported by the device)

/**
 * Texture feature checks
 * @note these must be a subset of DeviceFeatures.
 */
export type TextureFeature =
  | 'texture-compression-bc'
  | 'texture-compression-astc'
  | 'texture-compression-etc2'
  | 'depth32float-stencil8'
  | 'texture-compression-etc1-webgl'
  | 'texture-compression-pvrtc-webgl'
  | 'texture-compression-atc-webgl'
  | 'float32-renderable-webgl'
  | 'float16-renderable-webgl'
  | 'rgb9e5ufloat-renderable-webgl'
  | 'snorm8-renderable-webgl'
  | 'norm16-webgl'
  | 'norm16-renderable-webgl'
  | 'snorm16-renderable-webgl'
  | 'float32-filterable'
  | 'float16-filterable-webgl';

/** Chrome-specific extensions. Expected to eventually become standard features. */
export type ChromeExperimentalTextureFeature =
  | 'chromium-experimental-unorm16-texture-formats' // 'r16unorm', 'rg16unorm', 'rgba16unorm'
  | 'chromium-experimental-snorm16-texture-formats';

// Texture format helper types

export type TextureFormatTypedArray<T extends TextureFormat> = DataTypeArray<
  TextureFormatDataType<T>
>;

export type TextureFormatNormalizedTypedArray<T extends TextureFormat> = NormalizedDataTypeArray<
  TextureFormatDataType<T>
>;

export type TextureFormatDataType<T extends TextureFormat> = T extends TextureFormatUint8
  ? 'uint8'
  : T extends TextureFormatSint8
    ? 'sint8'
    : T extends TextureFormatUnorm8
      ? 'unorm8'
      : T extends TextureFormatSnorm8
        ? 'snorm8'
        : T extends TextureFormatUint16
          ? 'uint16'
          : T extends TextureFormatSint16
            ? 'sint16'
            : T extends TextureFormatUnorm16
              ? 'unorm16'
              : T extends TextureFormatSnorm16
                ? 'snorm16'
                : T extends TextureFormatUint32
                  ? 'uint32'
                  : T extends TextureFormatSint32
                    ? 'sint32'
                    : T extends TextureFormatFloat16
                      ? 'float16'
                      : T extends TextureFormatFloat32
                        ? 'float32'
                        : T extends TextureFormatDepthStencil
                          ? 'uint32'
                          : T extends TextureFormatCompressed
                            ? 'uint8'
                            : T extends TextureFormatPacked16
                              ? 'uint16'
                              : T extends TextureFormatPacked32
                                ? 'uint32'
                                : never;

export type TextureFormatDataTypeT<T extends TextureFormat> = TextureFormatDataType<T>;

type DataTypeArray<T extends NormalizedDataType> = InstanceType<TypedArrayConstructorT<T>>;
type NormalizedDataTypeArray<T extends NormalizedDataType> = InstanceType<
  NormalizedTypedArrayConstructorT<T>
>;

// HELPER TYPES

/*
export type TextureFormatColorWebGPU =
  // 8-bit formats
  | 'r8unorm'
  | 'r8snorm'
  | 'r8uint'
  | 'r8sint'
  | 'rg8unorm'
  | 'rg8snorm'
  | 'rg8uint'
  | 'rg8sint'
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'rgba8snorm'
  | 'rgba8uint'
  | 'rgba8sint'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb'

  // 16-bit formats
  | 'r16unorm' // feature: 'chromium-experimental-snorm16-texture-formats' chrome://flags/#enable-unsafe-webgpu 'r16unorm', 'rg16unorm', 'rgba16unorm',
  | 'r16snorm' // feature: 'chromium-experimental-unorm16-texture-formats' chrome://flags/#enable-unsafe-webgpu 'r16snorm', 'rg16snorm',  'rgba16snorm'.
  | 'r16uint'
  | 'r16sint'
  | 'r16float'
  | 'rg16unorm' // feature: 'chromium-experimental-snorm16-texture-formats' chrome://flags/#enable-unsafe-webgpu 'r16unorm', 'rg16unorm', 'rgba16unorm',
  | 'rg16snorm' // feature: 'chromium-experimental-unorm16-texture-formats' chrome://flags/#enable-unsafe-webgpu 'r16snorm', 'rg16snorm',  'rgba16snorm'.
  | 'rgba16unorm' // feature: 'chromium-experimental-snorm16-texture-formats' chrome://flags/#enable-unsafe-webgpu 'r16unorm', 'rg16unorm', 'rgba16unorm',
  | 'rgba16snorm' // feature: 'chromium-experimental-unorm16-texture-formats' chrome://flags/#enable-unsafe-webgpu 'r16snorm', 'rg16snorm',  'rgba16snorm'.
  | 'rg16uint'
  | 'rgba16uint'
  | 'rg16sint'
  | 'rgba16sint'
  | 'rg16float'
  | 'rgba16float'

  // 32-bit formats
  | 'r32uint'
  | 'rg32uint'
  | 'rgba32uint'
  | 'r32sint'
  | 'rg32sint'
  | 'rgba32sint'
  | 'r32float'
  | 'rg32float'
  | 'rgba32float'

  // Packed 32-bit formats
  | 'rgb9e5ufloat'
  | 'rgb10a2unorm'
  | 'rgb10a2uint'
  | 'rg11b10ufloat';
*/

export type {
  TextureFormat,
  TextureFormatColor,
  TextureFormatColorUncompressed,
  TextureFormatUnorm8,
  TextureFormatSnorm8,
  TextureFormatUint8,
  TextureFormatSint8,
  TextureFormatUnorm16,
  TextureFormatSnorm16,
  TextureFormatUint16,
  TextureFormatSint16,
  TextureFormatFloat16,
  TextureFormatUint32,
  TextureFormatSint32,
  TextureFormatFloat32,
  TextureFormatPacked16,
  TextureFormatPacked32,
  TextureFormatCompressed,
  TextureFormatDepthStencil,
  CompressedTextureFormat
} from '@luma.gl/shaders/types';
