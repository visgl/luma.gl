// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ColorTextureFormat,
  DepthStencilTextureFormat,
  TextureFormat
} from '../../gpu-type-utils/texture-formats';
import type {Texture} from '../resources/texture'; // TextureView...
import type {TextureView} from '../resources/texture-view'; // TextureView...

// UNIFORMS

// BINDING LAYOUTS

/** Describes a buffer binding layout */
type BufferBindingLayout = {
  /** The index of the binding point in the compiled and linked shader */
  location?: number;
  visibility: number;
  /** type of buffer */
  type: 'uniform' | 'storage' | 'read-only-storage';
  hasDynamicOffset?: boolean;
  minBindingSize?: number;
};

/** Describes a texture binding */
type TextureBindingLayout = {
  /** The index of the binding point in the compiled and linked shader */
  location?: number;
  visibility: number;
  viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  sampleType?: 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';
  multisampled?: boolean;
};

/** Describes a storage texture binding */
type StorageTextureBindingLayout = {
  /** The index of the binding point in the compiled and linked shader */
  location?: number;
  visibility: number;
  access?: 'write-only';
  format: TextureFormat;
  viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
};

export type BindingDeclaration =
  | BufferBindingLayout
  | TextureBindingLayout
  | StorageTextureBindingLayout;

// ATTACHMENTS (See Framebuffer)

/**
 * Framebuffer attachments lets the user specify the textures that will be used for a RenderPass,
 * together with some additional options for how to clear.
 */
export type ColorAttachment = {
  /** Describes the texture subresource that will be output to for this color attachment. */
  texture?: TextureView | Texture;
  /** Format of the texture resource. Used to auto create texture if not supplied */
  format?: ColorTextureFormat;
  /* Describes the texture subresource that will receive  resolved output for this color attachment if multisampled. */
  // resolveTarget?: GPUTextureView;

  /** Value to clear to prior to executing the render pass. Default: [0, 0, 0, 0]. Ignored if loadOp is not "clear". */
  clearValue?: number[];
  /** load operation to perform on texture prior to executing the render pass. Default: 'clear'. */
  loadOp?: 'load' | 'clear';
  /** The store operation to perform on texture after executing the render pass. Default: 'store'. */
  storeOp?: 'store' | 'discard';
};

/**
 * Framebuffer attachments lets the user specify the depth stencil texture that will be used for a RenderPass,
 * together with some additional options for how to clear.
 */
export type DepthStencilAttachment = {
  /** Describes the texture subresource that will be output to and read from for this depth/stencil attachment. */
  texture?: TextureView | Texture;
  /** Format of the texture resource. Used to auto create texture if not supplied */
  format?: DepthStencilTextureFormat;

  /** Value to clear depth component to prior to executing the render pass, if depthLoadOp is "clear". 0.0-1.0. */
  depthClearValue?: number;
  /** Indicates load operation to perform on depth component prior to executing the render pass. Default 'clear'. */
  depthLoadOp?: 'load' | 'clear';
  /** Store operation to perform on depth component after executing the render pass. Default: 'store'. */
  depthStoreOp?: 'store' | 'discard';
  /** Indicates that the depth component is read only. */
  depthReadOnly?: boolean;

  /** Indicates value to clear stencil component to prior to executing the render pass, if stencilLoadOp is "clear". */
  stencilClearValue?: number;
  /** Indicates  load operation to perform on stencil component prior to executing the render pass. Prefer clearing. */
  stencilLoadOp?: 'load' | 'clear';
  /** Store operation to perform on stencil component after executing the render pass. */
  stencilStoreOp?: 'store' | 'discard';
  /** Indicates that the stencil component is read only. */
  stencilReadOnly?: boolean;
};
