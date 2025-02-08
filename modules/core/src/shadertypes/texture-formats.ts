// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NormalizedDataType} from './data-types';

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

/** Texture formats */
export type TextureFormat = ColorTextureFormat | DepthStencilTextureFormat;

/** Depth and stencil texture formats */
export type DepthStencilTextureFormat =
  | 'stencil8'
  | 'depth16unorm'
  | 'depth24plus'
  | 'depth24plus-stencil8'
  | 'depth32float'
  // device.features.has('depth32float-stencil8')
  | 'depth32float-stencil8';

/** Texture formats for color attachments */
export type ColorTextureFormat =
  | WebGPUColorTextureFormat
  | WebGL2ColorTextureFormat
  | CompressedTextureFormat;

export type WebGPUColorTextureFormat =
  // 8-bit formats
  | 'r8unorm'
  | 'r8snorm'
  | 'r8uint'
  | 'r8sint'

  // 16-bit formats
  | 'r16unorm' // feature: 'chromium-experimental-snorm16-texture-formats' chrome://flags/#enable-unsafe-webgpu 'r16unorm', 'rg16unorm', 'rgba16unorm',
  | 'r16snorm' // feature: 'chromium-experimental-unorm16-texture-formats' chrome://flags/#enable-unsafe-webgpu 'r16snorm', 'rg16snorm',  'rgba16snorm'.
  | 'r16uint'
  | 'r16sint'
  | 'r16float'
  | 'rg8unorm'
  | 'rg8snorm'
  | 'rg8uint'
  | 'rg8sint'

  // 32-bit formats
  | 'rg16unorm' // feature: 'chromium-experimental-snorm16-texture-formats' chrome://flags/#enable-unsafe-webgpu 'r16unorm', 'rg16unorm', 'rgba16unorm',
  | 'rg16snorm' // feature: 'chromium-experimental-unorm16-texture-formats' chrome://flags/#enable-unsafe-webgpu 'r16snorm', 'rg16snorm',  'rgba16snorm'.
  | 'r32uint'
  | 'r32sint'
  | 'r32float'
  | 'rg16uint'
  | 'rg16sint'
  | 'rg16float'
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'rgba8snorm'
  | 'rgba8uint'
  | 'rgba8sint'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb'
  // Packed 32-bit formats
  | 'rgb9e5ufloat'
  | 'rgb10a2unorm'
  | 'rgb10a2uint'
  | 'rg11b10ufloat'

  // 64-bit formats
  | 'rgba16unorm' // feature: 'chromium-experimental-snorm16-texture-formats' chrome://flags/#enable-unsafe-webgpu 'r16unorm', 'rg16unorm', 'rgba16unorm',
  | 'rgba16snorm' // feature: 'chromium-experimental-unorm16-texture-formats' chrome://flags/#enable-unsafe-webgpu 'r16snorm', 'rg16snorm',  'rgba16snorm'.
  | 'rg32uint'
  | 'rg32sint'
  | 'rg32float'
  | 'rgba16uint'
  | 'rgba16sint'
  | 'rgba16float'

  // 128-bit formats
  | 'rgba32uint'
  | 'rgba32sint'
  | 'rgba32float';

export type CompressedTextureFormat =
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

/** Sized formats in WebGL 2 that are not (yet?) supported by WebGPU */
export type WebGL2ColorTextureFormat =
  | 'rgba4unorm-webgl'
  | 'rgb565unorm-webgl'
  | 'rgb5a1unorm-webgl'
  | 'rgb8unorm-webgl'
  | 'rgb8snorm-webgl'
  | 'rgb10a2uint'
  | 'rgb16unorm-webgl'
  | 'rgb16snorm-webgl'
  | 'rgb32float-webgl'
  | 'bc1-rgb-unorm-webgl'
  | 'bc1-rgb-unorm-srgb-webgl'
  | 'pvrtc-rgb4unorm-webgl'
  | 'pvrtc-rgba4unorm-webgl'
  | 'pvrtc-rbg2unorm-webgl'
  | 'pvrtc-rgba2unorm-webgl'
  | 'etc1-rbg-unorm-webgl'
  | 'atc-rgb-unorm-webgl'
  | 'atc-rgba-unorm-webgl'
  | 'atc-rgbai-unorm-webgl';

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
  /** If this is a packed data type */
  packed?: boolean;
  /** Number of bytes per pixel */
  bytesPerPixel?: number;
  /** Number of bits per channel (may be unreliable for packed formats) */
  bitsPerChannel: [number, number, number, number];
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
