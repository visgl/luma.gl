// luma.gl, MIT license
enum TextureFormat {
  // 8-bit formats
  'r8unorm',
  'r8snorm',
  'r8uint',
  'r8sint',

  // 16-bit formats
  'r16uint',
  'r16sint',
  'r16float',
  'rg8unorm',
  'rg8snorm',
  'rg8uint',
  'rg8sint',

  // 32-bit formats
  'r32uint',
  'r32sint',
  'r32float',
  'rg16uint',
  'rg16sint',
  'rg16float',
  'rgba8unorm',
  'rgba8unorm-srgb',
  'rgba8snorm',
  'rgba8uint',
  'rgba8sint',
  'bgra8unorm',
  'bgra8unorm-srgb',
  // Packed 32-bit formats
  'rgb9e5ufloat',
  'rgb10a2unorm',
  'rg11b10ufloat',

  // 64-bit formats
  'rg32uint',
  'rg32sint',
  'rg32float',
  'rgba16uint',
  'rgba16sint',
  'rgba16float',

  // 128-bit formats
  'rgba32uint',
  'rgba32sint',
  'rgba32float',

  // Depth and stencil formats
  'stencil8',
  'depth16unorm',
  'depth24plus',
  'depth24plus-stencil8',
  'depth32float',

  // BC compressed formats usable if 'texture-compression-bc' is both
  // supported by the device/user agent and enabled in requestDevice.
  'bc1-rgba-unorm',
  'bc1-rgba-unorm-srgb',
  'bc2-rgba-unorm',
  'bc2-rgba-unorm-srgb',
  'bc3-rgba-unorm',
  'bc3-rgba-unorm-srgb',
  'bc4-r-unorm',
  'bc4-r-snorm',
  'bc5-rg-unorm',
  'bc5-rg-snorm',
  'bc6h-rgb-ufloat',
  'bc6h-rgb-float',
  'bc7-rgba-unorm',
  'bc7-rgba-unorm-srgb',

  // 'depth24unorm-stencil8' feature
  'depth24unorm-stencil8',

  // 'depth32float-stencil8' feature
  'depth32float-stencil8',
};

// BINDING LAYOUTS

type BufferBindingLayout = {
  location?: number;
  visibility: number;
  type: 'uniform' | 'storage' | 'read-only-storage';
  hasDynamicOffset?: boolean;
  minBindingSize?: number;
}

type TextureBindingLayout = {
  location?: number;
  visibility: number;
  viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  sampleType?: 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';
  multisampled?: boolean;
};

type StorageTextureBindingLayout = {
  location?: number;
  visibility: number;
  access?: 'write-only';
  format: TextureFormat;
  viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
};

export type BindingLayout = BufferBindingLayout | TextureBindingLayout | StorageTextureBindingLayout;

// BINDINGS

import type Buffer from './buffer';
import type Texture from './texture'; // TextureView...

export type Binding = Texture | Buffer | {buffer: Buffer,  offset?: number, size?: number};

// Attachments

export type ColorAttachment = {
  // attachment: GPUTextureView;
  // resolveTarget?: GPUTextureView;
  // loadValue: GPULoadOp | GPUColor;
  // storeOp?: GPUStoreOp;
};

export type DepthStencilAttachment = {
  // attachment: GPUTextureView;

  // depthLoadValue: GPULoadOp | number;
  // depthStoreOp: GPUStoreOp;
  // depthReadOnly?: boolean;

  // stencilLoadValue: GPULoadOp | number;
  // stencilStoreOp: GPUStoreOp;
  // stencilReadOnly?: boolean;
};
