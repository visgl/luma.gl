// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TextureFormat} from './texture-formats';
import {VertexType} from './vertex-formats';

/** Information about the structure of a texture format */
export type TextureFormatInfo = {
  /** The format that is described */
  format: TextureFormat;
  /** Color or depth stencil attachment formats */
  attachment?: 'color' | 'depth' | 'stencil' | 'depth-stencil';
  /** String describing which channels this texture has */
  channels: 'r' | 'rg' | 'rgb' | 'rgba' | 'bgra';
  /** Number of components (corresponds to channels string) */
  components: 1 | 2 | 3 | 4;
  /** What is the data type of each component */
  dataType?: VertexType;
  /** If this is a packed data type */
  packed?: boolean;
  /** Number of bytes per pixel */
  bytesPerPixel?: number;
  /** Number of bits per channel (may be unreliable for packed formats) */
  bitsPerChannel: [number, number, number, number];
  /** SRGB texture format? */
  srgb?: boolean;
  /** WebGL specific texture format? */
  webgl?: boolean;
  /** Is this an integer or floating point format? */
  integer: boolean;
  /** Is this a signed or unsigned format? */
  signed: boolean;
  /** Is this a normalized integer format? */
  normalized: boolean;
  /** Is this a compressed texture format */
  compressed?: boolean;
  /** Compressed formats only: Block size for ASTC formats (texture width must be a multiple of this value) */
  blockWidth?: number;
  /** Compressed formats only: Block size for ASTC formats (texture height must be a multiple of this value) */
  blockHeight?: number;
};
