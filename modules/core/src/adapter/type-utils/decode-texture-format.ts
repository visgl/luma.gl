// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TextureFormat} from '../types/texture-formats';
import {VertexType} from '../types/vertex-formats';
import {decodeVertexType} from './decode-data-type';

// prettier-ignore
const COMPRESSED_TEXTURE_FORMAT_PREFIXES = [
  'bc1', 'bc2', 'bc3', 'bc4', 'bc5', 'bc6', 'bc7', 'etc1', 'etc2', 'eac', 'atc', 'astc', 'pvrtc'
];

const REGEX = /^(rg?b?a?)([0-9]*)([a-z]*)(-srgb)?(-webgl|-unsized)?$/;

export type DecodedTextureFormat = {
  format: 'r' | 'rg' | 'rgb' | 'rgba';
  components: 1 | 2 | 3 | 4;
  dataType?: VertexType;
  srgb: boolean;
  webgl: boolean;
  unsized: boolean;
  byteLength: number;
  integer: boolean;
  signed: boolean;
  normalized: boolean;
};

/**
 * Returns true if a texture format is GPU compressed
 */
export function isTextureFormatCompressed(textureFormat: TextureFormat): boolean {
  return COMPRESSED_TEXTURE_FORMAT_PREFIXES.some(prefix => textureFormat.startsWith(prefix));
}

/**
 * Decodes a vertex format, returning type, components, byte length and flags (integer, signed, normalized)
 */
export function decodeTextureFormat(format: TextureFormat): DecodedTextureFormat {
  const matches = REGEX.exec(format as string);
  if (matches) {
    const [, format, length, type, srgb, suffix] = matches;
    if (format) {
      const dataType = `${type}${length}` as VertexType;
      const decodedType = decodeVertexType(dataType);
      return {
        format: format as 'r' | 'rg' | 'rgb' | 'rgba',
        components: format.length as 1 | 2 | 3 | 4,
        // dataType - overwritten by decodedType
        srgb: srgb === '-srgb',
        unsized: suffix === '-unsized',
        webgl: suffix === '-webgl',
        ...decodedType
      };
    }
  }

  return decodeNonStandardFormat(format);
}

// https://www.w3.org/TR/webgpu/#texture-format-caps

const EXCEPTIONS: Partial<Record<TextureFormat, any>> = {
  // Packed 16 bit formats
  'rgba4unorm-webgl': {format: 'rgba', bpp: 2},
  'rgb565unorm-webgl': {format: 'rgb', bpp: 2},
  'rgb5a1unorm-webgl': {format: 'rgba', bbp: 2},
  // Packed 32 bit formats
  rgb9e5ufloat: {format: 'rgb', bbp: 4},
  rg11b10ufloat: {format: 'rgb', bbp: 4},
  rgb10a2unorm: {format: 'rgba', bbp: 4},
  'rgb10a2uint-webgl': {format: 'rgba', bbp: 4},
  // Depth/stencil
  stencil8: {components: 1, bpp: 1, a: 'stencil'},
  depth16unorm: {components: 1, bpp: 2, a: 'depth'},
  depth24plus: {components: 1, bpp: 3, a: 'depth'},
  depth32float: {components: 1, bpp: 4, a: 'depth'},
  'depth24plus-stencil8': {components: 2, bpp: 4, a: 'depth-stencil'},
  // "depth24unorm-stencil8" feature
  'depth24unorm-stencil8': {components: 2, bpp: 4, a: 'depth-stencil'},
  // "depth32float-stencil8" feature
  'depth32float-stencil8': {components: 2, bpp: 4, a: 'depth-stencil'}
};

function decodeNonStandardFormat(format: TextureFormat): DecodedTextureFormat {
  const data = EXCEPTIONS[format];
  if (!data) {
    throw new Error(`Unknown format ${format}`);
  }
  return {
    format: data.format || '',
    components: data.components || data.format?.length || 1,
    byteLength: data.bpp || 1,
    srgb: false,
    unsized: false
  } as DecodedTextureFormat;
}

/*
'r8unorm':	{s: "float"}, // 	✓	✓	✓	},
'r8snorm':	{s: "float"}, // 		✓		},
'r8uint':	{s: "uint"}, // 	✓	✓		},
'r8sint':	{s: "sint"}, // 	✓	✓		},
'rg8unorm':	{s: "float"}, // 	✓	✓	✓	},
'rg8snorm':	{s: "float"}, // 		✓		},
'rg8uint':	{s: "uint"}, // 	✓	✓		},
'rg8sint':	{s: "sint"}, // 	✓	✓		},
'rgba8unorm':	{s: "float"}, // 	✓	✓	✓	✓},
'rgba8unorm-srgb': {s: "float"}, // 	✓	✓	✓	},
'rgba8snorm':	{s: "float"}, // 		✓		✓},
'rgba8uint':	{s: "uint"}, // 	✓	✓		✓},
'rgba8sint':	{s: "sint"}, // 	✓	✓		✓},
'bgra8unorm':	{s: "float"}, // 	✓	✓	✓	},
'bgra8unorm-srgb': {s: "float"}, // 	✓	✓	✓	},
// 16-bit per component					
'r16uint': {s: "uint"}, // 	✓	✓		},
'r16sint': {s: "sint"}, // 	✓	✓		},
'r16float': {s: "float"}, // 	✓	✓	✓	},
'rg16uint': {s: "uint"}, // 	✓	✓		},
'rg16sint': {s: "sint"}, // 	✓	✓		},
'rg16float': {s: "float"}, // 	✓	✓	✓	},
'rgba16uint': {s: "uint"}, // 	✓	✓		✓},
'rgba16sint': {s: "sint"}, // 	✓	✓		✓},
'rgba16float': {s: "float"}, // 	✓	✓	✓	✓},
// 32-bit per component					
'r32uint': {s: "uint"}, // 	✓			✓},
'r32sint': {s: "sint"}, // 	✓			✓},
'r32float': {"unfilterable-float"	✓	✓		✓},
'rg32uint': {s: "uint"}, // 	✓			✓},
'rg32sint': {s: "sint"}, // 	✓			✓},
'rg32float': {"unfilterable-float"	✓			✓},
'rgba32uint': {s: "uint"}, // 	✓			✓},
'rgba32sint': {s: "sint"}, // 	✓			✓},
'rgba32float': {"unfilterable-float"	✓			✓},
// mixed component width					
'rgb10a2unorm': {s: "float"}, // 	✓	✓	✓	}
'rg11b10ufloat': {s: "float"}, // 		✓		}
// Format	Bytes per texel	Aspect	GPUTextureSampleType	Valid image copy source	Valid image copy destination
'stencil8': {1 − 4	stencil	"uint"	✓}
'depth16unorm': {2	depth	"depth"	✓}
'depth24plus': {4	depth	"depth"	✗}
'depth24plus': {stencil8	4 − 8	depth	"depth"	✗}
'stencil': {s: "uint"}, // 	✓}
'depth32float': {4	depth	"depth"	✓	✗}
'depth24unorm': {stencil8	4	depth	"depth"	✗}
'stencil': {s: "uint"}, // 	✓}
'depth32float': {stencil8}

// Format	Bytes per block	GPUTextureSampleType	Block Size	Feature
'rgb9e5ufloat': {c: 4, s: "float",	bpp: 4/(1*1)},

'bc1-rgba-unorm': {c: 4. s: "float", bpp: 8/(4 * 4) f: 'texture-compression-bc'},
'bc1-rgba-unorm-srgb': {c: 4. s: "float", bpp: 8/(4 * 4) f: 'texture-compression-bc'},
'bc2-rgba-unorm': {c: 4. s: "float", bpp: 16/(4 * 4) f: 'texture-compression-bc'},
'bc2-rgba-unorm-srgb': {c: 4. s: "float", bpp: 16/(4 * 4) f: 'texture-compression-bc'},
'bc3-rgba-unorm': {c: 4. s: "float", bpp: 16/(4 * 4) f: 'texture-compression-bc'},
'bc3-rgba-unorm-srgb': {c: 4. s: "float", bpp: 16/(4 * 4) f: 'texture-compression-bc'},
'bc4-r-unorm': {c: 1. s: "float", bpp: 8/(4 * 4) f: 'texture-compression-bc'},
'bc4-r-snorm': {c: 1. s: "float", bpp: 8/(4 * 4) f: 'texture-compression-bc'},
'bc5-rg-unorm': {c: 2. s: "float", bpp: 16/(4 * 4) f: 'texture-compression-bc'},
'bc5-rg-snorm': { },
'bc6h-rgb-ufloat': {	16 },
'bc6h-rgb-float': { },
'bc7-rgba-unorm': {	16 },
'bc7-rgba-unorm-srgb': { },

'etc2-rgb8unorm': {	8	"float"	4 × 4	texture-compression-etc2 },
'etc2-rgb8unorm-srgb': { },
'etc2-rgb8a1unorm': {	8 },
'etc2-rgb8a1unorm-srgb': { },
'etc2-rgba8unorm': {	16 },
'etc2-rgba8unorm-srgb': { },

'eac-r11unorm': {	8 },
'eac-r11snorm': { },
'eac-rg11unorm': {	16 },
'eac-rg11snorm': { },

'astc-4x4-unorm': {	16	"float"	4 × 4	texture-compression-astc },
'astc-4x4-unorm-srgb': { },
'astc-5x4-unorm': {	16	5 × 4 },
'astc-5x4-unorm-srgb': { },
'astc-5x5-unorm': {	16	5 × 5 },
'astc-5x5-unorm-srgb': { },
'astc-6x5-unorm': {	16	6 × 5 },
'astc-6x5-unorm-srgb': { },
'astc-6x6-unorm': {	16	6 × 6 },
'astc-6x6-unorm-srgb': { },
'astc-8x5-unorm': {	16	8 × 5 },
'astc-8x5-unorm-srgb': { },
'astc-8x6-unorm': {	16	8 × 6 },
'astc-8x6-unorm-srgb': { },
'astc-8x8-unorm': {	16	8 × 8 },
'astc-8x8-unorm-srgb': { },
'astc-10x5-unorm': {	16	10 × 5 },
'astc-10x5-unorm-srgb': { },
'astc-10x6-unorm': {	16	10 × 6 },
'astc-10x6-unorm-srgb': { },
'astc-10x8-unorm': {	16	10 × 8 },
'astc-10x8-unorm-srgb': { },
'astc-10x10-unorm': {	16	10 × 10 },
'astc-10x10-unorm-srgb': { },
'astc-12x10-unorm': {	16	12 × 10 },
'astc-12x10-unorm-srgb': { },
'astc-12x12-unorm': {	16 },
*/
