// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TextureFormat, CompressedTextureFormat} from './texture-formats';
import {VertexType} from './vertex-formats';
import {decodeVertexType} from './decode-data-type';
import {TextureFormatInfo} from './texture-format-info';

import {getTextureFormatDefinition} from './texture-format-table';

// prettier-ignore
const COMPRESSED_TEXTURE_FORMAT_PREFIXES = [
  'bc1', 'bc2', 'bc3', 'bc4', 'bc5', 'bc6', 'bc7', 'etc1', 'etc2', 'eac', 'atc', 'astc', 'pvrtc'
];

const RGB_FORMAT_REGEX = /^(r|rg|rgb|rgba|bgra)([0-9]*)([a-z]*)(-srgb)?(-webgl)?$/;

/**
 * Returns true if a texture format is GPU compressed
 */
export function isTextureFormatCompressed(
  format: TextureFormat
): format is CompressedTextureFormat {
  return COMPRESSED_TEXTURE_FORMAT_PREFIXES.some(prefix => (format as string).startsWith(prefix));
}

/**
 * Decodes a texture format, returning e.g. attatchment type, components, byte length and flags (integer, signed, normalized)
 */
export function decodeTextureFormat(format: TextureFormat): TextureFormatInfo {
  let formatInfo: TextureFormatInfo = decodeTextureFormatUsingTable(format);

  if (isTextureFormatCompressed(format)) {
    formatInfo.channels = 'rgb';
    formatInfo.components = 3;
    formatInfo.bytesPerPixel = 1;
    formatInfo.srgb = false;
    formatInfo.compressed = true;

    const blockSize = getCompressedTextureBlockSize(format);
    if (blockSize) {
      formatInfo.blockWidth = blockSize.blockWidth;
      formatInfo.blockHeight = blockSize.blockHeight;
    }
  }

  // Fill in missing information that can be derived from the format string
  const matches = RGB_FORMAT_REGEX.exec(format as string);
  if (matches) {
    const [, channels, length, type, srgb, suffix] = matches;
    const dataType = `${type}${length}` as VertexType;
    const decodedType = decodeVertexType(dataType);
    const bits = decodedType.byteLength * 8;
    const components = channels.length as 1 | 2 | 3 | 4;
    const bitsPerChannel: [number, number, number, number] = [
      bits,
      components >= 2 ? bits : 0,
      components >= 3 ? bits : 0,
      components >= 4 ? bits : 0
    ];

    formatInfo = {
      format,
      attachment: formatInfo.attachment,
      dataType: decodedType.dataType,
      components,
      channels: channels as 'r' | 'rg' | 'rgb' | 'rgba',
      integer: decodedType.integer,
      signed: decodedType.signed,
      normalized: decodedType.normalized,
      bitsPerChannel,
      bytesPerPixel: decodedType.byteLength * channels.length,
      packed: formatInfo.packed,
      srgb: formatInfo.srgb
    };

    if (suffix === '-webgl') {
      formatInfo.webgl = true;
    }
    // dataType - overwritten by decodedType
    if (srgb === '-srgb') {
      formatInfo.srgb = true;
    }
  }

  if (format.endsWith('-webgl')) {
    formatInfo.webgl = true;
  }
  if (format.endsWith('-srgb')) {
    formatInfo.srgb = true;
  }

  return formatInfo;
}

/** Decode texture format info from the table */
function decodeTextureFormatUsingTable(format: TextureFormat): TextureFormatInfo {
  const info = getTextureFormatDefinition(format);

  const bytesPerPixel = info.bytesPerPixel || 1;
  const bitsPerChannel = info.bitsPerChannel || [8, 8, 8, 8];
  delete info.bitsPerChannel;
  delete info.bytesPerPixel;
  delete info.f;
  delete info.render;
  delete info.filter;
  delete info.blend;
  delete info.store;

  const formatInfo: TextureFormatInfo = {
    ...info,
    format,
    attachment: info.attachment || 'color',
    channels: info.channels || 'r',
    components: (info.components || info.channels?.length || 1) as 1 | 2 | 3 | 4,
    bytesPerPixel,
    bitsPerChannel,
    dataType: info.dataType || 'uint8',
    srgb: info.srgb ?? false,
    packed: info.packed ?? false,
    webgl: info.webgl ?? false,
    integer: info.integer ?? false,
    signed: info.signed ?? false,
    normalized: info.normalized ?? false,
    compressed: info.compressed ?? false
  };

  return formatInfo;
}

/** Parses ASTC block widths from format string */
function getCompressedTextureBlockSize(
  format: CompressedTextureFormat
): {blockWidth: number; blockHeight: number} | null {
  const REGEX = /.*-(\d+)x(\d+)-.*/;
  const matches = REGEX.exec(format as string);
  if (matches) {
    const [, blockWidth, blockHeight] = matches;
    return {blockWidth: Number(blockWidth), blockHeight: Number(blockHeight)};
  }
  return null;
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
