// luma.gl, MIT license

/** Depth and stencil texture formats */
export type DepthOrStencilTextureFormat =
  'stencil8' |
  'depth16unorm' |
  'depth24plus' |
  'depth24plus-stencil8' |
  'depth32float' |
  // device.features.has('depth24unorm-stencil8')
  'depth24unorm-stencil8' |
  // device.features.has('depth32float-stencil8')
  'depth32float-stencil8';

/** Texture formats */
export type TextureFormat = DepthOrStencilTextureFormat | 
  // 8-bit formats
  'r8unorm' |
  'r8snorm' |
  'r8uint' |
  'r8sint' |

  // 16-bit formats
  'r16uint' |
  'r16sint' |
  'r16float' |
  'rg8unorm' |
  'rg8snorm' |
  'rg8uint' |
  'rg8sint' |

  // 32-bit formats
  'r32uint' |
  'r32sint' |
  'r32float' |
  'rg16uint' |
  'rg16sint' |
  'rg16float' |
  'rgba8unorm' |
  'rgba8unorm-srgb' |
  'rgba8snorm' |
  'rgba8uint' |
  'rgba8sint' |
  'bgra8unorm' |
  'bgra8unorm-srgb' |
  // Packed 32-bit formats
  'rgb9e5ufloat' |
  'rgb10a2unorm' |
  'rg11b10ufloat' |

  // 64-bit formats
  'rg32uint' |
  'rg32sint' |
  'rg32float' |
  'rgba16uint' |
  'rgba16sint' |
  'rgba16float' |

  // 128-bit formats
  'rgba32uint' |
  'rgba32sint' |
  'rgba32float' |

  // BC compressed formats usable if 'texture-compression-bc' is both
  // supported by the device/user agent and enabled in requestDevice.
  'bc1-rgba-unorm' |
  'bc1-rgba-unorm-srgb' |
  'bc2-rgba-unorm' |
  'bc2-rgba-unorm-srgb' |
  'bc3-rgba-unorm' |
  'bc3-rgba-unorm-srgb' |
  'bc4-r-unorm' |
  'bc4-r-snorm' |
  'bc5-rg-unorm' |
  'bc5-rg-snorm' |
  'bc6h-rgb-ufloat' |
  'bc6h-rgb-float' |
  'bc7-rgba-unorm' |
  'bc7-rgba-unorm-srgb';

/** Attribute formats */
export type VertexFormat =
  'uint8x2' |
  'uint8x4' |
  'sint8x2' |
  'sint8x4' |
  'unorm8x2' |
  'unorm8x4' |
  'snorm8x2' |
  'snorm8x4' |
  'uint16x2' |
  'uint16x4' |
  'sint16x2' |
  'sint16x4' |
  'unorm16x2' |
  'unorm16x4' |
  'snorm16x2' |
  'snorm16x4' |
  'float16x2' |
  'float16x4' |
  'float32' |
  'float32x2' |
  'float32x3' |
  'float32x4' |
  'uint32' |
  'uint32x2' |
  'uint32x3' |
  'uint32x4' |
  'sint32' |
  'sint32x2' |
  'sint32x3' |
  'sint32x4';

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

import type Buffer from '../resources/buffer';
import type Texture from '../resources/texture'; // TextureView...

export type Binding = Texture | Buffer | {buffer: Buffer,  offset?: number, size?: number};

// ATTRIBUTE LAYOUTS




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
