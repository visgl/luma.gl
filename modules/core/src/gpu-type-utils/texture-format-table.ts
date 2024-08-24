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
const rgb9e5ufloat_renderable: TextureFeature = 'rgb9e5ufloat_renderable-webgl';
const snorm8_renderable: TextureFeature = 'snorm8-renderable-webgl';
const norm16_renderable: TextureFeature = 'norm16-renderable-webgl';
const snorm16_renderable: TextureFeature = 'snorm16-renderable-webgl';

const float32_filterable: TextureFeature = 'float32-filterable';
const float16_filterable: TextureFeature = 'float16-filterable-webgl';

/** https://www.w3.org/TR/webgpu/#texture-format-caps */

type TextureFormatDefinition = Partial<TextureFormatInfo> & {
  /** for compressed texture formats */
  f?: TextureFeature;
  /** renderable if feature is present. false means the spec does not support this format */
  render?: TextureFeature | false;
  /** filterable if feature is present. false means the spec does not support this format */
  filter?: TextureFeature | false;

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

// prettier-ignore
export const TEXTURE_FORMAT_TABLE: Readonly<Partial<Record<TextureFormat, TextureFormatDefinition>>> = {
  // 8-bit formats
  'r8unorm': {bpp: 1, c: 1},
  'r8snorm': {bpp: 1, c: 1, render: snorm8_renderable},
  'r8uint': {bpp: 1, c: 1},
  'r8sint': {bpp: 1, c: 1},

  // 16-bit formats
  'rg8unorm': {bpp: 2, c: 2},
  'rg8snorm': {bpp: 2, c: 2, render: snorm8_renderable},
  'rg8uint': {bpp: 2, c: 2},
  'rg8sint': {bpp: 2, c: 2},

  'r16uint': {bpp: 2, c: 1},
  'r16sint': {bpp: 2, c: 1},
  'r16float': {bpp: 2, c: 1, render: float16_renderable, filter: 'float16-filterable-webgl'},
  'r16unorm-webgl': {b:2, c:1, f: norm16_renderable},
  'r16snorm-webgl': {b:2, c:1, f: snorm16_renderable},

  // Packed 16-bit formats
  'rgba4unorm-webgl': {channels: 'rgba', bpp: 2, bitsPerChannel: [4, 4, 4, 4], packed: true},
  'rgb565unorm-webgl': {channels: 'rgb', bpp: 2, bitsPerChannel: [5, 6, 5, 0], packed: true},
  'rgb5a1unorm-webgl': {channels: 'rgba', bpp: 2, bitsPerChannel: [5, 5, 5, 1], packed: true},

  // 24-bit formats
  'rgb8unorm-webgl': {bpp: 3, c: 3, wgpu: false},
  'rgb8snorm-webgl': {bpp: 3, c: 3, wgpu: false},

  // 32-bit formats  
  'rgba8unorm': {c: 2, bpp: 4, bitsPerChannel: [8, 8, 8, 8]},
  'rgba8unorm-srgb': {c: 4, bpp: 4, bitsPerChannel: [8, 8, 8, 8]},
  'rgba8snorm': {bpp: 4, c: 4, bitsPerChannel: [8, 8, 8, 8], render: snorm8_renderable},
  'rgba8uint': {c: 4, bpp: 4, bitsPerChannel: [8, 8, 8, 8]},
  'rgba8sint': {c: 4, bpp: 4,bitsPerChannel: [8, 8, 8, 8]},

  // 32-bit, reverse colors, webgpu only
  'bgra8unorm': {bpp: 4, c: 4},
  'bgra8unorm-srgb': {bpp: 4, c: 4},

  'rg16uint': {c: 1, bpp: 4},
  'rg16sint': {c: 2, bpp: 4},
  'rg16float': {c: 2, bpp: 4, render: float16_renderable, filter: float16_filterable},
  'rg16unorm-webgl': {b:2, c:2, render: norm16_renderable},
  'rg16snorm-webgl': {b:2, c:2, render: snorm16_renderable},

  'r32uint': {c: 1, bpp: 4},
  'r32sint': {c: 1, bpp: 4},
  'r32float': {c: 1, bpp: 4, render: float32_renderable, filter: float32_filterable},

  // Packed 32 bit formats
  'rgb9e5ufloat': {channels: 'rgb',  packed: true,  c: 3, bpp: 4,p: 1, render: rgb9e5ufloat_renderable}, // , filter: true},
  'rg11b10ufloat': {channels: 'rgb', c: 3, bpp: 4, bitsPerChannel: [11, 11, 10, 0], packed: true, p: 1,render: float32_renderable},
  'rgb10a2unorm': {channels: 'rgba', c: 4, bpp: 4,  bitsPerChannel: [10, 10, 10, 2], packed: true, p: 1},
  'rgb10a2uint-webgl': {channels: 'rgba', c: 4, bpp: 4, bitsPerChannel: [10, 10, 10, 2], packed: true, p: 1, wgpu: false},

  // 48-bit formats
  'rgb16unorm-webgl': {b:2, c:3, f: norm16_renderable}, // rgb not renderable
  'rgb16snorm-webgl': {b:2, c:3, f: norm16_renderable}, // rgb not renderable

  // 64-bit formats
  'rg32uint': {bpp: 8, c: 2, bitsPerChannel: [32, 32, 0, 0]},
  'rg32sint': {bpp: 8, c: 2, bitsPerChannel: [32, 32, 0, 0]},
  'rg32float': {bpp: 8, c: 2, bitsPerChannel: [32, 32, 0, 0], render: false, filter: float32_filterable},
  'rgba16uint': {bpp: 8, c: 4},
  'rgba16sint': {bpp: 8, c: 4},
  'rgba16float': {bpp: 8, c: 4, render: float16_renderable, filter: float16_filterable},
  'rgba16unorm-webgl': {b:2, c:4, render: norm16_renderable},
  'rgba16snorm-webgl': {b:2, c:4, render: snorm16_renderable},

  // 96-bit formats (deprecated!)
  'rgb32float-webgl': {render: float32_renderable, filter: float32_filterable},
  
  // 128-bit formats
  'rgba32uint': {bpp: 16, c: 4},
  'rgba32sint': {bpp: 16, c: 4},
  'rgba32float': {bpp: 16, c: 4, render: float32_renderable, filter: float32_filterable},

  // Depth/stencil
  
  // Depth and stencil formats
  stencil8: {attachment: 'stencil', c: 1, bpp: 1,components: 1, bitsPerChannel: [8, 0, 0, 0], dataType: 'uint8'},
  'depth16unorm': {attachment: 'depth',  c: 1, bpp: 2,components: 1,  bitsPerChannel: [16, 0, 0, 0], dataType: 'uint16'},
  'depth24plus': {attachment: 'depth', c: 1, bpp: 3, components: 1, bitsPerChannel: [24, 0, 0, 0], dataType: 'uint32'},
  'depth32float': {attachment: 'depth', c: 1, bpp: 4, components: 1, bitsPerChannel: [32, 0, 0, 0], dataType: 'float32'},
  // The depth component of the "depth24plus" and "depth24plus-stencil8" formats may be implemented as either a 24-bit depth value or a "depth32float" value.
  'depth24plus-stencil8': {attachment: 'depth-stencil', bpp: 4, c: 2, p: 1, components: 2,bitsPerChannel: [24, 8, 0, 0], packed: true},
  // "depth32float-stencil8" feature
  'depth32float-stencil8': {attachment: 'depth-stencil', components: 2, c: 2, bpp: 5, bitsPerChannel: [32, 8, 0, 0], packed: true},

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
