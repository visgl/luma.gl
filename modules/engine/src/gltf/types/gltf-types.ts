// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/// <reference lib="es2025.float16" preserve="true" />

import type {GLTF, GLTFAccessor} from './gltf-json-schema';
import type {ExternalImage, TextureFormat, TypedArray} from '@luma.gl/core';

/** Numeric storage accepted by resolved glTF accessors, including loader extensions. */
export type GLTFTypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float16Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

/** Resolved byte range; offsets are relative to the supplied ArrayBuffer. */
export type GLTFExternalBuffer = {
  arrayBuffer: ArrayBuffer;
  byteOffset: number;
  byteLength: number;
};

/** One mip level as produced by loaders.gl compressed texture parsers */
export type CompressedMipLevel = {
  data: TypedArray;
  width: number;
  height: number;
  textureFormat?: TextureFormat;
};

/**
 * Compressed image from current loaders.gl releases.
 * - `mipmaps` is a boolean (true), NOT an array
 * - `data` is an Array of TextureLevel-like objects
 * - Per-level `textureFormat` is already a luma.gl TextureFormat
 * - Top-level `width`/`height` may be undefined
 */
export type CompressedImageDataArray = {
  compressed: true;
  mipmaps?: boolean;
  width?: number;
  height?: number;
  data: CompressedMipLevel[];
};

/**
 * Hypothetical future format where `mipmaps` is an actual array.
 * Kept for forward compatibility.
 */
export type CompressedImageMipmapArray = {
  compressed: true;
  width?: number;
  height?: number;
  mipmaps: CompressedMipLevel[];
};

/** Union of all known loaders.gl compressed image shapes */
export type CompressedImage = CompressedImageDataArray | CompressedImageMipmapArray;

/** Borrowed native images or decoded pixel/compressed image data. */
export type GLTFImageData =
  | ExternalImage
  | CompressedImage
  | {
      data: ArrayBufferView;
      compressed?: boolean;
      mipmaps?: boolean;
      height?: number;
      width?: number;
      components?: number;
      mimeType?: string;
    };

/** Standard glTF JSON with resources supplied by the caller or an optional loader.
 * Compression and transcoding must be resolved before postprocessing.
 * Resources are borrowed; postprocessing does not fetch or destroy them.
 */
export type GLTFWithBuffers = {
  json: GLTF & {
    /** Optional materialized accessor storage supplied by a decoder. */
    accessors?: (GLTFAccessor & {value?: GLTFTypedArray})[];
  };
  buffers: GLTFExternalBuffer[];
  images?: (GLTFImageData | null)[];
  binary?: ArrayBuffer;
  baseUri?: string;
};

/** Loader-derived index runs for KHR_mesh_primitive_restart. */
export type GLTFPrimitiveRestartData = {
  readonly restartIndex: number;
  readonly ranges: readonly {readonly offset: number; readonly count: number}[];
};
