// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/// <reference lib="es2025.float16" preserve="true" />

import type {GLTF} from './gltf-json-schema';
import type {ExternalImage} from '@luma.gl/core';

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

/** Borrowed native images or decoded pixel/compressed image data. */
export type GLTFImageData =
  | ExternalImage
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
  json: GLTF;
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
