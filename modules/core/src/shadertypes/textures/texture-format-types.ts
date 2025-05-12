// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type TextureFormat} from './texture-formats';

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
