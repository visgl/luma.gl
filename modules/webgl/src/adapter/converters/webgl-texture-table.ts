// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  DeviceFeature,
  TextureFormat,
  TextureFormatCapabilities,
  DeviceTextureFormatCapabilities
} from '@luma.gl/core';
import {decodeTextureFormat} from '@luma.gl/core';
import {GL, GLPixelType, GLExtensions, GLTexelDataFormat} from '@luma.gl/constants';
import {getWebGLExtension} from '../../context/helpers/webgl-extensions';
import {getGLFromVertexType} from './vertex-formats';

/* eslint-disable camelcase */

// TEXTURE FEATURES

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
const EXT_texture_norm16 = 'EXT_texture_norm16';
const EXT_render_snorm = 'EXT_render_snorm';
const EXT_color_buffer_float = 'EXT_color_buffer_float';

// prettier-ignore
export const TEXTURE_FEATURES: Partial<Record<DeviceFeature, string[]>> = {
  'float32-renderable-webgl': ['EXT_color_buffer_float'],
  'float16-renderable-webgl': ['EXT_color_buffer_half_float'],
  'rgb9e5ufloat-renderable-webgl': ['WEBGL_render_shared_exponent'],
  'snorm8-renderable-webgl': [EXT_render_snorm],
  'norm16-renderable-webgl': [EXT_texture_norm16],
  'snorm16-renderable-webgl': [EXT_texture_norm16, EXT_render_snorm],

  'float32-filterable': ['OES_texture_float_linear'],
  'float16-filterable-webgl': ['OES_texture_half_float_linear'],
  'texture-filterable-anisotropic-webgl': ['EXT_texture_filter_anisotropic'],

  'texture-blend-float-webgl': ['EXT_float_blend'],

  'texture-compression-bc': [X_S3TC, X_S3TC_SRGB, X_RGTC, X_BPTC],
  // 'texture-compression-bc3-srgb-webgl': [X_S3TC_SRGB],
  // 'texture-compression-bc3-webgl': [X_S3TC],
  'texture-compression-bc5-webgl': [X_RGTC],
  'texture-compression-bc7-webgl': [X_BPTC],
  'texture-compression-etc2': [X_ETC2],
  'texture-compression-astc': [X_ASTC],
  'texture-compression-etc1-webgl': [X_ETC1],
  'texture-compression-pvrtc-webgl': [X_PVRTC],
  'texture-compression-atc-webgl': [X_ATC]
};

export function isTextureFeature(feature: DeviceFeature): boolean {
  return feature in TEXTURE_FEATURES;
}

/** Checks a texture feature (for Device.features). Mainly compressed texture support */
export function checkTextureFeature(
  gl: WebGL2RenderingContext,
  feature: DeviceFeature,
  extensions: GLExtensions
): boolean {
  const textureExtensions = TEXTURE_FEATURES[feature] || [];
  return textureExtensions.every(extension => getWebGLExtension(gl, extension, extensions));
}

// TEXTURE FORMATS

/** Map a format to webgl and constants */
type WebGLFormatInfo = {
  gl?: GL;
  /** compressed */
  x?: string;
  types?: GLPixelType[];
  dataFormat?: GLTexelDataFormat;
  /** if depthTexture is set this is a depth/stencil format that can be set to a texture  */
  depthTexture?: boolean;
  /** @deprecated can this format be used with renderbuffers */
  rb?: boolean;
};

// TABLES

/**
 * Texture format data -
 * Exported but can change without notice
 */
// prettier-ignore
export const WEBGL_TEXTURE_FORMATS: Record<TextureFormat, WebGLFormatInfo> = {
  // 8-bit formats
  'r8unorm': {gl: GL.R8, rb: true},
  'r8snorm': {gl: GL.R8_SNORM},
  'r8uint': {gl: GL.R8UI, rb: true},
  'r8sint': {gl: GL.R8I, rb: true},

  // 16-bit formats
  'rg8unorm': {gl: GL.RG8, rb: true},
  'rg8snorm': {gl: GL.RG8_SNORM},
  'rg8uint': {gl: GL.RG8UI, rb: true},
  'rg8sint': {gl: GL.RG8I, rb: true},

  'r16uint': {gl: GL.R16UI, rb: true},
  'r16sint': {gl: GL.R16I, rb: true},
  'r16float': {gl: GL.R16F, rb: true},
  'r16unorm-webgl': {gl: GL.R16_EXT, rb: true},
  'r16snorm-webgl': {gl: GL.R16_SNORM_EXT},

  // Packed 16-bit formats
  'rgba4unorm-webgl': {gl: GL.RGBA4, rb: true},
  'rgb565unorm-webgl': {gl: GL.RGB565, rb: true},
  'rgb5a1unorm-webgl': {gl: GL.RGB5_A1, rb: true},

  // 24-bit formats
  'rgb8unorm-webgl': {gl: GL.RGB8},
  'rgb8snorm-webgl': {gl: GL.RGB8_SNORM},

  // 32-bit formats  
  'rgba8unorm': {gl: GL.RGBA8},
  'rgba8unorm-srgb': {gl: GL.SRGB8_ALPHA8},
  'rgba8snorm': {gl: GL.RGBA8_SNORM},
  'rgba8uint': {gl: GL.RGBA8UI},
  'rgba8sint': {gl: GL.RGBA8I},
  // reverse colors, webgpu only
  'bgra8unorm': {},
  'bgra8unorm-srgb': {},

  'rg16uint': {gl: GL.RG16UI},
  'rg16sint': {gl: GL.RG16I},
  'rg16float': {gl: GL.RG16F, rb: true},
  'rg16unorm-webgl': {gl: GL.RG16_EXT},
  'rg16snorm-webgl': {gl: GL.RG16_SNORM_EXT},

  'r32uint': {gl: GL.R32UI, rb: true},
  'r32sint': {gl: GL.R32I, rb: true},
  'r32float': {gl: GL.R32F},

  // Packed 32-bit formats
  'rgb9e5ufloat': {gl: GL.RGB9_E5}, // , filter: true},
  'rg11b10ufloat': {gl: GL.R11F_G11F_B10F, rb: true},
  'rgb10a2unorm': {gl: GL.RGB10_A2, rb: true},
  'rgb10a2uint-webgl': {gl: GL.RGB10_A2UI, rb: true},

  // 48-bit formats
  'rgb16unorm-webgl': {gl: GL.RGB16_EXT}, // rgb not renderable
  'rgb16snorm-webgl': {gl: GL.RGB16_SNORM_EXT}, // rgb not renderable

  // 64-bit formats
  'rg32uint': {gl: GL.RG32UI, rb: true},
  'rg32sint': {gl: GL.RG32I, rb: true},
  'rg32float': {gl: GL.RG32F, rb: true},
  'rgba16uint': {gl: GL.RGBA16UI, rb: true},
  'rgba16sint': {gl: GL.RGBA16I, rb: true},
  'rgba16float': {gl: GL.RGBA16F},
  'rgba16unorm-webgl': {gl: GL.RGBA16_EXT, rb: true},
  'rgba16snorm-webgl': {gl: GL.RGBA16_SNORM_EXT},

  // 96-bit formats (deprecated!)
  'rgb32float-webgl': {gl: GL.RGB32F, x: EXT_color_buffer_float, dataFormat: GL.RGB, types: [GL.FLOAT]},
  
  // 128-bit formats
  'rgba32uint': {gl: GL.RGBA32UI, rb: true},
  'rgba32sint': {gl: GL.RGBA32I, rb: true},
  'rgba32float': {gl: GL.RGBA32F, rb: true},

  // Depth and stencil formats
  'stencil8': {gl: GL.STENCIL_INDEX8, rb: true}, // 8 stencil bits

  'depth16unorm': {gl: GL.DEPTH_COMPONENT16, dataFormat: GL.DEPTH_COMPONENT, types: [GL.UNSIGNED_SHORT], rb: true}, // 16 depth bits
  'depth24plus': {gl: GL.DEPTH_COMPONENT24, dataFormat: GL.DEPTH_COMPONENT, types: [GL.UNSIGNED_INT]},
  'depth32float': {gl: GL.DEPTH_COMPONENT32F, dataFormat: GL.DEPTH_COMPONENT, types: [GL.FLOAT], rb: true},

  // The depth component of the "depth24plus" and "depth24plus-stencil8" formats may be implemented as either a 24-bit depth value or a "depth32float" value.
  'depth24plus-stencil8': {gl: GL.DEPTH24_STENCIL8, rb: true, depthTexture: true, dataFormat: GL.DEPTH_STENCIL, types: [GL.UNSIGNED_INT_24_8]},
  // "depth32float-stencil8" feature - TODO below is render buffer only?
  'depth32float-stencil8': {gl: GL.DEPTH32F_STENCIL8, dataFormat: GL.DEPTH_STENCIL, types: [GL.FLOAT_32_UNSIGNED_INT_24_8_REV], rb: true},

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

  'etc2-rgb8unorm': {gl: GL.COMPRESSED_RGB8_ETC2},
  'etc2-rgb8unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ETC2},
  'etc2-rgb8a1unorm': {gl: GL.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2},
  'etc2-rgb8a1unorm-srgb': {gl: GL.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2},
  'etc2-rgba8unorm': {gl: GL.COMPRESSED_RGBA8_ETC2_EAC},
  'etc2-rgba8unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC},

  'eac-r11unorm': {gl: GL.COMPRESSED_R11_EAC},
  'eac-r11snorm': {gl: GL.COMPRESSED_SIGNED_R11_EAC},
  'eac-rg11unorm': {gl: GL.COMPRESSED_RG11_EAC},
  'eac-rg11snorm': {gl: GL.COMPRESSED_SIGNED_RG11_EAC},

  // X_ASTC compressed formats: device.features.has("texture-compression-astc")

  'astc-4x4-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_4x4_KHR},
  'astc-4x4-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR},
  'astc-5x4-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_5x4_KHR},
  'astc-5x4-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR},
  'astc-5x5-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_5x5_KHR},
  'astc-5x5-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR},
  'astc-6x5-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_6x5_KHR},
  'astc-6x5-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR},
  'astc-6x6-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_6x6_KHR},
  'astc-6x6-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR},
  'astc-8x5-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_8x5_KHR},
  'astc-8x5-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR},
  'astc-8x6-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_8x6_KHR},
  'astc-8x6-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR},
  'astc-8x8-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_8x8_KHR},
  'astc-8x8-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR},
  'astc-10x5-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_10x10_KHR},
  'astc-10x5-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR},
  'astc-10x6-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_10x6_KHR},
  'astc-10x6-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR},
  'astc-10x8-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_10x8_KHR},
  'astc-10x8-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR},
  'astc-10x10-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_10x10_KHR},
  'astc-10x10-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR},
  'astc-12x10-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_12x10_KHR},
  'astc-12x10-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR},
  'astc-12x12-unorm': {gl: GL.COMPRESSED_RGBA_ASTC_12x12_KHR},
  'astc-12x12-unorm-srgb': {gl: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR},

  // WEBGL_compressed_texture_pvrtc

  'pvrtc-rgb4unorm-webgl': {gl: GL.COMPRESSED_RGB_PVRTC_4BPPV1_IMG},
  'pvrtc-rgba4unorm-webgl': {gl: GL.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG},
  'pvrtc-rbg2unorm-webgl': {gl: GL.COMPRESSED_RGB_PVRTC_2BPPV1_IMG},
  'pvrtc-rgba2unorm-webgl': {gl: GL.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG},

  // WEBGL_compressed_texture_etc1

  'etc1-rbg-unorm-webgl': {gl: GL.COMPRESSED_RGB_ETC1_WEBGL},

  // WEBGL_compressed_texture_atc

  'atc-rgb-unorm-webgl': {gl: GL.COMPRESSED_RGB_ATC_WEBGL},
  'atc-rgba-unorm-webgl': {gl: GL.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL},
  'atc-rgbai-unorm-webgl': {gl: GL.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL}
};

// FUNCTIONS

/** Checks if a texture format is supported */
export function isWebGLTextureFormatCapabilitiesed(
  gl: WebGL2RenderingContext,
  format: TextureFormat,
  extensions: GLExtensions
): boolean {
  const webglTextureInfo = WEBGL_TEXTURE_FORMATS[format];
  // Check that we have a GL constant
  if (!webglTextureInfo?.gl) {
    return false;
  }

  // Check extensions
  const extension = webglTextureInfo.x;
  if (extension) {
    return Boolean(getWebGLExtension(gl, extension, extensions));
  }
  return true;
}

/** Checks if a texture format is supported, renderable, filterable etc */
export function getTextureFormatCapabilitiesWebGL(
  gl: WebGL2RenderingContext,
  formatSupport: TextureFormatCapabilities,
  extensions: GLExtensions
): DeviceTextureFormatCapabilities {
  let supported = formatSupport.create;
  const webglFormatInfo = WEBGL_TEXTURE_FORMATS[formatSupport.format];

  // Support Check that we have a GL constant
  if (webglFormatInfo?.gl === undefined) {
    supported = false;
  }

  if (webglFormatInfo?.x) {
    supported = supported && Boolean(getWebGLExtension(gl, webglFormatInfo.x, extensions));
  }

  return {
    format: formatSupport.format,
    // @ts-ignore
    create: supported && formatSupport.create,
    // @ts-ignore
    render: supported && formatSupport.render,
    // @ts-ignore
    filter: supported && formatSupport.filter,
    // @ts-ignore
    blend: supported && formatSupport.blend,
    // @ts-ignore
    store: supported && formatSupport.store
  };
}

/** Get parameters necessary to work with format in WebGL: internalFormat, dataFormat, type, compressed, */
export function getTextureFormatWebGL(format: TextureFormat): {
  internalFormat: GL;
  format: GLTexelDataFormat;
  type: GLPixelType;
  compressed: boolean;
} {
  const formatData = WEBGL_TEXTURE_FORMATS[format];
  const webglFormat = convertTextureFormatToGL(format);
  const decoded = decodeTextureFormat(format);
  return {
    internalFormat: webglFormat,
    format:
      formatData?.dataFormat ||
      getWebGLPixelDataFormat(decoded.channels, decoded.integer, decoded.normalized, webglFormat),
    // depth formats don't have a type
    type: decoded.dataType
      ? getGLFromVertexType(decoded.dataType)
      : formatData?.types?.[0] || GL.UNSIGNED_BYTE,
    compressed: decoded.compressed || false
  };
}

export function getDepthStencilAttachmentWebGL(
  format: TextureFormat
): GL.DEPTH_ATTACHMENT | GL.STENCIL_ATTACHMENT | GL.DEPTH_STENCIL_ATTACHMENT {
  const formatInfo = decodeTextureFormat(format);
  switch (formatInfo.attachment) {
    case 'depth':
      return GL.DEPTH_ATTACHMENT;
    case 'stencil':
      return GL.STENCIL_ATTACHMENT;
    case 'depth-stencil':
      return GL.DEPTH_STENCIL_ATTACHMENT;
    default:
      throw new Error(`Not a depth stencil format: ${format}`);
  }
}

/** TODO - VERY roundabout legacy way of calculating bytes per pixel */
export function getTextureFormatBytesPerPixel(format: TextureFormat): number {
  const formatInfo = decodeTextureFormat(format);
  return formatInfo.bytesPerPixel;
}

// DATA TYPE HELPERS

export function getWebGLPixelDataFormat(
  channels: 'r' | 'rg' | 'rgb' | 'rgba' | 'bgra',
  integer: boolean,
  normalized: boolean,
  format: GL
): GLTexelDataFormat {
  // WebGL1 formats use same internalFormat
  if (format === GL.RGBA || format === GL.RGB) {
    return format;
  }
  // prettier-ignore
  switch (channels) {
    case 'r': return integer && !normalized ? GL.RED_INTEGER : GL.RED;
    case 'rg': return integer && !normalized ? GL.RG_INTEGER : GL.RG;
    case 'rgb': return integer && !normalized ? GL.RGB_INTEGER : GL.RGB;
    case 'rgba': return integer && !normalized ? GL.RGBA_INTEGER : GL.RGBA;
    case 'bgra': throw new Error('bgra pixels not supported by WebGL');
    default: return GL.RGBA;
  }
}

/**
 * Map WebGPU style texture format strings to GL constants
 */
function convertTextureFormatToGL(format: TextureFormat): GL | undefined {
  const formatInfo = WEBGL_TEXTURE_FORMATS[format];
  const webglFormat = formatInfo?.gl;
  if (webglFormat === undefined) {
    throw new Error(`Unsupported texture format ${format}`);
  }
  return webglFormat;
}
