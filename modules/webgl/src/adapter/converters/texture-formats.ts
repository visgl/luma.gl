import GL from '@luma.gl/constants';

// Define local extension strings to optimize minification
const SRGB = 'EXT_sRGB';
const EXT_FLOAT_WEBGL1 = 'WEBGL.color_buffer_float';
const EXT_FLOAT_WEBGL2 = 'EXT_color_buffer_float';
const EXT_HALF_FLOAT_WEBGL1 = 'EXT_color_buffer_half_float';

// const S3TC = 'WEBGL_compressed_texture_s3tc';
// const PVRTC = 'WEBGL_compressed_texture_pvrtc';
// const ES3 = 'WEBGL_compressed_texture_es3';
// const ETC1 = 'WEBGL_compressed_texture_etc1';
// const SRGB = 'EXT_sRGB';
// const DEPTH = 'WEBGL_depth_texture';

// NOTES:
// - gl2: format requires WebGL2, when using a WebGL 1 context, color renderbuffer formats are limited
// - b (bytes per pixel), for memory usage calculations.
// - c (channels)
// - p (packed)

export const TEXTURE_FORMAT_DEFINITIONS = {
  // 8-bit formats
  'r8unorm': {b: 1, c: 1, gl: GL.R8, gl2: true},
  'r8snorm': {b: 1, c: 1},
  'r8uint': {b: 1, c: 1, gl: GL.R8UI, gl2: true},
  'r8sint': {b: 1, c: 1, gl: GL.R8I, gl2: true},

  // 16-bit formats
  'r16uint': {b: 2, c: 1, gl: GL.R16UI, gl2: true},
  'r16sint': {b: 2, c: 1, gl: GL.R16I, gl2: true},
  'r16float': {b: 2, c: 1, gl: GL.R16F, gl2: EXT_FLOAT_WEBGL2},
  'rg8unorm': {b: 2, c: 2, gl: GL.RG8, gl2: true},
  'rg8snorm': {b: 2, c: 2},
  'rg8uint': {b: 2, c: 2, gl: GL.RG8UI, gl2: true},
  'rg8sint': {b: 2, c: 2, gl: GL.RG8I, gl2: true},

  // Packed 16-bit formats
  // 'rgba4norm?': {b: 2, c: 4, gl: GL.RGBA4, wgpu: false},
  // 'rgb565norm?': {b: 2, c: 4, gl: GL.RGB565, wgpu: false},
  // 'rgb5a1norm?': {b: 2, c: 4, gl: GL.RGB5_A1, wgpu: false},

  // 24-bit formats
  // 'rbg8norm?': {b: 3, c: 3, gl: GL.RGB8, gl2: true, wgpu: false},

  // 32-bit formats
  'r32uint': {b: 4, c: 1, gl: GL.R32UI, gl2: true, bpp: 4},
  'r32sint': {b: 4, c: 1, gl: GL.R32I, gl2: true, bpp: 4},
  'r32float': {b: 4, c: 1, gl: GL.R32F, gl2: EXT_FLOAT_WEBGL2, bpp: 4},
  'rg16uint': {b: 4, c: 1, gl: GL.RG16UI, gl2: true, bpp: 4},
  'rg16sint': {b: 4, c: 2, gl: GL.RG16I, gl2: true, bpp: 4},
  // When using a WebGL 2 context and the EXT_color_buffer_float WebGL2 extension
  'rg16float': {b: 4, c: 2, gl: GL.RG16F, gl2: EXT_FLOAT_WEBGL2, bpp: 4},
  'rgba8unorm': {b: 4, c: 2, gl: GL.RGBA8, gl2: true, bpp: 4},

  'rgba8unorm-srgb': {b: 4, c: 4, gl: GL.SRGB8_ALPHA8, gl2: true, gl1: SRGB, bpp: 4},
  'rgba8snorm': {b: 4, c: 4},
  'rgba8uint': {b: 4, c: 4, gl: GL.RGBA8UI, gl2: true, bpp: 4},
  'rgba8sint': {b: 4, c: 4, gl: GL.RGBA8I, gl2: true, bpp: 4},
  'bgra8unorm': {b: 4, c: 4},
  'bgra8unorm-srgb': {b: 4, c: 4},

  // Packed 32-bit formats
  'rgb9e5ufloat': {b: 4, c: 3, p: 1, gl: GL.RGB9_E5, gl2: true, gl1: 'WEBGL_color_buffer_half_float'},
  'rg11b10ufloat': {b: 4, c: 3, p: 1, gl: GL.R11F_G11F_B10F, gl2: EXT_FLOAT_WEBGL2},
  'rgb10a2unorm': {b: 4, c: 4, p: 1, gl: GL.RGB10_A2, gl2: true},
  // webgl2 only
  // '?rgb10a2unorm?': {b: 4, c: 4, p: 1, webgpu: false, gl: GL.RGB10_A2UI, gl2: true, bpp: 4},

  // 64-bit formats
  'rg32uint': {b: 8, c: 2, gl: GL.RG32UI, gl2: true},
  'rg32sint': {b: 8, c: 2, gl: GL.RG32I, gl2: true},
  'rg32float': {b: 8, c: 2, gl: GL.RG32F, gl2: EXT_FLOAT_WEBGL2},
  'rgba16uint': {b: 8, c: 4, gl: GL.RGBA16UI, gl2: true},
  'rgba16sint': {b: 8, c: 4, gl: GL.RGBA16I, gl2: true},
  'rgba16float': {b: 8, c: 4, gl: GL.RGBA16F, gl2: EXT_FLOAT_WEBGL2},

  // 96-bit formats
  // {gl: GL.RGB32F, dataFormat: GL.RGB, types: [GL.FLOAT], gl2: true},

  // 128-bit formats
  'rgba32uint': {b: 16, c: 4, gl: GL.RGBA32UI, gl2: true},
  'rgba32sint': {b: 16, c: 4, gl: GL.RGBA32I, gl2: true},
  'rgba32float': {b: 16, c: 4, gl: GL.RGBA32F, gl2: EXT_FLOAT_WEBGL2}, // gl1: EXT_FLOAT_WEBGL1

  // Depth and stencil formats
  'stencil8': {b: 1, c: 1, gl: GL.STENCIL_INDEX8}, // 8 stencil bits
  'depth16unorm': {b: 2, c: 1, gl: GL.DEPTH_COMPONENT16}, // 16 depth bits
  'depth24plus': {b: 3, c: 1, gl: GL.DEPTH_COMPONENT24, gl2: true},
  'depth24plus-stencil8': {b: 4, c: 2, p: 1, gl: GL.DEPTH24_STENCIL8, gl2: true},
  'depth32float': {b: 4, c: 1, gl: GL.DEPTH_COMPONENT32F, gl2: true},

  // "depth24unorm-stencil8" feature
  'depth24unorm-stencil8': {b: 4, c: 2, p: 1, gl: GL.DEPTH_STENCIL},

  // "depth32float-stencil8" feature
  "depth32float-stencil8": {b: 5, c: 2, p: 1, gl: GL.DEPTH32F_STENCIL8, gl2: true},

  // BC compressed formats usable if "texture-compression-bc" is both
  // supported by the device/user agent and enabled in requestDevice.
  'bc1-rgba-unorm': {},
  'bc1-rgba-unorm-srgb': {},
  'bc2-rgba-unorm': {},
  'bc2-rgba-unorm-srgb': {},
  'bc3-rgba-unorm': {},
  'bc3-rgba-unorm-srgb': {},
  'bc4-r-unorm': {},
  'bc4-r-snorm': {},
  'bc5-rg-unorm': {},
  'bc5-rg-snorm': {},
  'bc6h-rgb-ufloat': {},
  'bc6h-rgb-float': {},
  'bc7-rgba-unorm': {},
  'bc7-rgba-unorm-srgb': {}
};

////////////////////////////////////////////////////
// Compressed formats

// WEBGL_compressed_texture_s3tc

// {gl: GL.COMPRESSED_RGB_S3TC_DXT1_EXT, compressed: true, gl1: S3TC},
// {gl: GL.COMPRESSED_RGBA_S3TC_DXT1_EXT, compressed: true, gl1: S3TC},
// {gl: GL.COMPRESSED_RGBA_S3TC_DXT3_EXT, compressed: true, gl1: S3TC},
// {gl: GL.COMPRESSED_RGBA_S3TC_DXT5_EXT, compressed: true, gl1: S3TC},

// WEBGL_compressed_texture_es3

// {gl: GL.COMPRESSED_R11_EAC, compressed: true, gl1: ES3}, // RED
// {gl: GL.COMPRESSED_SIGNED_R11_EAC, compressed: true, gl1: ES3}, // RED
// {gl: GL.COMPRESSED_RG11_EAC, compressed: true, gl1: ES3}, // RG
// {gl: GL.COMPRESSED_SIGNED_RG11_EAC, compressed: true, gl1: ES3}, // RG
// {gl: GL.COMPRESSED_RGB8_ETC2, compressed: true, gl1: ES3}, // RGB
// {gl: GL.COMPRESSED_RGBA8_ETC2_EAC, compressed: true, gl1: ES3}, // RBG
// {gl: GL.COMPRESSED_SRGB8_ETC2, compressed: true, gl1: ES3}, // RGB
// {gl: GL.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC, compressed: true, gl1: ES3}, // RGBA
// {gl: GL.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2, compressed: true, gl1: ES3}, // RGBA
// {gl: GL.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2, compressed: true, gl1: ES3}, // RGBA
/* WebGL2 guaranteed availability compressed formats?
COMPRESSED_R11_EAC RED
COMPRESSED_SIGNED_R11_EAC RED
COMPRESSED_RG11_EAC RG
COMPRESSED_SIGNED_RG11_EAC RG
COMPRESSED_RGB8_ETC2 RGB
COMPRESSED_SRGB8_ETC2 RGB
COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 RGBA
COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 RGBA
COMPRESSED_RGBA8_ETC2_EAC RGBA
COMPRESSED_SRGB8_ALPHA8_ETC2_EAC
*/

// WEBGL_compressed_texture_pvrtc

// {gl: GL.COMPRESSED_RGB_PVRTC_4BPPV1_IMG, compressed: true, gl1: PVRTC},
// {gl: GL.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG, compressed: true, gl1: PVRTC},
// {gl: GL.COMPRESSED_RGB_PVRTC_2BPPV1_IMG, compressed: true, gl1: PVRTC},
// {gl: GL.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG, compressed: true, gl1: PVRTC},

// WEBGL_compressed_texture_etc1

// {gl: GL.COMPRESSED_RGB_ETC1_WEBGL, compressed: true, gl1: ETC1},

// WEBGL_compressed_texture_atc

// {gl: GL.COMPRESSED_RGB_ATC_WEBGL, compressed: true, gl1: ETC1},
// {gl: GL.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL, compressed: true, gl1: ETC1},
// {gl: GL.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL, compressed: true, gl1: ETC1}
