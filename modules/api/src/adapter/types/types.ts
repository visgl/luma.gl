// luma.gl, MIT license
import {TextureFormat} from './formats';

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

// Attachments - see webgpu framebuffer

// export type ColorAttachment = {
//   attachment: GPUTextureView;
//   resolveTarget?: GPUTextureView;
//   loadValue: GPULoadOp | GPUColor;
//   storeOp?: GPUStoreOp;
// };

// export type DepthStencilAttachment = {
//   attachment: GPUTextureView;

//   depthLoadValue: GPULoadOp | number;
//   depthStoreOp: GPUStoreOp;
//   depthReadOnly?: boolean;

//   stencilLoadValue: GPULoadOp | number;
//   stencilStoreOp: GPUStoreOp;
//   stencilReadOnly?: boolean;
// };
