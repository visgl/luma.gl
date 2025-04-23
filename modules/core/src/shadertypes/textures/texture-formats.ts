// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TEXTURE FORMATS

/** Texture formats */
export type TextureFormat = TextureFormatColor | TextureFormatDepthStencil;

/** Depth and stencil texture formats */
export type TextureFormatDepthStencil =
  | 'stencil8'
  | 'depth16unorm'
  | 'depth24plus'
  | 'depth24plus-stencil8'
  | 'depth32float'
  // device.features.has('depth32float-stencil8')
  | 'depth32float-stencil8';

/** Texture formats for color attachments */
export type TextureFormatColor = TextureFormatColorUncompressed | TextureFormatCompressed;

export type TextureFormatColorUncompressed =
  | TextureFormatUnorm8
  | TextureFormatSnorm8
  | TextureFormatUint8
  | TextureFormatSint8
  | TextureFormatUnorm16
  | TextureFormatSnorm16
  | TextureFormatUint16
  | TextureFormatSint16
  | TextureFormatFloat16
  | TextureFormatUint32
  | TextureFormatSint32
  | TextureFormatFloat32
  | TextureFormatPacked16
  | TextureFormatPacked32;

type TextureFormatUnorm8 =
  | 'r8unorm'
  | 'rg8unorm'
  | 'rgb8unorm-webgl'
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb';

type TextureFormatSnorm8 = 'r8snorm' | 'rg8snorm' | 'rgb8snorm-webgl' | 'rgba8snorm';

type TextureFormatUint8 = 'r8uint' | 'rg8uint' | 'rgba8uint';

type TextureFormatSint8 = 'r8sint' | 'rg8sint' | 'rgba8sint';

type TextureFormatUnorm16 = 'r16unorm' | 'rg16unorm' | 'rgb16unorm-webgl' | 'rgba16unorm';

type TextureFormatSnorm16 = 'r16snorm' | 'rg16snorm' | 'rgb16snorm-webgl' | 'rgba16snorm';

type TextureFormatUint16 = 'r16uint' | 'rg16uint' | 'rgba16uint';

type TextureFormatSint16 = 'r16sint' | 'rg16sint' | 'rgba16sint';

type TextureFormatFloat16 = 'r16float' | 'rg16float' | 'rgba16float';

// 96-bit formats (deprecated!)
type TextureFormatUint32 = 'r32uint' | 'rg32uint' | 'rgba32uint';

type TextureFormatSint32 = 'r32sint' | 'rg32sint' | 'rgba32sint';

type TextureFormatFloat32 = 'r32float' | 'rg32float' | 'rgb32float-webgl' | 'rgba32float';

type TextureFormatPacked16 = 'rgba4unorm-webgl' | 'rgb565unorm-webgl' | 'rgb5a1unorm-webgl';

type TextureFormatPacked32 = 'rgb9e5ufloat' | 'rg11b10ufloat' | 'rgb10a2unorm' | 'rgb10a2uint';

export type TextureFormatCompressed =
  | 'bc1-rgb-unorm-webgl'
  | 'bc1-rgb-unorm-srgb-webgl'
  | 'pvrtc-rgb4unorm-webgl'
  | 'pvrtc-rgba4unorm-webgl'
  | 'pvrtc-rbg2unorm-webgl'
  | 'pvrtc-rgba2unorm-webgl'
  | 'etc1-rbg-unorm-webgl'
  | 'atc-rgb-unorm-webgl'
  | 'atc-rgba-unorm-webgl'
  | 'atc-rgbai-unorm-webgl'

  // BC compressed formats usable if 'texture-compression-bc' is both
  // supported by the device/user agent and enabled in requestDevice.
  | 'bc1-rgba-unorm'
  | 'bc1-rgba-unorm-srgb'
  | 'bc2-rgba-unorm'
  | 'bc2-rgba-unorm-srgb'
  | 'bc3-rgba-unorm'
  | 'bc3-rgba-unorm-srgb'
  | 'bc4-r-unorm'
  | 'bc4-r-snorm'
  | 'bc5-rg-unorm'
  | 'bc5-rg-snorm'
  | 'bc6h-rgb-ufloat'
  | 'bc6h-rgb-float'
  | 'bc7-rgba-unorm'
  | 'bc7-rgba-unorm-srgb'

  // ETC2 compressed formats usable if "texture-compression-etc2" is both
  // supported by the device/user agent and enabled in requestDevice.
  | 'etc2-rgb8unorm'
  | 'etc2-rgb8unorm-srgb'
  | 'etc2-rgb8a1unorm'
  | 'etc2-rgb8a1unorm-srgb'
  | 'etc2-rgba8unorm'
  | 'etc2-rgba8unorm-srgb'
  | 'eac-r11unorm'
  | 'eac-r11snorm'
  | 'eac-rg11unorm'
  | 'eac-rg11snorm'

  // ASTC compressed formats usable if "texture-compression-astc" is both
  // supported by the device/user agent and enabled in requestDevice.
  // Textures must be multiple of block size (encoded in format string).
  | 'astc-4x4-unorm'
  | 'astc-4x4-unorm-srgb'
  | 'astc-5x4-unorm'
  | 'astc-5x4-unorm-srgb'
  | 'astc-5x5-unorm'
  | 'astc-5x5-unorm-srgb'
  | 'astc-6x5-unorm'
  | 'astc-6x5-unorm-srgb'
  | 'astc-6x6-unorm'
  | 'astc-6x6-unorm-srgb'
  | 'astc-8x5-unorm'
  | 'astc-8x5-unorm-srgb'
  | 'astc-8x6-unorm'
  | 'astc-8x6-unorm-srgb'
  | 'astc-8x8-unorm'
  | 'astc-8x8-unorm-srgb'
  | 'astc-10x5-unorm'
  | 'astc-10x5-unorm-srgb'
  | 'astc-10x6-unorm'
  | 'astc-10x6-unorm-srgb'
  | 'astc-10x8-unorm'
  | 'astc-10x8-unorm-srgb'
  | 'astc-10x10-unorm'
  | 'astc-10x10-unorm-srgb'
  | 'astc-12x10-unorm'
  | 'astc-12x10-unorm-srgb'
  | 'astc-12x12-unorm'
  | 'astc-12x12-unorm-srgb';
