// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Texture feature checks
 * @note these must be a subset of DeviceFeatures.
 */
export type TextureFeature =
  | 'texture-compression-bc'
  | 'texture-compression-astc'
  | 'texture-compression-etc2'
  | 'texture-compression-etc1-webgl'
  | 'texture-compression-pvrtc-webgl'
  | 'texture-compression-atc-webgl'
  | 'float32-renderable-webgl'
  | 'float16-renderable-webgl'
  | 'rgb9e5ufloat-renderable-webgl'
  | 'snorm8-renderable-webgl'
  | 'norm16-renderable-webgl'
  | 'snorm16-renderable-webgl'
  | 'float32-filterable'
  | 'float16-filterable-webgl';
