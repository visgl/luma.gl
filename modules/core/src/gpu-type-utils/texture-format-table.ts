// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TextureFormat} from './texture-formats';
import {TextureFeature} from './texture-features';
import {TextureFormatInfo} from './texture-format-info';
/* eslint-disable camelcase */

/**
 * @see https://www.w3.org/TR/webgpu/#texture-format-caps
 * @see https://registry.khronos.org/OpenGL/specs/es/3.0/es_spec_3.0.pdf Table 3.13
 */
type TextureFormatDefinition = Partial<TextureFormatInfo> & {
  /** Can the format be created */
  create?: TextureFeature | boolean;
  /** If a feature string, the specified device feature determines if format is renderable. */
  render?: TextureFeature | boolean;
  /** If a feature string, the specified device feature determines if format is filterable. */
  filter?: TextureFeature | boolean;
  /** If a feature string, the specified device feature determines if format is blendable. */
  blend?: TextureFeature | boolean;
  /** If a feature string, the specified device feature determines if format is storeable. */
  store?: TextureFeature | boolean;
};

// prettier-ignore
export const TEXTURE_FORMAT_TABLE: Readonly<Record<TextureFormat, TextureFormatDefinition>> = {
  // 8-bit formats
  'r8unorm': {},
  'r8snorm': {render: 'snorm8-renderable-webgl'},
  'r8uint': {},
  'r8sint': {},

  // 16-bit formats
  'rg8unorm': {},
  'rg8snorm': {render: 'snorm8-renderable-webgl'},
  'rg8uint': {},
  'rg8sint': {},

  'r16uint': {},
  'r16sint': {},
  'r16float': {render: 'float16-renderable-webgl', filter: 'float16-filterable-webgl'},
  'r16unorm-webgl': {create: 'norm16-renderable-webgl'},
  'r16snorm-webgl': {create: 'snorm16-renderable-webgl'},

  // Packed 16-bit formats
  'rgba4unorm-webgl': {channels: 'rgba', bitsPerChannel: [4, 4, 4, 4], packed: true},
  'rgb565unorm-webgl': {channels: 'rgb', bitsPerChannel: [5, 6, 5, 0], packed: true},
  'rgb5a1unorm-webgl': {channels: 'rgba', bitsPerChannel: [5, 5, 5, 1], packed: true},

  // 24-bit formats
  'rgb8unorm-webgl': {},
  'rgb8snorm-webgl': {},

  // 32-bit formats  
  'rgba8unorm': {bitsPerChannel: [8, 8, 8, 8]},
  'rgba8unorm-srgb': {bitsPerChannel: [8, 8, 8, 8]},
  'rgba8snorm': {bitsPerChannel: [8, 8, 8, 8], render: 'snorm8-renderable-webgl'},
  'rgba8uint': {bitsPerChannel: [8, 8, 8, 8]},
  'rgba8sint': {bitsPerChannel: [8, 8, 8, 8]},

  // 32-bit, reverse colors, webgpu only
  'bgra8unorm': {},
  'bgra8unorm-srgb': {},

  'r32float': {},

  'rg16uint': {},
  'rg16sint': {},
  'rg16float': {render: 'float16-renderable-webgl', filter: 'float16-filterable-webgl'},
  'rg16unorm-webgl': {render: 'norm16-renderable-webgl'},
  'rg16snorm-webgl': {render: 'snorm16-renderable-webgl'},

  'r32uint': {},
  'r32sint': {},
  
  // Packed 32 bit formats
  'rgb9e5ufloat': {channels: 'rgb',  packed: true, render: 'rgb9e5ufloat-renderable-webgl'}, // , filter: true},
  'rg11b10ufloat': {channels: 'rgb', bitsPerChannel: [11, 11, 10, 0], packed: true, render: 'float32-renderable-webgl'},
  'rgb10a2unorm': {channels: 'rgba', bitsPerChannel: [10, 10, 10, 2], packed: true},
  'rgb10a2uint-webgl': {channels: 'rgba', bitsPerChannel: [10, 10, 10, 2], packed: true},

  // 48-bit formats
  'rgb16unorm-webgl': {create: 'norm16-renderable-webgl'}, // rgb not renderable
  'rgb16snorm-webgl': {create: 'norm16-renderable-webgl'}, // rgb not renderable

  // 64-bit formats
  'rg32uint': {bitsPerChannel: [32, 32, 0, 0]},
  'rg32sint': {bitsPerChannel: [32, 32, 0, 0]},
  'rgba16uint': {},
  'rgba16sint': {},
  'rgba16unorm-webgl': {render: 'norm16-renderable-webgl'},
  'rgba16snorm-webgl': {render: 'snorm16-renderable-webgl'},

  'rg32float': {render: 'float32-renderable-webgl', filter: 'float32-filterable'},
  'rgba16float': {render: 'float16-renderable-webgl', filter: 'float16-filterable-webgl'},

  // 96-bit formats (deprecated!)
  'rgb32float-webgl': {create: 'float32-renderable-webgl'}, // rgb not renderable
  
  // 128-bit formats
  'rgba32float': {},
  'rgba32uint': {},
  'rgba32sint': {},
  
  // Depth/stencil
  
  // Depth and stencil formats
  stencil8: {attachment: 'stencil', components: 1, bitsPerChannel: [8, 0, 0, 0], dataType: 'uint8'},
  'depth16unorm': {attachment: 'depth', components: 1,  bitsPerChannel: [16, 0, 0, 0], dataType: 'uint16'},
  'depth24plus': {attachment: 'depth', components: 1, bitsPerChannel: [24, 0, 0, 0], dataType: 'uint32'},
  'depth32float': {attachment: 'depth', components: 1, bitsPerChannel: [32, 0, 0, 0], dataType: 'float32'},
  // The depth component of the "depth24plus" and "depth24plus-stencil8" formats may be implemented as either a 24-bit depth value or a "depth32float" value.
  'depth24plus-stencil8': {attachment: 'depth-stencil', components: 2, bitsPerChannel: [24, 8, 0, 0], packed: true},
  // "depth32float-stencil8" feature
  'depth32float-stencil8': {attachment: 'depth-stencil', components: 2, bitsPerChannel: [32, 8, 0, 0], packed: true},

  // BC compressed formats: check device.features.has("texture-compression-bc");

  'bc1-rgb-unorm-webgl': {create: 'texture-compression-bc'},
  'bc1-rgb-unorm-srgb-webgl': {create: 'texture-compression-bc'},

  'bc1-rgba-unorm': {create: 'texture-compression-bc'},
  'bc1-rgba-unorm-srgb': {create: 'texture-compression-bc'},
  'bc2-rgba-unorm': {create: 'texture-compression-bc'},
  'bc2-rgba-unorm-srgb': {create: 'texture-compression-bc'},
  'bc3-rgba-unorm': {create: 'texture-compression-bc'},
  'bc3-rgba-unorm-srgb': {create: 'texture-compression-bc'},
  'bc4-r-unorm': {create: 'texture-compression-bc'},
  'bc4-r-snorm': {create: 'texture-compression-bc'},
  'bc5-rg-unorm': {create: 'texture-compression-bc'},
  'bc5-rg-snorm': {create: 'texture-compression-bc'},
  'bc6h-rgb-ufloat': {create: 'texture-compression-bc'},
  'bc6h-rgb-float': {create: 'texture-compression-bc'},
  'bc7-rgba-unorm': {create: 'texture-compression-bc'},
  'bc7-rgba-unorm-srgb': {create: 'texture-compression-bc'},

  // WEBGL_compressed_texture_etc: device.features.has("texture-compression-etc2")
  // Note: Supposedly guaranteed availability compressed formats in WebGL2, but through CPU decompression

  'etc2-rgb8unorm': {create: 'texture-compression-etc2'},
  'etc2-rgb8unorm-srgb': {create: 'texture-compression-etc2'},
  'etc2-rgb8a1unorm': {create: 'texture-compression-etc2'},
  'etc2-rgb8a1unorm-srgb': {create: 'texture-compression-etc2'},
  'etc2-rgba8unorm': {create: 'texture-compression-etc2'},
  'etc2-rgba8unorm-srgb': {create: 'texture-compression-etc2'},

  'eac-r11unorm': {create: 'texture-compression-etc2'},
  'eac-r11snorm': {create: 'texture-compression-etc2'},
  'eac-rg11unorm': {create: 'texture-compression-etc2'},
  'eac-rg11snorm': {create: 'texture-compression-etc2'},

  // X_ASTC compressed formats: device.features.has("texture-compression-astc")

  'astc-4x4-unorm': {create: 'texture-compression-astc'},
  'astc-4x4-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-5x4-unorm': {create: 'texture-compression-astc'},
  'astc-5x4-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-5x5-unorm': {create: 'texture-compression-astc'},
  'astc-5x5-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-6x5-unorm': {create: 'texture-compression-astc'},
  'astc-6x5-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-6x6-unorm': {create: 'texture-compression-astc'},
  'astc-6x6-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-8x5-unorm': {create: 'texture-compression-astc'},
  'astc-8x5-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-8x6-unorm': {create: 'texture-compression-astc'},
  'astc-8x6-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-8x8-unorm': {create: 'texture-compression-astc'},
  'astc-8x8-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-10x5-unorm': {create: 'texture-compression-astc'},
  'astc-10x5-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-10x6-unorm': {create: 'texture-compression-astc'},
  'astc-10x6-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-10x8-unorm': {create: 'texture-compression-astc'},
  'astc-10x8-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-10x10-unorm': {create: 'texture-compression-astc'},
  'astc-10x10-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-12x10-unorm': {create: 'texture-compression-astc'},
  'astc-12x10-unorm-srgb': {create: 'texture-compression-astc'},
  'astc-12x12-unorm': {create: 'texture-compression-astc'},
  'astc-12x12-unorm-srgb': {create: 'texture-compression-astc'},

  // WEBGL_compressed_texture_pvrtc

  'pvrtc-rgb4unorm-webgl': {create: 'texture-compression-pvrtc-webgl'},
  'pvrtc-rgba4unorm-webgl': {create: 'texture-compression-pvrtc-webgl'},
  'pvrtc-rbg2unorm-webgl': {create: 'texture-compression-pvrtc-webgl'},
  'pvrtc-rgba2unorm-webgl': {create: 'texture-compression-pvrtc-webgl'},

  // WEBGL_compressed_texture_etc1

  'etc1-rbg-unorm-webgl': {create: 'texture-compression-etc1-webgl'},

  // WEBGL_compressed_texture_atc

  'atc-rgb-unorm-webgl': {create: 'texture-compression-atc-webgl'},
  'atc-rgba-unorm-webgl': {create: 'texture-compression-atc-webgl'},
  'atc-rgbai-unorm-webgl': {create: 'texture-compression-atc-webgl'}
};
