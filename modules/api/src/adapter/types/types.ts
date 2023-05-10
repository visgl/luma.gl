// luma.gl, MIT license
import {TextureFormat} from './texture-formats';

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

import type {Buffer} from '../resources/buffer';
import type {Texture} from '../resources/texture'; // TextureView...

export type Binding = Texture | Buffer | {buffer: Buffer,  offset?: number, size?: number};

// TEXTURE VIEWS

export type TextureView = {
  texture: WebGLTexture;
  layer?: number; //  = 0
  level?: number; // = 0
};

// ATTACHMENTS (See Framebuffer)

export type ColorAttachmentOptions = {
  clearColor?: number[]; // GPUColor
  storeOp: 'store' | 'discard';
}

export type DepthStencilAttachmentOptions = {
  depthClearValue?: number; // required (GPULoadOp or float) depthLoadValue;
  depthStoreOp?: 'store' | 'discard'; // required GPUStoreOp depthStoreOp;
  depthReadOnly?: boolean; // boolean depthReadOnly = false;

  stencilClearValue?: 'load' | number; // required (GPULoadOp or GPUStencilValue) stencilLoadValue;
  stencilStoreOp?: 'store' | 'discard'; // required GPUStoreOp stencilStoreOp;
  stencilReadOnly?: boolean; // boolean stencilReadOnly = false;
}

/** @todo */
export type ColorAttachment = ColorAttachmentOptions & {
  texture: Texture | TextureView;  // required GPUTextureView view;
  resolveTarget?: Texture; // GPUTextureView resolveTarget;
}

/** @todo */
export type DepthStencilAttachment = DepthStencilAttachmentOptions & {
  texture: Texture;  // required GPUTextureView view;
}
