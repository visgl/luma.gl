// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Texture formats */
export type TextureFormat = ColorTextureFormat | DepthStencilTextureFormat;

/** Depth and stencil texture formats */
export type DepthStencilTextureFormat =
  | 'stencil8'
  | 'depth16unorm'
  | 'depth24plus'
  | 'depth24plus-stencil8'
  | 'depth32float'
  // device.features.has('depth24unorm-stencil8')
  | 'depth24unorm-stencil8'
  // device.features.has('depth32float-stencil8')
  | 'depth32float-stencil8';

/** Texture formats for color attachments */
export type ColorTextureFormat =
  | WebGPUColorTextureFormat
  | WebGL2ColorTextureFormat
  | UnsizedColorTextureFormat;

export type WebGPUColorTextureFormat =
  // 8-bit formats
  | 'r8unorm'
  | 'r8snorm'
  | 'r8uint'
  | 'r8sint'

  // 16-bit formats
  | 'r16uint'
  | 'r16sint'
  | 'r16float'
  | 'rg8unorm'
  | 'rg8snorm'
  | 'rg8uint'
  | 'rg8sint'

  // 32-bit formats
  | 'r32uint'
  | 'r32sint'
  | 'r32float'
  | 'rg16uint'
  | 'rg16sint'
  | 'rg16float'
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'rgba8snorm'
  | 'rgba8uint'
  | 'rgba8sint'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb'
  // Packed 32-bit formats
  | 'rgb9e5ufloat'
  | 'rgb10a2unorm'
  | 'rg11b10ufloat'

  // 64-bit formats
  | 'rg32uint'
  | 'rg32sint'
  | 'rg32float'
  | 'rgba16uint'
  | 'rgba16sint'
  | 'rgba16float'

  // 128-bit formats
  | 'rgba32uint'
  | 'rgba32sint'
  | 'rgba32float'

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

/** Unsized texture formats (the only formats supported by WebGL1) */
export type UnsizedColorTextureFormat = 'rgb8unorm-unsized' | 'rgba8unorm-unsized';
// 'r8unorm-unsized' |
// 'ra8unorm-unsized' |
// 'rgb8unorm-srgb-unsized' |
// 'rgba8unorm-srgb-unsized'

/** Sized formats unique to WebGL 2. Some will perhaps be added to WebGPU standard? */
export type WebGL2ColorTextureFormat =
  | 'r16unorm-webgl'
  | 'r16snorm-webgl'
  | 'rgba4unorm-webgl'
  | 'rgb565unorm-webgl'
  | 'rgb5a1unorm-webgl'
  | 'rgb8unorm-webgl'
  | 'rgb8snorm-webgl'
  | 'rg16unorm-webgl'
  | 'rg16snorm-webgl'
  | 'rgb10a2uint-webgl'
  | 'rgb16unorm-webgl'
  | 'rgb16snorm-webgl'
  | 'rgba16unorm-webgl'
  | 'rgba16snorm-webgl'
  | 'rgb32float-webgl'
  | 'bc1-rgb-unorm-webgl'
  | 'bc1-rgb-unorm-srgb-webgl'
  | 'pvrtc-rgb4unorm-webgl'
  | 'pvrtc-rgba4unorm-webgl'
  | 'pvrtc-rbg2unorm-webgl'
  | 'pvrtc-rgba2unorm-webgl'
  | 'etc1-rbg-unorm-webgl'
  | 'atc-rgb-unorm-webgl'
  | 'atc-rgba-unorm-webgl'
  | 'atc-rgbai-unorm-webgl';
