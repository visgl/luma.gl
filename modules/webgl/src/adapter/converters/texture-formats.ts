import type {TextureFormat, DeviceFeature, Device} from '@luma.gl/api';
import {decodeTextureFormat} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {isWebGL2} from '../../context/context/webgl-checks';

// TEXTURE FEATURES

// Define local device feature strings to optimize minification
const texture_compression_bc: DeviceFeature = 'texture-compression-bc';
const texture_compression_astc: DeviceFeature = 'texture-compression-astc';
const texture_compression_etc2: DeviceFeature = 'texture-compression-etc2';
const texture_compression_etc1_webgl: DeviceFeature = 'texture-compression-etc1-webgl';
const texture_compression_pvrtc_webgl: DeviceFeature = 'texture-compression-pvrtc-webgl';
const texture_compression_atc_webgl: DeviceFeature = 'texture-compression-atc-webgl';

// Define local webgl extension strings to optimize minification
const X_S3TC = 'WEBGL_compressed_texture_s3tc'; // BC1, BC2, BC3
const X_S3TC_SRGB = 'WEBGL_compressed_texture_s3tc_srgb'; // BC1, BC2, BC3
const X_RGTC = 'EXT_texture_compression_rgtc'; // BC4, BC5
const X_BPTC = 'EXT_texture_compression_bptc'; // BC6, BC7
const X_ETC2 = 'WEBGL_compressed_texture_etc'; // Renamed from 'WEBGL_compressed_texture_es3'
const X_ASTC = 'WEBGL_compressed_texture_astc';
const X_ETC1 = 'WEBGL_compressed_texture_etc1';
const X_PVRTC = 'WEBGL_compressed_texture_pvrtc';
const X_ATC = 'WEBGL_compressed_texture_atc';

// Define local webgl extension strings to optimize minification
const EXT_SRGB = 'EXT_sRGB'; // https://developer.mozilla.org/en-US/docs/Web/API/EXT_sRGB
const EXT_TEXTURE_NORM16 = 'EXT_texture_norm16';
const EXT_FLOAT_WEBGL1 = 'WEBGL_color_buffer_float';
const EXT_FLOAT_RENDER_WEBGL2 = 'EXT_color_buffer_float';
const EXT_HALF_FLOAT_WEBGL1 = 'WEBGL_color_buffer_half_float';
// const DEPTH = 'WEBGL_depth_texture';

const checkExtension = (gl: WebGLRenderingContext, extension: string): boolean =>
  gl.getExtension(extension);
const checkExtensions = (gl: WebGLRenderingContext, extensions: string[]): boolean =>
  extensions.every((extension) => gl.getExtension(extension));

// prettier-ignore
const TEXTURE_FEATURE_CHECKS: Partial<Record<DeviceFeature, (gl: WebGLRenderingContext) => boolean> > = {
  'texture-blend-float-webgl1': (gl) => isWebGL2(gl) ? true : checkExtension(gl, 'EXT_float_blend'),
  'texture-formats-srgb-webgl1': (gl) => (isWebGL2(gl) ? true : checkExtension(gl, EXT_SRGB)),
  'texture-formats-depth-webgl1': (gl) => isWebGL2(gl) ? true : checkExtension(gl, 'WEBGL_depth_texture'),
  'texture-formats-float32-webgl1': (gl) => isWebGL2(gl) ? true : checkExtension(gl, 'OES_texture_float'),
  'texture-formats-float16-webgl1': (gl) => isWebGL2(gl) ? true : checkExtension(gl, 'OES_texture_half_float'),
  'texture-formats-norm16-webgl': (gl) => isWebGL2(gl) ? checkExtension(gl, EXT_TEXTURE_NORM16) : false,
  'texture-filter-linear-float32-webgl': (gl) => checkExtension(gl, 'OES_texture_float_linear'),
  'texture-filter-linear-float16-webgl': (gl) => checkExtension(gl, 'OES_texture_half_float_linear'),
  'texture-filter-anisotropic-webgl': (gl) => checkExtension(gl, 'EXT_texture_filter_anisotropic'),
  'texture-renderable-float32-webgl': (gl) => checkExtension(gl, 'EXT_color_buffer_float'), // [false, 'EXT_color_buffer_float'],
  'texture-renderable-float16-webgl': (gl) => checkExtension(gl, 'EXT_color_buffer_half_float'),

  'texture-compression-bc': (gl) => checkExtensions(gl, [X_S3TC, X_S3TC_SRGB, X_RGTC, X_BPTC]),
  'texture-compression-bc5-webgl': (gl) => checkExtensions(gl, [X_RGTC]),
  // 'texture-compression-bc7-webgl': gl => checkExtensions(gl, [X_BPTC]),
  // 'texture-compression-bc3-srgb-webgl': gl => checkExtensions(gl, [X_S3TC_SRGB]),
  // 'texture-compression-bc3-webgl': gl => checkExtensions(gl, [X_S3TC]),
  'texture-compression-etc2': (gl) => checkExtensions(gl, [X_ETC2]),
  'texture-compression-astc': (gl) => checkExtensions(gl, [X_ASTC]),
  'texture-compression-etc1-webgl': (gl) => checkExtensions(gl, [X_ETC1]),
  'texture-compression-pvrtc-webgl': (gl) => checkExtensions(gl, [X_PVRTC]),
  'texture-compression-atc-webgl': (gl) => checkExtensions(gl, [X_ATC])
};

export function checkTextureFeature(gl: WebGLRenderingContext, feature: DeviceFeature): boolean {
  return TEXTURE_FEATURE_CHECKS[feature]?.(gl);
}

const checkTextureFeatures = (gl: WebGLRenderingContext, features: DeviceFeature[]): boolean =>
  features.every((feature) => checkTextureFeature(gl, feature));

/** Return a list of texture feature strings (for Device.features). Mainly compressed texture support */
export function getTextureFeatures(gl: WebGLRenderingContext): DeviceFeature[] {
  const textureFeatures = Object.keys(TEXTURE_FEATURE_CHECKS) as DeviceFeature[];
  return textureFeatures.filter((feature) => checkTextureFeature(gl, feature));
}

// TEXTURE FORMATS

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
  x?: string; // compressed
  f?: DeviceFeature; // for compressed texture formats
  render?: DeviceFeature; // renderable if extension is present
  filter?: DeviceFeature;

  wgpu?: false; // If not supported on WebGPU

  types?: number[];

  dataFormat?: GL;
  attachment?: GL.DEPTH_ATTACHMENT | GL.STENCIL_ATTACHMENT | GL.DEPTH_STENCIL_ATTACHMENT;
};

// TABLES

/** Legal combinations for internalFormat, format and type *
// [GL.DEPTH_COMPONENT]: {types: [GL.UNSIGNED_SHORT, GL.UNSIGNED_INT, GL.UNSIGNED_INT_24_8], gl1ext: DEPTH},
// [GL.DEPTH_STENCIL]: {gl1ext: DEPTH},
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
[GL.SRGB8]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE], gl2: true, gl1ext: EXT_SRGB},
[GL.RGB16F]: {dataFormat: GL.RGB, types: [GL.HALF_FLOAT, GL.FLOAT], gl2: true, gl1ext: EXT_HALF_FLOAT_WEBGL1},
[GL.RGB8UI]: {dataFormat: GL.RGB_INTEGER, types: [GL.UNSIGNED_BYTE], gl2: true},
// // RGBA

[GL.RGB565]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_5_6_5], gl2: true},
[GL.R11F_G11F_B10F]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_INT_10F_11F_11F_REV, GL.HALF_FLOAT, GL.FLOAT], gl2: true},
[GL.RGB9_E5]: {dataFormat: GL.RGB, types: [GL.HALF_FLOAT, GL.FLOAT], gl2: true, gl1ext: EXT_HALF_FLOAT_WEBGL1},
[GL.RGBA8]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE], gl2: true},
[GL.SRGB8_ALPHA8]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE], gl2: true, gl1ext: EXT_SRGB},
[GL.RGB5_A1]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_5_5_5_1], gl2: true},
[GL.RGBA4]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_4_4_4_4], gl2: true},
[GL.RGBA16F]: {dataFormat: GL.RGBA, types: [GL.HALF_FLOAT, GL.FLOAT], gl2: true, gl1ext: EXT_HALF_FLOAT_WEBGL1},
[GL.RGBA8UI]: {dataFormat: GL.RGBA_INTEGER, types: [GL.UNSIGNED_BYTE], gl2: true}
*/

/** Texture format data */
// prettier-ignore
export const TEXTURE_FORMATS: Record<TextureFormat, Format> = {
  // Unsized formats that leave the precision up to the driver.
  // TODO - Fix bpp constants
  // 'r8unorm-unsized': {gl: GL.LUMINANCE, b: 4, c: 2, bpp: 4},
  'rgb8unorm-unsized': {gl: GL.RGB, gl1: GL.RGB, b: 4, c: 2, bpp: 4,
    dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_5_6_5]},
  'rgba8unorm-unsized': {gl: GL.RGBA, gl1: GL.RGBA, b: 4, c: 2, bpp: 4,
    dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_4_4_4_4, GL.UNSIGNED_SHORT_5_5_5_1]},
  // 'rgb8unorm-srgb-unsized': {gl: GL.SRGB_EXT, b: 4, c: 2, bpp: 4, gl1Ext: SRGB},
  // 'rgba8unorm-srgb-unsized': {gl: GL.SRGB_ALPHA_EXT, b: 4, c: 2, bpp: 4, gl1Ext: SRGB},

  // 8-bit formats
  'r8unorm': {gl: GL.R8, b: 1, c: 1},
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
  'r16float': {gl: GL.R16F, b: 2, c: 1, render: 'texture-renderable-float16-webgl', filter: 'texture-filter-linear-float16-webgl'},
  'r16unorm-webgl': {gl: GL.R16_EXT, b:2, c:1, f: 'texture-formats-norm16-webgl'},
  'r16snorm-webgl': {gl: GL.R16_SNORM_EXT, b:2, c:1, f: 'texture-formats-norm16-webgl'},

  // Packed 16-bit formats
  'rgba4unorm-webgl': {gl: GL.RGBA4, b: 2, c: 4, wgpu: false},
  'rgb565unorm-webgl': {gl: GL.RGB565, b: 2, c: 4, wgpu: false},
  'rgb5a1unorm-webgl': {gl: GL.RGB5_A1, b: 2, c: 4, wgpu: false},

  // 24-bit formats
  'rbg8unorm-webgl': {gl: GL.RGB8, b: 3, c: 3, wgpu: false},
  'rbg8snorm-webgl': {gl: GL.RGB8_SNORM, b: 3, c: 3, wgpu: false},

  // 32-bit formats  
  'rgba8unorm': {gl: GL.RGBA8, gl1: GL.RGBA, b: 4, c: 2, bpp: 4},
  'rgba8unorm-srgb': {gl: GL.SRGB8_ALPHA8, gl1: GL.SRGB_ALPHA_EXT, b: 4, c: 4, gl1ext: EXT_SRGB, bpp: 4},
  'rgba8snorm': {gl: GL.RGBA8_SNORM, b: 4, c: 4},
  'rgba8uint': {gl: GL.RGBA8UI, b: 4, c: 4, bpp: 4},
  'rgba8sint': {gl: GL.RGBA8I, b: 4, c: 4, bpp: 4},
  // reverse colors, webgpu only
  'bgra8unorm': {b: 4, c: 4},
  'bgra8unorm-srgb': {b: 4, c: 4},

  'rg16uint': {gl: GL.RG16UI, b: 4, c: 1, bpp: 4},
  'rg16sint': {gl: GL.RG16I, b: 4, c: 2, bpp: 4},
  // When using a WebGL 2 context and the EXT_color_buffer_float WebGL2 extension
  'rg16float': {gl: GL.RG16F, bpp: 4, b: 4, c: 2, render: 'texture-renderable-float16-webgl', filter: 'texture-filter-linear-float16-webgl'},
  'rg16unorm-webgl': {gl: GL.RG16_EXT, b:2, c:2, f: 'texture-formats-norm16-webgl'},
  'rg16snorm-webgl': {gl: GL.RG16_SNORM_EXT, b:2, c:2, f: 'texture-formats-norm16-webgl'},

  'r32uint': {gl: GL.R32UI, b: 4, c: 1, bpp: 4},
  'r32sint': {gl: GL.R32I, b: 4, c: 1, bpp: 4},
  'r32float': {gl: GL.R32F, bpp: 4, b: 4, c: 1, render: 'texture-renderable-float32-webgl', filter: 'texture-filter-linear-float32-webgl'},

  // Packed 32-bit formats
  'rgb9e5ufloat': {gl: GL.RGB9_E5, b: 4, c: 3, p: 1, render: 'texture-renderable-float16-webgl', filter: 'texture-filter-linear-float16-webgl'},
  'rg11b10ufloat': {gl: GL.R11F_G11F_B10F, b: 4, c: 3, p: 1,render: 'texture-renderable-float32-webgl'},
  'rgb10a2unorm': {gl: GL.RGB10_A2, b: 4, c: 4, p: 1},
  // webgl2 only
  'rgb10a2unorm-webgl': {b: 4, c: 4, gl: GL.RGB10_A2UI, p: 1, wgpu: false, bpp: 4},

  // 48-bit formats
  'rgb16unorm-webgl': {gl: GL.RGB16_EXT, b:2, c:3, f: 'texture-formats-norm16-webgl'},
  'rgb16snorm-webgl': {gl: GL.RGB16_SNORM_EXT, b:2, c:3, f: 'texture-formats-norm16-webgl'},

  // 64-bit formats
  'rg32uint': {gl: GL.RG32UI, b: 8, c: 2},
  'rg32sint': {gl: GL.RG32I, b: 8, c: 2},
  'rg32float': {gl: GL.RG32F, b: 8, c: 2, render: 'texture-renderable-float32-webgl', filter: 'texture-filter-linear-float32-webgl'},
  'rgba16uint': {gl: GL.RGBA16UI, b: 8, c: 4},
  'rgba16sint': {gl: GL.RGBA16I, b: 8, c: 4},
  'rgba16float': {gl: GL.RGBA16F, gl1: GL.RGBA, b: 8, c: 4, render: 'texture-renderable-float16-webgl', filter: 'texture-filter-linear-float16-webgl'},
  'rgba16unorm-webgl': {gl: GL.RGBA16_EXT, b:2, c:4, f: 'texture-formats-norm16-webgl'},
  'rgba16snorm-webgl': {gl: GL.RGBA16_SNORM_EXT, b:2, c:4, f: 'texture-formats-norm16-webgl'},

  // 96-bit formats (deprecated!)
  'rgb32float-webgl': {gl: GL.RGB32F, gl1: GL.RGB, render: 'texture-renderable-float32-webgl', filter: 'texture-filter-linear-float32-webgl',
    gl2ext: EXT_FLOAT_RENDER_WEBGL2,  gl1ext: EXT_FLOAT_WEBGL1, // WebGL1 render buffers are supported with GL.RGB32F
    dataFormat: GL.RGB, types: [GL.FLOAT]},
  
  // 128-bit formats
  'rgba32uint': {gl: GL.RGBA32UI, b: 16, c: 4},
  'rgba32sint': {gl: GL.RGBA32I, b: 16, c: 4},
  'rgba32float': {gl: GL.RGBA32F, gl1: GL.RGBA, b: 16, c: 4, render: 'texture-renderable-float32-webgl', filter: 'texture-filter-linear-float32-webgl'},

  // Depth and stencil formats
  'stencil8': {gl: GL.STENCIL_INDEX8, b: 1, c: 1, attachment: GL.STENCIL_ATTACHMENT}, // 8 stencil bits

  'depth16unorm': {gl: GL.DEPTH_COMPONENT16, gl1: GL.DEPTH_COMPONENT16, b: 2, c: 1, attachment: GL.DEPTH_ATTACHMENT}, // 16 depth bits
  'depth24plus': {gl: GL.DEPTH_COMPONENT24, b: 3, c: 1, attachment: GL.DEPTH_ATTACHMENT},
  'depth32float': {gl: GL.DEPTH_COMPONENT32F, b: 4, c: 1, attachment: GL.DEPTH_ATTACHMENT},

  'depth24plus-stencil8': {b: 4, gl: GL.UNSIGNED_INT_24_8, gl1: GL.DEPTH_STENCIL, c: 2, p: 1, attachment: GL.DEPTH_STENCIL_ATTACHMENT},
  // "depth24unorm-stencil8" feature
  'depth24unorm-stencil8': {gl: GL.DEPTH24_STENCIL8, b: 4, c: 2, p: 1, attachment: GL.DEPTH_STENCIL_ATTACHMENT},
  // "depth32float-stencil8" feature
  "depth32float-stencil8": {gl: GL.DEPTH32F_STENCIL8, b: 5, c: 2, p: 1, attachment: GL.DEPTH_STENCIL_ATTACHMENT},

  // BC compressed formats: check device.features.has("texture-compression-bc");

  'bc1-rgb-unorm-webgl': {gl: GL.COMPRESSED_RGB_S3TC_DXT1_EXT, x: X_S3TC, f: texture_compression_bc},
  'bc1-rgb-unorm-srgb-webgl': {gl: GL.COMPRESSED_SRGB_S3TC_DXT1_EXT, x: X_S3TC_SRGB, f: texture_compression_bc},

  'bc1-rgba-unorm': {gl: GL.COMPRESSED_RGBA_S3TC_DXT1_EXT, x: X_S3TC, f: texture_compression_bc},
  'bc1-rgba-unorm-srgb': {gl: GL.COMPRESSED_SRGB_S3TC_DXT1_EXT, x: X_S3TC_SRGB, f: texture_compression_bc},
  'bc2-rgba-unorm': {gl: GL.COMPRESSED_RGBA_S3TC_DXT3_EXT, x: X_S3TC, f: texture_compression_bc},
  'bc2-rgba-unorm-srgb': {gl: GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT, x: X_S3TC_SRGB, f: texture_compression_bc},
  'bc3-rgba-unorm': {gl: GL.COMPRESSED_RGBA_S3TC_DXT5_EXT, x: X_S3TC, f: texture_compression_bc},
  'bc3-rgba-unorm-srgb': {gl: GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT, x: X_S3TC_SRGB, f: texture_compression_bc},
  'bc4-r-unorm': {gl: GL.COMPRESSED_RED_RGTC1_EXT, x: X_RGTC, f: texture_compression_bc},
  'bc4-r-snorm': {gl: GL.COMPRESSED_SIGNED_RED_RGTC1_EXT, x: X_RGTC, f: texture_compression_bc},
  'bc5-rg-unorm': {gl: GL.COMPRESSED_RED_GREEN_RGTC2_EXT, x: X_RGTC, f: texture_compression_bc},
  'bc5-rg-snorm': {gl: GL.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT, x: X_RGTC, f: texture_compression_bc},
  'bc6h-rgb-ufloat': {gl: GL.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT, x: X_BPTC, f: texture_compression_bc},
  'bc6h-rgb-float': {gl: GL.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT, x: X_BPTC, f: texture_compression_bc},
  'bc7-rgba-unorm': {gl: GL.COMPRESSED_RGBA_BPTC_UNORM_EXT, x: X_BPTC, f: texture_compression_bc},
  'bc7-rgba-unorm-srgb': {gl: GL.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT, x: X_BPTC, f: texture_compression_bc},

  // WEBGL_compressed_texture_etc: device.features.has("texture-compression-etc2")
  // Note: Supposedly guaranteed availability compressed formats in WebGL2, but through CPU decompression

  'etc2-rgb8unorm': {gl: GL.COMPRESSED_RGB8_ETC2, f: texture_compression_etc2},
  'etc2-rgb8unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ETC2, f: texture_compression_etc2},
  'etc2-rgb8a1unorm': {gl: GL.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2, f: texture_compression_etc2},
  'etc2-rgb8a1unorm-srgb': {gl: GL.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2, f: texture_compression_etc2},
  'etc2-rgba8unorm': {gl: GL.COMPRESSED_RGBA8_ETC2_EAC, f: texture_compression_etc2},
  'etc2-rgba8unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC, f: texture_compression_etc2},

  'eac-r11unorm': {gl: GL.COMPRESSED_R11_EAC, f: texture_compression_etc2},
  'eac-r11snorm': {gl: GL.COMPRESSED_SIGNED_R11_EAC, f: texture_compression_etc2},
  'eac-rg11unorm': {gl: GL.COMPRESSED_RG11_EAC, f: texture_compression_etc2},
  'eac-rg11snorm': {gl: GL.COMPRESSED_SIGNED_RG11_EAC, f: texture_compression_etc2},

  // X_ASTC compressed formats: device.features.has("texture-compression-astc")

  'astc-4x4-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_4x4_KHR, f: texture_compression_astc},
  'astc-4x4-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR, f: texture_compression_astc},
  'astc-5x4-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_5x4_KHR, f: texture_compression_astc},
  'astc-5x4-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR, f: texture_compression_astc},
  'astc-5x5-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_5x5_KHR, f: texture_compression_astc},
  'astc-5x5-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR, f: texture_compression_astc},
  'astc-6x5-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_6x5_KHR, f: texture_compression_astc},
  'astc-6x5-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR, f: texture_compression_astc},
  'astc-6x6-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_6x6_KHR, f: texture_compression_astc},
  'astc-6x6-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR, f: texture_compression_astc},
  'astc-8x5-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_8x5_KHR, f: texture_compression_astc},
  'astc-8x5-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR, f: texture_compression_astc},
  'astc-8x6-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_8x6_KHR, f: texture_compression_astc},
  'astc-8x6-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR, f: texture_compression_astc},
  'astc-8x8-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_8x8_KHR, f: texture_compression_astc},
  'astc-8x8-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR, f: texture_compression_astc},
  'astc-10x5-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_10x10_KHR, f: texture_compression_astc},
  'astc-10x5-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR, f: texture_compression_astc},
  'astc-10x6-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_10x6_KHR, f: texture_compression_astc},
  'astc-10x6-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR, f: texture_compression_astc},
  'astc-10x8-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_10x8_KHR, f: texture_compression_astc},
  'astc-10x8-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR, f: texture_compression_astc},
  'astc-10x10-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_10x10_KHR, f: texture_compression_astc},
  'astc-10x10-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR, f: texture_compression_astc},
  'astc-12x10-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_12x10_KHR, f: texture_compression_astc},
  'astc-12x10-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR, f: texture_compression_astc},
  'astc-12x12-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_12x12_KHR, f: texture_compression_astc},
  'astc-12x12-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR, f: texture_compression_astc},

  // WEBGL_compressed_texture_pvrtc

  'pvrtc-rgb4unorm-webgl': {gl: GL.COMPRESSED_RGB_PVRTC_4BPPV1_IMG, f: texture_compression_pvrtc_webgl},
  'pvrtc-rgba4unorm-webgl': {gl: GL.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG, f: texture_compression_pvrtc_webgl},
  'pvrtc-rbg2unorm-webgl': {gl: GL.COMPRESSED_RGB_PVRTC_2BPPV1_IMG, f: texture_compression_pvrtc_webgl},
  'pvrtc-rgba2unorm-webgl': {gl: GL.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG, f: texture_compression_pvrtc_webgl},

  // WEBGL_compressed_texture_etc1

  'etc1-rbg-unorm-webgl': {gl: GL.COMPRESSED_RGB_ETC1_WEBGL, f: texture_compression_etc1_webgl},

  // WEBGL_compressed_texture_atc

  'atc-rgb-unorm-webgl': {gl: GL.COMPRESSED_RGB_ATC_WEBGL, f: texture_compression_atc_webgl},
  'atc-rgba-unorm-webgl': {gl: GL.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL, f: texture_compression_atc_webgl},
  'atc-rgbai-unorm-webgl': {gl: GL.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL, f: texture_compression_atc_webgl}
};

// FUNCTIONS

function getTextureFormat(format: TextureFormat | GL): TextureFormat {
  if (typeof format === 'string') {
    return format;
  }
  const entry = Object.entries(TEXTURE_FORMATS).find(([, entry]) => (entry.gl === format || entry.gl1 === format));
  if (!entry) {
    throw new Error(`Unknown texture format ${format}`);
  }
  return entry[0] as TextureFormat;
}

/** Checks if a texture format is supported */
export function isTextureFormatSupported(
  gl: WebGLRenderingContext,
  formatOrGL: TextureFormat | GL
): boolean {
  const format = getTextureFormat(formatOrGL);
  const info = TEXTURE_FORMATS[format];
  if (!info) {
    return false;
  }
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

/** Checks if a texture format is supported */
export function getTextureFormatSupport(
  gl: WebGLRenderingContext,
  formatOrGL: TextureFormat | GL
): {
  supported: boolean;
  filterable?: boolean;
  renderable?: boolean;
  blendable?: boolean;
  storable?: boolean;
} {
  const format = getTextureFormat(formatOrGL);
  const info = TEXTURE_FORMATS[format];
  if (!info) {
    return {supported: false};
  }
  let decoded;
  try {
    decoded = decodeTextureFormat(format);
  } catch {}

  // Support Check that we have a GL constant
  let supported = isWebGL2(gl) ? info.gl === undefined : info.gl1 === undefined;
  supported = supported && checkTextureFeatures(gl, [info.f]);

  // Filtering
  const filterable = info.filter
    ? checkTextureFeatures(gl, [info.filter])
    : decoded && !decoded.signed;
  const renderable = info.filter
    ? checkTextureFeatures(gl, [info.render])
    : decoded && !decoded.signed;

  return {
    supported,
    renderable: supported && checkTextureFeatures(gl, [info.render]),
    filterable: supported && checkTextureFeatures(gl, [info.filter]),
    blendable: false, // tod,
    storable: false
  };
}

/** Checks whether linear filtering (interpolated sampling) is available for floating point textures */
export function isTextureFormatFilterable(
  gl: WebGLRenderingContext,
  formatOrGL: TextureFormat | GL
): boolean {
  const format = getTextureFormat(formatOrGL);
  if (!isTextureFormatSupported(gl, format)) {
    return false;
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

export function isTextureFormatRenderable(
  gl: WebGLRenderingContext,
  formatOrGL: TextureFormat | GL
): boolean {
  const format = getTextureFormat(formatOrGL);
  if (!isTextureFormatSupported(gl, format)) {
    return false;
  }
  if (typeof format === 'number') {
    return false; // isTextureFormatFilterableWebGL(gl, format);
  }
  // TODO depends on device...
  return true;
}

/**
 * Converts WebGPU string style texture formats to GL constants
 * Pass through GL constants
 */
export function getWebGLTextureFormat(gl: WebGLRenderingContext, formatOrGL: TextureFormat | GL): GL | undefined {
  const format = getTextureFormat(formatOrGL);
  const formatInfo = TEXTURE_FORMATS[format];
  const webglFormat = isWebGL2(gl) ? formatInfo?.gl : formatInfo?.gl1;
  // Remap or pass through
  if (typeof format === 'number') {
    return webglFormat || format;
  }
  if (webglFormat === undefined) {
    throw new Error(`Unsupported texture format ${format}`);
  }
  return webglFormat;
}

export function getWebGLTextureParameters(gl: WebGLRenderingContext, formatOrGL: TextureFormat | GL) {
  const format = getTextureFormat(formatOrGL);
  const webglFormat = getWebGLTextureFormat(gl, format);
  const decoded = decodeTextureFormat(format);
  return {
    format: webglFormat,
    dataFormat: getWebGLPixelDataFormat(
      decoded.format,
      decoded.integer,
      decoded.normalized,
      webglFormat
    ),
    type: getWebGLDataType(decoded.dataType),
    // @ts-expect-error
    compressed: decoded.compressed
  };
}

export function getWebGLDepthStencilAttachment(
  formatOrGL: TextureFormat | GL
): GL.DEPTH_ATTACHMENT | GL.STENCIL_ATTACHMENT | GL.DEPTH_STENCIL_ATTACHMENT {
  const format = getTextureFormat(formatOrGL);
  if (typeof format === 'number') {
    // TODO
    throw new Error('unsupported depth stencil format')
  }
  const info = TEXTURE_FORMATS[format];
  const attachment = info.attachment;
  if (!attachment) {
    throw new Error('not a depth stencil format');
  }
  return attachment;
}

/**
 * function to test if Float 32 bit format texture can be bound as color attachment
 * @todo Generalize to check arbitrary formats?
 */
export function _checkFloat32ColorAttachment(
  gl: WebGLRenderingContext,
  internalFormat = gl.RGBA,
  srcFormat = GL.RGBA,
  srcType = GL.UNSIGNED_BYTE
) {
  let texture: WebGLTexture;
  let framebuffer: WebGLFramebuffer;
  try {
    const texture = gl.createTexture();
    gl.bindTexture(GL.TEXTURE_2D, texture);

    const level = 0;
    const width = 1;
    const height = 1;
    const border = 0;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel
    );

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(GL.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, texture, 0);
    const status = gl.checkFramebufferStatus(GL.FRAMEBUFFER) === GL.FRAMEBUFFER_COMPLETE;

    gl.bindTexture(GL.TEXTURE_2D, null);
    return status;
  } finally {
    gl.deleteTexture(texture);
    gl.deleteFramebuffer(framebuffer);
  }
}

/** @deprecated should be removed */
const DATA_FORMAT_CHANNELS = {
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

/** @deprecated should be removed */
const TYPE_SIZES = {
  [GL.FLOAT]: 4,
  [GL.UNSIGNED_INT]: 4,
  [GL.INT]: 4,
  [GL.UNSIGNED_SHORT]: 2,
  [GL.SHORT]: 2,
  [GL.HALF_FLOAT]: 2,
  [GL.BYTE]: 1,
  [GL.UNSIGNED_BYTE]: 1
};

/** TODO - VERY roundabout legacy way of calculating bytes per pixel */
export function getTextureFormatBytesPerPixel(gl: WebGLRenderingContext, formatOrGL: TextureFormat | GL): number {
  const format = getTextureFormat(formatOrGL);
  const params = getWebGLTextureParameters(gl, format);
  // NOTE(Tarek): Default to RGBA bytes
  const channels = DATA_FORMAT_CHANNELS[params.dataFormat] || 4;
  const channelSize = TYPE_SIZES[params.type] || 1;
  return channels * channelSize;
}

// DATA TYPE HELPERS

function getWebGLPixelDataFormat(
  dataFormat: string,
  integer: boolean,
  normalized: boolean,
  format: GL
): GL {
  // WebGL1 formats use same internalFormat
  if (format === GL.RGBA || format === GL.RGB) {
    return format;
  }
  // prettier-ignore
  switch (dataFormat) {
    case 'r': return integer && !normalized ? GL.RED_INTEGER : GL.RED;
    case 'rg': return integer && !normalized ? GL.RG_INTEGER : GL.RG;
    case 'rgb': return integer && !normalized ? GL.RGB_INTEGER : GL.RGB;
    case 'rgba': return integer && !normalized ? GL.RGBA_INTEGER : GL.RGBA;
    default: return GL.RGBA;
  }
}

function getWebGLDataType(dataType: string): GL {
  // prettier-ignore
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
