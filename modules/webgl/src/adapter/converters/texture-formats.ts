import type {TextureFormat, DeviceFeature, Device} from '@luma.gl/api';
import {decodeTextureFormat} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {isWebGL2} from '../../context/context/webgl-checks';

// Define local feature strings to optimize minification
const FEATURE_ASTC: DeviceFeature = 'texture-compression-astc';
const FEATURE_ETC2: DeviceFeature = 'texture-compression-etc2';
const FEATURE_ETC1: DeviceFeature = 'texture-compression-etc1-webgl';
const FEATURE_PVRTC: DeviceFeature = 'texture-compression-pvrtc-webgl';
const FEATURE_ATC: DeviceFeature = 'texture-compression-atc-webgl';

// Define local extension strings to optimize minification
const SRGB = 'EXT_sRGB';  // https://developer.mozilla.org/en-US/docs/Web/API/EXT_sRGB
const EXT_TEXTURE_NORM16 = 'EXT_texture_norm16';
const EXT_FLOAT_WEBGL1 = 'WEBGL_color_buffer_float';
const EXT_FLOAT_WEBGL2 = 'EXT_color_buffer_float';
const EXT_HALF_FLOAT_WEBGL1 = 'WEBGL_color_buffer_half_float';
// const DEPTH = 'WEBGL_depth_texture';

// DXT
const X_S3TC = 'WEBGL_compressed_texture_s3tc'; // BC1, BC2, BC3
const X_S3TC_SRGB = 'WEBGL_compressed_texture_s3tc_srgb'; // BC1, BC2, BC3
const X_RGTC = 'EXT_texture_compression_rgtc'; // BC4, BC5
const X_BPTC = 'EXT_texture_compression_bptc'; // BC6, BC7

const X_ETC2 = 'WEBGL_compressed_texture_etc'; // Renamed from 'WEBGL_compressed_texture_es3'

const X_ASTC = 'WEBGL_compressed_texture_astc';

const X_ETC1 = 'WEBGL_compressed_texture_etc1';
const X_PVRTC = 'WEBGL_compressed_texture_pvrtc';
const X_ATC = 'WEBGL_compressed_texture_atc';

// NOTES:
// - gl2: format requires WebGL2, when using a WebGL 1 context, color renderbuffer formats are limited
// - b (bytes per pixel), for memory usage calculations.
// - c (channels)
// - p (packed)

/** Map a format to webgl and constants */
type Format = {
  gl?: GL;
  /** If a different unsized format is needed in WebGL1 */
  gl1?: GL;
  gl1ext?: string;
  gl2ext?: string; // format requires WebGL2, when using a WebGL 1 context, color renderbuffer formats are limited

  b?: number; // (bytes per pixel), for memory usage calculations.
  /** channels */
  c?: number;
  bpp?: number;
  /** packed */
  p?: number;
  x?: string;  // compressed
  f?: DeviceFeature; // for compressed texture formats

  wgpu?: false; // If not supported on WebGPU

  types?: number[];

  dataFormat?: GL;
  attachment?: GL.DEPTH_ATTACHMENT | GL.STENCIL_ATTACHMENT | GL.DEPTH_STENCIL_ATTACHMENT;
};

// TABLES

const TEXTURE_FEATURES: [DeviceFeature, string[]][] = [
  ['texture-compression-bc', [X_S3TC, X_S3TC_SRGB, X_RGTC, X_BPTC]],
  ['texture-compression-bc5-webgl', [X_S3TC, X_S3TC_SRGB, X_RGTC]],
  ['texture-compression-etc2', [X_ETC2]],
  ['texture-compression-astc', [X_ASTC]],
  ['texture-compression-etc1-webgl', [X_ETC1]],
  ['texture-compression-pvrtc-webgl', [X_PVRTC]],
  ['texture-compression-atc-webgl', [X_ATC]]
];

export const TEXTURE_FORMATS: Record<TextureFormat, Format> = {
  // Unsized formats that leave the precision up to the driver.
  // TODO - Fix bpp constants
  // 'r8unorm-unsized': {gl: GL.LUMINANCE, b: 4, c: 2, bpp: 4},
  'rgb8unorm-unsized': {gl: GL.RGB, b: 4, c: 2, bpp: 4},
  'rgba8unorm-unsized': {gl: GL.RGBA, b: 4, c: 2, bpp: 4},
  // 'rgb8unorm-srgb-unsized': {gl: GL.SRGB_EXT, b: 4, c: 2, bpp: 4, x: SRGB},
  // 'rgba8unorm-srgb-unsized': {gl: GL.SRGB_ALPHA_EXT, b: 4, c: 2, bpp: 4, x: SRGB},

  // 8-bit formats
  'r8unorm': {gl: GL.R8, gl1: GL.LUMINANCE, b: 1, c: 1},
  'r8snorm': {gl: GL.R8_SNORM, b: 1, c: 1},
  'r8uint': {gl: GL.R8UI, b: 1, c: 1},
  'r8sint': {gl: GL.R8I, b: 1, c: 1},

  // 16-bit formats
  'rg8unorm': {gl: GL.RG8, b: 2, c: 2},
  'rg8snorm': {gl: GL.RG8_SNORM, b: 2, c: 2},
  'rg8uint': {gl: GL.RG8UI, b: 2, c: 2},
  'rg8sint': {gl: GL.RG8I, b: 2, c: 2},

  'r16uint': {gl: GL.R16UI, b: 2, c: 1},
  'r16sint': {gl: GL.R16I, b: 2, c: 1},
  'r16float': {gl: GL.R16F, b: 2, c: 1, gl2ext: EXT_FLOAT_WEBGL2},
  'r16unorm-webgl': {gl: GL.R16_EXT, b:2, c:1, gl2ext: EXT_TEXTURE_NORM16},
  'r16snorm-webgl': {gl: GL.R16_SNORM_EXT, b:2, c:1, gl2ext: EXT_TEXTURE_NORM16},

  // Packed 16-bit formats
  'rgba4unorm-webgl': {gl: GL.RGBA4, b: 2, c: 4, wgpu: false},
  'rgb565unorm-webgl': {gl: GL.RGB565, b: 2, c: 4, wgpu: false},
  'rgb5a1unorm-webgl': {gl: GL.RGB5_A1, b: 2, c: 4, wgpu: false},

  // 24-bit formats
  'rbg8unorm-webgl': {gl: GL.RGB8, b: 3, c: 3, wgpu: false},
  'rbg8snorm-webgl': {gl: GL.RGB8_SNORM, b: 3, c: 3, wgpu: false},

  // 32-bit formats  
  'rgba8unorm': {gl: GL.RGBA8, gl1: GL.RGBA, b: 4, c: 2, bpp: 4},
  'rgba8unorm-srgb': {gl: GL.SRGB8_ALPHA8, b: 4, c: 4, gl1ext: SRGB, bpp: 4},
  'rgba8snorm': {gl: GL.RGBA8_SNORM, b: 4, c: 4},
  'rgba8uint': {gl: GL.RGBA8UI, b: 4, c: 4, bpp: 4},
  'rgba8sint': {gl: GL.RGBA8I, b: 4, c: 4, bpp: 4},
  // reverse colors, webgpu only
  'bgra8unorm': {b: 4, c: 4},
  'bgra8unorm-srgb': {b: 4, c: 4},

  'rg16uint': {gl: GL.RG16UI, b: 4, c: 1, bpp: 4},
  'rg16sint': {gl: GL.RG16I, b: 4, c: 2, bpp: 4},
  // When using a WebGL 2 context and the EXT_color_buffer_float WebGL2 extension
  'rg16float': {gl: GL.RG16F, b: 4, c: 2, gl2ext: EXT_FLOAT_WEBGL2, bpp: 4},
  'rg16unorm-webgl': {gl: GL.RG16_EXT, b:2, c:2, gl2ext: EXT_TEXTURE_NORM16},
  'rg16snorm-webgl': {gl: GL.RG16_SNORM_EXT, b:2, c:2, gl2ext: EXT_TEXTURE_NORM16},

  'r32uint': {gl: GL.R32UI, b: 4, c: 1, bpp: 4},
  'r32sint': {gl: GL.R32I, b: 4, c: 1, bpp: 4},
  'r32float': {gl: GL.R32F, b: 4, c: 1, gl2ext: EXT_FLOAT_WEBGL2, bpp: 4},

  // Packed 32-bit formats
  'rgb9e5ufloat': {gl: GL.RGB9_E5, b: 4, c: 3, p: 1, gl1ext: EXT_HALF_FLOAT_WEBGL1},
  'rg11b10ufloat': {gl: GL.R11F_G11F_B10F, b: 4, c: 3, p: 1, gl2ext: EXT_FLOAT_WEBGL2},
  'rgb10a2unorm': {gl: GL.RGB10_A2, b: 4, c: 4, p: 1},
  // webgl2 only
  'rgb10a2unorm-webgl': {b: 4, c: 4, gl: GL.RGB10_A2UI, p: 1, wgpu: false, bpp: 4},

  // 48-bit formats
  'rgb16unorm-webgl': {gl: GL.RGB16_EXT, b:2, c:3, gl2ext: EXT_TEXTURE_NORM16},
  'rgb16snorm-webgl': {gl: GL.RGB16_SNORM_EXT, b:2, c:3, gl2ext: EXT_TEXTURE_NORM16},

  // 64-bit formats
  'rg32uint': {gl: GL.RG32UI, b: 8, c: 2},
  'rg32sint': {gl: GL.RG32I, b: 8, c: 2},
  'rg32float': {gl: GL.RG32F, b: 8, c: 2, gl2ext: EXT_FLOAT_WEBGL2},
  'rgba16uint': {gl: GL.RGBA16UI, b: 8, c: 4},
  'rgba16sint': {gl: GL.RGBA16I, b: 8, c: 4},
  'rgba16float': {gl: GL.RGBA16F, b: 8, c: 4, gl2ext: EXT_FLOAT_WEBGL2},
  'rgba16unorm-webgl': {gl: GL.RGBA16_EXT, b:2, c:4, gl2ext: EXT_TEXTURE_NORM16},
  'rgba16snorm-webgl': {gl: GL.RGBA16_SNORM_EXT, b:2, c:4, gl2ext: EXT_TEXTURE_NORM16},

  // 96-bit formats
  'rgb32float-webgl': {gl: GL.RGB32F, dataFormat: GL.RGB, types: [GL.FLOAT]},
  
  // 128-bit formats
  'rgba32uint': {gl: GL.RGBA32UI, b: 16, c: 4},
  'rgba32sint': {gl: GL.RGBA32I, b: 16, c: 4},
  'rgba32float': {gl: GL.RGBA32F, b: 16, c: 4, gl2ext: EXT_FLOAT_WEBGL2}, // gl1ext: EXT_FLOAT_WEBGL1

  // Depth and stencil formats
  'stencil8': {gl: GL.STENCIL_INDEX8, b: 1, c: 1, attachment: GL.STENCIL_ATTACHMENT}, // 8 stencil bits

  'depth16unorm': {gl: GL.DEPTH_COMPONENT16, b: 2, c: 1, attachment: GL.DEPTH_ATTACHMENT}, // 16 depth bits
  'depth24plus': {gl: GL.DEPTH_COMPONENT24, b: 3, c: 1, attachment: GL.DEPTH_ATTACHMENT},
  'depth32float': {gl: GL.DEPTH_COMPONENT32F, b: 4, c: 1, attachment: GL.DEPTH_ATTACHMENT},

  'depth24plus-stencil8': {b: 4, gl: GL.DEPTH_STENCIL, c: 2, p: 1, attachment: GL.DEPTH_STENCIL_ATTACHMENT},
  // "depth24unorm-stencil8" feature
  'depth24unorm-stencil8': {gl: GL.DEPTH24_STENCIL8, b: 4, c: 2, p: 1, attachment: GL.DEPTH_STENCIL_ATTACHMENT},
  // "depth32float-stencil8" feature
  "depth32float-stencil8": {gl: GL.DEPTH32F_STENCIL8, b: 5, c: 2, p: 1, attachment: GL.DEPTH_STENCIL_ATTACHMENT},

  // BC compressed formats: check device.features.has("texture-compression-bc");

  'bc1-rgb-unorm-webgl': {gl: GL.COMPRESSED_RGB_S3TC_DXT1_EXT, x: X_S3TC},
  'bc1-rgb-unorm-srgb-webgl': {gl: GL.COMPRESSED_SRGB_S3TC_DXT1_EXT, x: X_S3TC_SRGB},

  'bc1-rgba-unorm': {gl: GL.COMPRESSED_RGBA_S3TC_DXT1_EXT, x: X_S3TC},
  'bc1-rgba-unorm-srgb': {gl: GL.COMPRESSED_SRGB_S3TC_DXT1_EXT, x: X_S3TC_SRGB},
  'bc2-rgba-unorm': {gl: GL.COMPRESSED_RGBA_S3TC_DXT3_EXT, x: X_S3TC},
  'bc2-rgba-unorm-srgb': {gl: GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT, x: X_S3TC_SRGB},
  'bc3-rgba-unorm': {gl: GL.COMPRESSED_RGBA_S3TC_DXT5_EXT, x: X_S3TC},
  'bc3-rgba-unorm-srgb': {gl: GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT, x: X_S3TC_SRGB},
  'bc4-r-unorm': {gl: GL.COMPRESSED_RED_RGTC1_EXT, x: X_RGTC},
  'bc4-r-snorm': {gl: GL.COMPRESSED_SIGNED_RED_RGTC1_EXT, x: X_RGTC},
  'bc5-rg-unorm': {gl: GL.COMPRESSED_RED_GREEN_RGTC2_EXT, x: X_RGTC},
  'bc5-rg-snorm': {gl: GL.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT, x: X_RGTC},
  'bc6h-rgb-ufloat': {gl: GL.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT, x: X_BPTC},
  'bc6h-rgb-float': {gl: GL.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT, x: X_BPTC},
  'bc7-rgba-unorm': {gl: GL.COMPRESSED_RGBA_BPTC_UNORM_EXT, x: X_BPTC},
  'bc7-rgba-unorm-srgb': {gl: GL.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT, x: X_BPTC},

  // WEBGL_compressed_texture_etc: device.features.has("texture-compression-etc2")
  // Note: Supposedly guaranteed availability compressed formats in WebGL2, but through CPU decompression

  'etc2-rgb8unorm': {gl: GL.COMPRESSED_RGB8_ETC2, x: X_ETC2, f: FEATURE_ETC2},
  'etc2-rgb8unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ETC2, x: X_ETC2, f: FEATURE_ETC2},
  'etc2-rgb8a1unorm': {gl: GL.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2, x: X_ETC2, f: FEATURE_ETC2},
  'etc2-rgb8a1unorm-srgb': {gl: GL.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2, x: X_ETC2, f: FEATURE_ETC2},
  'etc2-rgba8unorm': {gl: GL.COMPRESSED_RGBA8_ETC2_EAC, x: X_ETC2, f: FEATURE_ETC2},
  'etc2-rgba8unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC, x: X_ETC2, f: FEATURE_ETC2},

  'eac-r11unorm': {gl: GL.COMPRESSED_R11_EAC, x: X_ETC2, f: FEATURE_ETC2},
  'eac-r11snorm': {gl: GL.COMPRESSED_SIGNED_R11_EAC, x: X_ETC2, f: FEATURE_ETC2},
  'eac-rg11unorm': {gl: GL.COMPRESSED_RG11_EAC, x: X_ETC2, f: FEATURE_ETC2},
  'eac-rg11snorm': {gl: GL.COMPRESSED_SIGNED_RG11_EAC, x: X_ETC2, f: FEATURE_ETC2},

  // X_ASTC compressed formats: device.features.has("texture-compression-astc")

  'astc-4x4-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_4x4_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-4x4-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-5x4-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_5x4_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-5x4-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-5x5-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_5x5_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-5x5-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-6x5-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_6x5_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-6x5-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-6x6-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_6x6_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-6x6-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-8x5-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_8x5_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-8x5-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-8x6-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_8x6_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-8x6-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-8x8-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_8x8_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-8x8-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-10x5-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_10x10_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-10x5-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-10x6-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_10x6_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-10x6-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-10x8-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_10x8_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-10x8-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-10x10-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_10x10_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-10x10-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-12x10-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_12x10_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-12x10-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-12x12-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_12x12_KHR, x: X_ASTC, f: FEATURE_ASTC},
  'astc-12x12-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR, x: X_ASTC, f: FEATURE_ASTC},

  // WEBGL_compressed_texture_pvrtc

  'pvrtc-rgb4unorm-webgl': {gl: GL.COMPRESSED_RGB_PVRTC_4BPPV1_IMG, x: X_PVRTC, f: FEATURE_PVRTC},
  'pvrtc-rgba4unorm-webgl': {gl: GL.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG, x: X_PVRTC, f: FEATURE_PVRTC},
  'pvrtc-rbg2unorm-webgl': {gl: GL.COMPRESSED_RGB_PVRTC_2BPPV1_IMG, x: X_PVRTC, f: FEATURE_PVRTC},
  'pvrtc-rgba2unorm-webgl': {gl: GL.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG, x: X_PVRTC, f: FEATURE_PVRTC},

  // WEBGL_compressed_texture_etc1

  'etc1-rbg-unorm-webgl': {gl: GL.COMPRESSED_RGB_ETC1_WEBGL, x: X_ETC1, f: FEATURE_ETC1},

  // WEBGL_compressed_texture_atc

  'atc-rgb-unorm-webgl': {gl: GL.COMPRESSED_RGB_ATC_WEBGL, x: X_ATC, f: FEATURE_ATC},
  'atc-rgba-unorm-webgl': {gl: GL.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL, x: X_ATC, f: FEATURE_ATC},
  'atc-rgbai-unorm-webgl': {gl: GL.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL, x: X_ATC, f: FEATURE_ATC}
};

type WebGLTextureInfo = {
  dataFormat: number;
  types: number[];
  gl2?: boolean;
  gl1?: boolean | string;
  compressed?: boolean;
}

/** Legal combinations for internalFormat, format and type */
export const WEBGL_TEXTURE_FORMATS: Record<string, WebGLTextureInfo> = {
  // Unsized texture format - more performance
  [GL.RGB]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_5_6_5]},
  // TODO: format: GL.RGBA type: GL.FLOAT is supported in WebGL1 when 'OES_texure_float' is suported
  // we need to update this table structure to specify extensions (gl1ext: 'OES_texure_float', gl2ext: false) for each type.
  [GL.RGBA]: {
    dataFormat: GL.RGBA,
    types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_4_4_4_4, GL.UNSIGNED_SHORT_5_5_5_1]
  },
  [GL.ALPHA]: {dataFormat: GL.ALPHA, types: [GL.UNSIGNED_BYTE]},
  [GL.LUMINANCE]: {dataFormat: GL.LUMINANCE, types: [GL.UNSIGNED_BYTE]},
  [GL.LUMINANCE_ALPHA]: {dataFormat: GL.LUMINANCE_ALPHA, types: [GL.UNSIGNED_BYTE]},

  // 32 bit floats
  [GL.R32F]: {dataFormat: GL.RED, types: [GL.FLOAT], gl2: true},
  [GL.RG32F]: {dataFormat: GL.RG, types: [GL.FLOAT], gl2: true},
  [GL.RGB32F]: {dataFormat: GL.RGB, types: [GL.FLOAT], gl2: true},
  [GL.RGBA32F]: {dataFormat: GL.RGBA, types: [GL.FLOAT], gl2: true},

  // [GL.DEPTH_COMPONENT]: {types: [GL.UNSIGNED_SHORT, GL.UNSIGNED_INT, GL.UNSIGNED_INT_24_8], gl1ext: DEPTH},
  // [GL.DEPTH_STENCIL]: {gl1ext: DEPTH},

  /*
  // Sized texture format
  // R
  [GL.R8]: {dataFormat: GL.RED, types: [GL.UNSIGNED_BYTE], gl2: true},
  [GL.R16F]: {dataFormat: GL.RED, types: [GL.HALF_FLOAT, GL.FLOAT], gl2: true},
  [GL.R8UI]: {dataFormat: GL.RED_INTEGER, types: [GL.UNSIGNED_BYTE], gl2: true},
  // // RG
  [GL.RG8]: {dataFormat: GL.RG, types: [GL.UNSIGNED_BYTE], gl2: true},
  [GL.RG16F]: {dataFormat: GL.RG, types: [GL.HALF_FLOAT, GL.FLOAT], gl2: true},
  [GL.RG8UI]: {dataFormat: GL.RG_INTEGER, types: [GL.UNSIGNED_BYTE], gl2: true},
  // // RGB
  [GL.RGB8]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE], gl2: true},
  [GL.SRGB8]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE], gl2: true, gl1ext: SRGB},
  [GL.RGB16F]: {dataFormat: GL.RGB, types: [GL.HALF_FLOAT, GL.FLOAT], gl2: true, gl1ext: EXT_HALF_FLOAT_WEBGL1},
  [GL.RGB8UI]: {dataFormat: GL.RGB_INTEGER, types: [GL.UNSIGNED_BYTE], gl2: true},
  // // RGBA

  [GL.RGB565]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_5_6_5], gl2: true},
  [GL.R11F_G11F_B10F]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_INT_10F_11F_11F_REV, GL.HALF_FLOAT, GL.FLOAT], gl2: true},
  [GL.RGB9_E5]: {dataFormat: GL.RGB, types: [GL.HALF_FLOAT, GL.FLOAT], gl2: true, gl1ext: EXT_HALF_FLOAT_WEBGL1},
  [GL.RGBA8]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE], gl2: true},
  [GL.SRGB8_ALPHA8]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE], gl2: true, gl1ext: SRGB},
  [GL.RGB5_A1]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_5_5_5_1], gl2: true},
  [GL.RGBA4]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_4_4_4_4], gl2: true},
  [GL.RGBA16F]: {dataFormat: GL.RGBA, types: [GL.HALF_FLOAT, GL.FLOAT], gl2: true, gl1ext: EXT_HALF_FLOAT_WEBGL1},
  [GL.RGBA8UI]: {dataFormat: GL.RGBA_INTEGER, types: [GL.UNSIGNED_BYTE], gl2: true}
  */
};

// legacy
export const DATA_FORMAT_CHANNELS = {
  [GL.RED]: 1,
  [GL.RED_INTEGER]: 1,
  [GL.RG]: 2,
  [GL.RG_INTEGER]: 2,
  [GL.RGB]: 3,
  [GL.RGB_INTEGER]: 3,
  [GL.RGBA]: 4,
  [GL.RGBA_INTEGER]: 4,
  [GL.DEPTH_COMPONENT]: 1,
  [GL.DEPTH_STENCIL]: 1,
  [GL.ALPHA]: 1,
  [GL.LUMINANCE]: 1,
  [GL.LUMINANCE_ALPHA]: 2
};

// legacy
export const TYPE_SIZES = {
  [GL.FLOAT]: 4,
  [GL.UNSIGNED_INT]: 4,
  [GL.INT]: 4,
  [GL.UNSIGNED_SHORT]: 2,
  [GL.SHORT]: 2,
  [GL.HALF_FLOAT]: 2,
  [GL.BYTE]: 1,
  [GL.UNSIGNED_BYTE]: 1
};

// FUNCTIONS

/** Checks if a texture format is supported */
export function isTextureFormatSupported(gl: WebGLRenderingContext, format: TextureFormat | GL): boolean {
  if (typeof format === 'number') {
    return isFormatSupportedWebGL(gl, format);
  }
  const info = TEXTURE_FORMATS[format];
  if (info) {
    // Check that we have a GL constant
    if (isWebGL2(gl) ? info.gl === undefined : info.gl1 === undefined) {
      return false;
    }
    // Check extensions
    const extension = info.x || (isWebGL2(gl) ? info.gl2ext || info.gl1ext : info.gl1ext);
    if (extension) {
      return Boolean(gl.getExtension(extension));
    }
    // if (info.gl1 === undefined && info.gl2 === undefined) {
    //   // No info - always supported
    // }
    return true;
  }
  return false;
}

/** @deprecated */
function isFormatSupportedWebGL(gl, format: GL): boolean {
  const info = WEBGL_TEXTURE_FORMATS[format];
  if (!info) {
    return false;
  }
  if (info.gl1 === undefined && info.gl2 === undefined) {
    // No info - always supported
    return true;
  }
  const value = isWebGL2(gl) ? info.gl2 || info.gl1 : info.gl1;
  return typeof value === 'string' ? gl.getExtension(value) : value;
}

/** Checks whether linear filtering (interpolated sampling) is available for floating point textures */
export function isTextureFormatFilterable(gl: WebGLRenderingContext, format: TextureFormat | GL): boolean {
  if (!isTextureFormatSupported(gl, format)) {
    return false;
  }
  if (typeof format === 'number') {
    return isTextureFormatFilterableWebGL(gl, format);
  }
  try {
    const decoded = decodeTextureFormat(format);
    if (decoded.signed) {
      return false;
    }
  } catch {
    return false;
  }
  if (format.endsWith('32float')) {
    return Boolean(gl.getExtension('OES_texture_float_linear'));
  }
  if (format.endsWith('16float')) {
    return Boolean(gl.getExtension('OES_texture_half_float_linear'));
  }
  // if (typeof format === 'string') {
  //   if (format === 'rgba32float') {
  //     return gl.device.features.has('texture-renderable-rgba32float-webgl');
  //   }
  //   if (format.endsWith('32float')) {
  //     return gl.device.features.has('texture-renderable-float32-webgl');
  //   }
  //   if (format.endsWith('16float')) {
  //     return gl.device.features.has('texture-renderable-float16-webgl');
  //   }
  // }
  return true;
}

/** @deprecated */
function isTextureFormatFilterableWebGL(gl, format: GL): boolean {
  if (!isFormatSupportedWebGL(gl, format)) {
    return false;
  }
  const info = WEBGL_TEXTURE_FORMATS[format];
  switch (info && info.types[0]) {
    // Both WebGL1 and WebGL2?
    case GL.FLOAT:
      return gl.getExtension('OES_texture_float_linear');
    // Not in WebGL2?
    case GL.HALF_FLOAT:
      return gl.getExtension('OES_texture_half_float_linear');
    default:
      return true;
  }
}

export function isTextureFormatRenderable(gl: WebGLRenderingContext, format: TextureFormat | GL): boolean {
  if (!isTextureFormatSupported(gl, format)) {
    return false;
  }
  if (typeof format === 'number') {
    return false; // isTextureFormatFilterableWebGL(gl, format);
  }
  // TODO depends on device...
  return true;
}

/** Return a list of texture feature strings (for Device.features). Mainly compressed texture support */
export function getTextureFeatures(gl: WebGLRenderingContext): DeviceFeature[] {
  const features: DeviceFeature[] = [];
  for (const [feature, extensions] of TEXTURE_FEATURES) {
    if (extensions.every(extension => gl.getExtension(extension))) {
      features.push(feature);
    }
  }
  return features;
}

/**
 * Converts WebGPU string style texture formats to GL constants
 * Pass through GL constants
 */
export function getWebGLTextureFormat(format: TextureFormat | GL): GL | undefined {
  if (typeof format === 'number') {
    return format;
  }
  const webglFormat = TEXTURE_FORMATS[format]?.gl;
  if (webglFormat === undefined) {
    throw new Error(`Unsupported texture format ${format}`);
  }
  return webglFormat;
}

export function getWebGLTextureParameters(format: TextureFormat | GL) {
  if (typeof format !== 'number') {
    const webglFormat = getWebGLTextureFormat(format);
    const decoded = decodeTextureFormat(format);
    return {
      format: webglFormat,
      dataFormat: getWebGLPixelDataFormat(decoded.format, decoded.normalized, webglFormat),
      type: getWebGLDataType(decoded.dataType),
      // @ts-expect-error
      compressed: decoded.compressed
    };
  }
  const textureFormat = WEBGL_TEXTURE_FORMATS[format];
  if (!textureFormat) {
    throw new Error(`Unsupported texture format ${format}`);
  }
  return {
    dataFormat: textureFormat.dataFormat,
    type: textureFormat.types[0],
    compressed: textureFormat.compressed
  };
}

export function getDepthStencilAttachment(
  format: TextureFormat | GL
): GL.DEPTH_ATTACHMENT | GL.STENCIL_ATTACHMENT | GL.DEPTH_STENCIL_ATTACHMENT
{
  if (typeof format === 'number') {
    // TODO
    throw new Error('unsupported depth stencil format')
  }
  const info = TEXTURE_FORMATS[format];
  const attachment = info.attachment;
  if (!attachment) {
    throw new Error('not a depth stencil format')
  }
  return attachment;
}

/** 
 * function to test if Float 32 bit format texture can be bound as color attachment
 * @todo Generalize to check arbitrary formats?
 */
export function _checkFloat32ColorAttachment(gl: WebGLRenderingContext) {
  let texture: WebGLTexture;
  let framebuffer: WebGLFramebuffer;
  try {
    const texture = gl.createTexture();
    gl.bindTexture(GL.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(GL.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0);
    const status = gl.checkFramebufferStatus(GL.FRAMEBUFFER) === GL.FRAMEBUFFER_COMPLETE;
    return status;
  } finally {
    gl.deleteTexture(texture);
    gl.deleteFramebuffer(framebuffer);
  }
}


// DATA TYPE HELPERS

function getWebGLPixelDataFormat(dataFormat: string, normalized: boolean, format: GL): GL {
  // WebGL1 formats use same internalFormat
  if (format === GL.RGBA || format === GL.RGB) {
    return format;
  }
  switch (dataFormat) {
    case 'r': return normalized ? GL.RED : GL.RED_INTEGER;
    case 'rg': return normalized ? GL.RG : GL.RG_INTEGER;
    case 'rgb': return normalized ? GL.RGB : GL.RGB_INTEGER;
    case 'rgba': return normalized ? GL.RGB : GL.RGBA_INTEGER;
    default: return GL.RGBA;
  }
}

function getWebGLDataType(dataType: string): GL {
  switch (dataType) {
    case 'uint8': return GL.UNSIGNED_BYTE;
    case 'sint8': return GL.BYTE;
    case 'uint16': return GL.UNSIGNED_SHORT;
    case 'sint16': return GL.SHORT;
    case 'uint32': return GL.UNSIGNED_INT;
    case 'sint32': return GL.INT;
    case 'float16': return GL.HALF_FLOAT;
    case 'float32': return GL.FLOAT;
    default: return GL.UNSIGNED_BYTE;
  }
}

