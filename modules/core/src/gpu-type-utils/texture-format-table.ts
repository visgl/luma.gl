// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TextureFormat} from './texture-formats';
import {TextureFeature} from './texture-features';
import {TextureFormatInfo} from './texture-format-info';

/* eslint-disable camelcase */

// Define local device feature strings to optimize minification
const texture_compression_bc: TextureFeature = 'texture-compression-bc';
const texture_compression_astc: TextureFeature = 'texture-compression-astc';
const texture_compression_etc2: TextureFeature = 'texture-compression-etc2';
const texture_compression_etc1_webgl: TextureFeature = 'texture-compression-etc1-webgl';
const texture_compression_pvrtc_webgl: TextureFeature = 'texture-compression-pvrtc-webgl';
const texture_compression_atc_webgl: TextureFeature = 'texture-compression-atc-webgl';

const float32_renderable: TextureFeature = 'float32-renderable-webgl';
const float16_renderable: TextureFeature = 'float16-renderable-webgl';
const rgb9e5ufloat_renderable: TextureFeature = 'rgb9e5ufloat-renderable-webgl';
const snorm8_renderable: TextureFeature = 'snorm8-renderable-webgl';
const norm16_renderable: TextureFeature = 'norm16-renderable-webgl';
const snorm16_renderable: TextureFeature = 'snorm16-renderable-webgl';

const float32_filterable: TextureFeature = 'float32-filterable';
const float16_filterable: TextureFeature = 'float16-filterable-webgl';

/** https://www.w3.org/TR/webgpu/#texture-format-caps */

/** Internal type representing texture capabilities */
type TextureFormatDefinition = Partial<TextureFormatInfo> & {
  /** for compressed texture formats */
  f?: TextureFeature;
  /** renderable if feature is present. false means the spec does not support this format */
  render?: TextureFeature | false;
  /** filterable if feature is present. false means the spec does not support this format */
  filter?: TextureFeature | false;
  blend?: TextureFeature | false;
  store?: TextureFeature | false;

  /** (bytes per pixel), for memory usage calculations. */
  b?: number;
  /** channels */
  c?: number;
  bpp?: number;
  /** packed */
  p?: number;

  /** If not supported on WebGPU */
  wgpu?: false;
};

export function getTextureFormatDefinition(format: TextureFormat): TextureFormatDefinition {
  const info = TEXTURE_FORMAT_TABLE[format];
  if (!info) {
    throw new Error(`Unsupported texture format ${format}`);
  }
  return info;
}

export function getTextureFormatTable(): Readonly<Record<TextureFormat, TextureFormatDefinition>> {
  return TEXTURE_FORMAT_TABLE;
}

// prettier-ignore
const TEXTURE_FORMAT_TABLE: Readonly<Record<TextureFormat, TextureFormatDefinition>> = {
  // 8-bit formats
  'r8unorm': {},
  'r8snorm': {render: snorm8_renderable},
  'r8uint': {},
  'r8sint': {},

  // 16-bit formats
  'rg8unorm': {},
  'rg8snorm': {render: snorm8_renderable},
  'rg8uint': {},
  'rg8sint': {},

  'r16uint': {},
  'r16sint': {},
  'r16float': {render: float16_renderable, filter: 'float16-filterable-webgl'},
  'r16unorm-webgl': {f: norm16_renderable},
  'r16snorm-webgl': {f: snorm16_renderable},

  // Packed 16-bit formats
  'rgba4unorm-webgl': {channels: 'rgba', bitsPerChannel: [4, 4, 4, 4], packed: true},
  'rgb565unorm-webgl': {channels: 'rgb', bitsPerChannel: [5, 6, 5, 0], packed: true},
  'rgb5a1unorm-webgl': {channels: 'rgba', bitsPerChannel: [5, 5, 5, 1], packed: true},

  // 24-bit formats
  'rgb8unorm-webgl': {},
  'rgb8snorm-webgl': {},

  // 32-bit formats  
  'rgba8unorm': {},
  'rgba8unorm-srgb': {},
  'rgba8snorm': {render: snorm8_renderable},
  'rgba8uint': {},
  'rgba8sint': {},

  // 32-bit, reverse colors, webgpu only
  'bgra8unorm': {},
  'bgra8unorm-srgb': {},

  'rg16uint': {},
  'rg16sint': {},
  'rg16float': {render: float16_renderable, filter: float16_filterable},
  'rg16unorm-webgl': {render: norm16_renderable},
  'rg16snorm-webgl': {render: snorm16_renderable},

  'r32uint': {},
  'r32sint': {},
  'r32float': {render: float32_renderable, filter: float32_filterable},

  // Packed 32 bit formats
  'rgb9e5ufloat': {channels: 'rgb', packed: true, render: rgb9e5ufloat_renderable}, // , filter: true},
  'rg11b10ufloat': {channels: 'rgb', bitsPerChannel: [11, 11, 10, 0], packed: true, p: 1,render: float32_renderable},
  'rgb10a2unorm': {channels: 'rgba',  bitsPerChannel: [10, 10, 10, 2], packed: true, p: 1},
  'rgb10a2uint-webgl': {channels: 'rgba', bitsPerChannel: [10, 10, 10, 2], packed: true, p: 1, wgpu: false},

  // 48-bit formats
  'rgb16unorm-webgl': {f: norm16_renderable}, // rgb not renderable
  'rgb16snorm-webgl': {f: norm16_renderable}, // rgb not renderable

  // 64-bit formats
  'rg32uint': {},
  'rg32sint': {},
  'rg32float': {render: false, filter: float32_filterable},
  'rgba16uint': {},
  'rgba16sint': {},
  'rgba16float': {render: float16_renderable, filter: float16_filterable},
  'rgba16unorm-webgl': {render: norm16_renderable},
  'rgba16snorm-webgl': {render: snorm16_renderable},

  // 96-bit formats (deprecated!)
  'rgb32float-webgl': {render: float32_renderable, filter: float32_filterable},
  
  // 128-bit formats
  'rgba32uint': {},
  'rgba32sint': {},
  'rgba32float': {render: float32_renderable, filter: float32_filterable},

  // Depth/stencil
  
  // Depth and stencil formats
  stencil8: {attachment: 'stencil', bitsPerChannel: [8, 0, 0, 0], dataType: 'uint8'},
  'depth16unorm': {attachment: 'depth',  bitsPerChannel: [16, 0, 0, 0], dataType: 'uint16'},
  'depth24plus': {attachment: 'depth', bitsPerChannel: [24, 0, 0, 0], dataType: 'uint32'},
  'depth32float': {attachment: 'depth', bitsPerChannel: [32, 0, 0, 0], dataType: 'float32'},
  // The depth component of the "depth24plus" and "depth24plus-stencil8" formats may be implemented as either a 24-bit depth value or a "depth32float" value.
  'depth24plus-stencil8': {attachment: 'depth-stencil', bitsPerChannel: [24, 8, 0, 0], packed: true},
  // "depth32float-stencil8" feature
  'depth32float-stencil8': {attachment: 'depth-stencil', bitsPerChannel: [32, 8, 0, 0], packed: true},

  // BC compressed formats: check device.features.has("texture-compression-bc");

  'bc1-rgb-unorm-webgl': {f: texture_compression_bc},
  'bc1-rgb-unorm-srgb-webgl': {f: texture_compression_bc},

  'bc1-rgba-unorm': {f: texture_compression_bc},
  'bc1-rgba-unorm-srgb': {f: texture_compression_bc},
  'bc2-rgba-unorm': {f: texture_compression_bc},
  'bc2-rgba-unorm-srgb': {f: texture_compression_bc},
  'bc3-rgba-unorm': {f: texture_compression_bc},
  'bc3-rgba-unorm-srgb': {f: texture_compression_bc},
  'bc4-r-unorm': {f: texture_compression_bc},
  'bc4-r-snorm': {f: texture_compression_bc},
  'bc5-rg-unorm': {f: texture_compression_bc},
  'bc5-rg-snorm': {f: texture_compression_bc},
  'bc6h-rgb-ufloat': {f: texture_compression_bc},
  'bc6h-rgb-float': {f: texture_compression_bc},
  'bc7-rgba-unorm': {f: texture_compression_bc},
  'bc7-rgba-unorm-srgb': {f: texture_compression_bc},

  // WEBGL_compressed_texture_etc: device.features.has("texture-compression-etc2")
  // Note: Supposedly guaranteed availability compressed formats in WebGL2, but through CPU decompression

  'etc2-rgb8unorm': {f: texture_compression_etc2},
  'etc2-rgb8unorm-srgb': {f: texture_compression_etc2},
  'etc2-rgb8a1unorm': {f: texture_compression_etc2},
  'etc2-rgb8a1unorm-srgb': {f: texture_compression_etc2},
  'etc2-rgba8unorm': {f: texture_compression_etc2},
  'etc2-rgba8unorm-srgb': {f: texture_compression_etc2},

  'eac-r11unorm': {f: texture_compression_etc2},
  'eac-r11snorm': {f: texture_compression_etc2},
  'eac-rg11unorm': {f: texture_compression_etc2},
  'eac-rg11snorm': {f: texture_compression_etc2},

  // X_ASTC compressed formats: device.features.has("texture-compression-astc")

  'astc-4x4-unorm': {f: texture_compression_astc},
  'astc-4x4-unorm-srgb': {f: texture_compression_astc},
  'astc-5x4-unorm': {f: texture_compression_astc},
  'astc-5x4-unorm-srgb': {f: texture_compression_astc},
  'astc-5x5-unorm': {f: texture_compression_astc},
  'astc-5x5-unorm-srgb': {f: texture_compression_astc},
  'astc-6x5-unorm': {f: texture_compression_astc},
  'astc-6x5-unorm-srgb': {f: texture_compression_astc},
  'astc-6x6-unorm': {f: texture_compression_astc},
  'astc-6x6-unorm-srgb': {f: texture_compression_astc},
  'astc-8x5-unorm': {f: texture_compression_astc},
  'astc-8x5-unorm-srgb': {f: texture_compression_astc},
  'astc-8x6-unorm': {f: texture_compression_astc},
  'astc-8x6-unorm-srgb': {f: texture_compression_astc},
  'astc-8x8-unorm': {f: texture_compression_astc},
  'astc-8x8-unorm-srgb': {f: texture_compression_astc},
  'astc-10x5-unorm': {f: texture_compression_astc},
  'astc-10x5-unorm-srgb': {f: texture_compression_astc},
  'astc-10x6-unorm': {f: texture_compression_astc},
  'astc-10x6-unorm-srgb': {f: texture_compression_astc},
  'astc-10x8-unorm': {f: texture_compression_astc},
  'astc-10x8-unorm-srgb': {f: texture_compression_astc},
  'astc-10x10-unorm': {f: texture_compression_astc},
  'astc-10x10-unorm-srgb': {f: texture_compression_astc},
  'astc-12x10-unorm': {f: texture_compression_astc},
  'astc-12x10-unorm-srgb': {f: texture_compression_astc},
  'astc-12x12-unorm': {f: texture_compression_astc},
  'astc-12x12-unorm-srgb': {f: texture_compression_astc},

  // WEBGL_compressed_texture_pvrtc

  'pvrtc-rgb4unorm-webgl': {f: texture_compression_pvrtc_webgl},
  'pvrtc-rgba4unorm-webgl': {f: texture_compression_pvrtc_webgl},
  'pvrtc-rbg2unorm-webgl': {f: texture_compression_pvrtc_webgl},
  'pvrtc-rgba2unorm-webgl': {f: texture_compression_pvrtc_webgl},

  // WEBGL_compressed_texture_etc1

  'etc1-rbg-unorm-webgl': {f: texture_compression_etc1_webgl},

  // WEBGL_compressed_texture_atc

  'atc-rgb-unorm-webgl': {f: texture_compression_atc_webgl},
  'atc-rgba-unorm-webgl': {f: texture_compression_atc_webgl},
  'atc-rgbai-unorm-webgl': {f: texture_compression_atc_webgl}
};
