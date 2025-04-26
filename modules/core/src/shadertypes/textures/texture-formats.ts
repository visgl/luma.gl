// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NormalizedDataType} from '../data-types/data-types';

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
  | 'texture-compression-etc1-webgl'
  | 'texture-compression-pvrtc-webgl'
  | 'texture-compression-atc-webgl'
  | 'float32-renderable-webgl'
  | 'float16-renderable-webgl'
  | 'rgb9e5ufloat-renderable-webgl'
  | 'snorm8-renderable-webgl'
  | 'norm16-renderable-webgl'
  | 'snorm16-renderable-webgl'
  | 'float32-filterable'
  | 'float16-filterable-webgl';

/** Chrome-specific extensions. Expected to eventually become standard features. */
export type ChromeExperimentalTextureFeature =
  | 'chromium-experimental-unorm16-texture-formats' // 'r16unorm', 'rg16unorm', 'rgba16unorm'
  | 'chromium-experimental-snorm16-texture-formats'; // 'r16snorm', 'rg16snorm', 'rgba16snorm'

// TEXTURE FORMATS

/** Texture formats */
export type TextureFormat = TextureFormatColor | TextureFormatDepthStencil;

/** Depth and stencil texture formats */
export type TextureFormatDepthStencil =
  | 'stencil8'
  | 'depth16unorm'
  | 'depth24plus'
  | 'depth24plus-stencil8'
  | 'depth32float'
  // device.features.has('depth32float-stencil8')
  | 'depth32float-stencil8';

/** Texture formats for color attachments */
export type TextureFormatColor = TextureFormatColorUncompressed | TextureFormatCompressed;

export type TextureFormatColorUncompressed =
  | TextureFormatUnorm8
  | TextureFormatSnorm8
  | TextureFormatUint8
  | TextureFormatSint8
  | TextureFormatUnorm16
  | TextureFormatSnorm16
  | TextureFormatUint16
  | TextureFormatSint16
  | TextureFormatFloat16
  | TextureFormatUint32
  | TextureFormatSint32
  | TextureFormatFloat32
  | TextureFormatPacked16
  | TextureFormatPacked32;

type TextureFormatUnorm8 =
  | 'r8unorm'
  | 'rg8unorm'
  | 'rgb8unorm-webgl'
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb';

type TextureFormatSnorm8 = 'r8snorm' | 'rg8snorm' | 'rgb8snorm-webgl' | 'rgba8snorm';

type TextureFormatUint8 = 'r8uint' | 'rg8uint' | 'rgba8uint';

type TextureFormatSint8 = 'r8sint' | 'rg8sint' | 'rgba8sint';

type TextureFormatUnorm16 = 'r16unorm' | 'rg16unorm' | 'rgb16unorm-webgl' | 'rgba16unorm';

type TextureFormatSnorm16 = 'r16snorm' | 'rg16snorm' | 'rgb16snorm-webgl' | 'rgba16snorm';

type TextureFormatUint16 = 'r16uint' | 'rg16uint' | 'rgba16uint';

type TextureFormatSint16 = 'r16sint' | 'rg16sint' | 'rgba16sint';

type TextureFormatFloat16 = 'r16float' | 'rg16float' | 'rgba16float';

// 96-bit formats (deprecated!)
type TextureFormatUint32 = 'r32uint' | 'rg32uint' | 'rgba32uint';

type TextureFormatSint32 = 'r32sint' | 'rg32sint' | 'rgba32sint';

type TextureFormatFloat32 = 'r32float' | 'rg32float' | 'rgb32float-webgl' | 'rgba32float';

type TextureFormatPacked16 = 'rgba4unorm-webgl' | 'rgb565unorm-webgl' | 'rgb5a1unorm-webgl';

type TextureFormatPacked32 = 'rgb9e5ufloat' | 'rg11b10ufloat' | 'rgb10a2unorm' | 'rgb10a2uint';

export type TextureFormatCompressed =
  | 'bc1-rgb-unorm-webgl'
  | 'bc1-rgb-unorm-srgb-webgl'
  | 'pvrtc-rgb4unorm-webgl'
  | 'pvrtc-rgba4unorm-webgl'
  | 'pvrtc-rbg2unorm-webgl'
  | 'pvrtc-rgba2unorm-webgl'
  | 'etc1-rbg-unorm-webgl'
  | 'atc-rgb-unorm-webgl'
  | 'atc-rgba-unorm-webgl'
  | 'atc-rgbai-unorm-webgl'

  // BC compressed formats usable if 'texture-compression-bc' is both
  // supported by the device/user agent and enabled in requestDevice.
  | 'bc1-rgba-unorm'
  | 'bc1-rgba-unorm-srgb'
  | 'bc2-rgba-unorm'
  | 'bc2-rgba-unorm-srgb'
  | 'bc3-rgba-unorm'
  | 'bc3-rgba-unorm-srgb'
  | 'bc4-r-unorm'
  | 'bc4-r-snorm'
  | 'bc5-rg-unorm'
  | 'bc5-rg-snorm'
  | 'bc6h-rgb-ufloat'
  | 'bc6h-rgb-float'
  | 'bc7-rgba-unorm'
  | 'bc7-rgba-unorm-srgb'

  // ETC2 compressed formats usable if "texture-compression-etc2" is both
  // supported by the device/user agent and enabled in requestDevice.
  | 'etc2-rgb8unorm'
  | 'etc2-rgb8unorm-srgb'
  | 'etc2-rgb8a1unorm'
  | 'etc2-rgb8a1unorm-srgb'
  | 'etc2-rgba8unorm'
  | 'etc2-rgba8unorm-srgb'
  | 'eac-r11unorm'
  | 'eac-r11snorm'
  | 'eac-rg11unorm'
  | 'eac-rg11snorm'

  // ASTC compressed formats usable if "texture-compression-astc" is both
  // supported by the device/user agent and enabled in requestDevice.
  // Textures must be multiple of block size (encoded in format string).
  | 'astc-4x4-unorm'
  | 'astc-4x4-unorm-srgb'
  | 'astc-5x4-unorm'
  | 'astc-5x4-unorm-srgb'
  | 'astc-5x5-unorm'
  | 'astc-5x5-unorm-srgb'
  | 'astc-6x5-unorm'
  | 'astc-6x5-unorm-srgb'
  | 'astc-6x6-unorm'
  | 'astc-6x6-unorm-srgb'
  | 'astc-8x5-unorm'
  | 'astc-8x5-unorm-srgb'
  | 'astc-8x6-unorm'
  | 'astc-8x6-unorm-srgb'
  | 'astc-8x8-unorm'
  | 'astc-8x8-unorm-srgb'
  | 'astc-10x5-unorm'
  | 'astc-10x5-unorm-srgb'
  | 'astc-10x6-unorm'
  | 'astc-10x6-unorm-srgb'
  | 'astc-10x8-unorm'
  | 'astc-10x8-unorm-srgb'
  | 'astc-10x10-unorm'
  | 'astc-10x10-unorm-srgb'
  | 'astc-12x10-unorm'
  | 'astc-12x10-unorm-srgb'
  | 'astc-12x12-unorm'
  | 'astc-12x12-unorm-srgb';

// Texture format helper types

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
