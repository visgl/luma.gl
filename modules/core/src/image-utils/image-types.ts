// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Built-in data types that can be used to initialize textures
 * @note ImageData can be used for contiguous 8 bit data via Uint8ClampedArray
 */
export type ExternalImage =
  | ImageBitmap
  | ImageData
  | HTMLImageElement
  | HTMLVideoElement
  | VideoFrame
  | HTMLCanvasElement
  | OffscreenCanvas;

export type ExternalImageData = {
  data: ArrayBuffer | SharedArrayBuffer | ArrayBufferView;
  byteOffset?: number;
  bytesPerRow?: number;
  rowsPerImage?: number;
};

/** Check if data is an external image */
export function isExternalImage(data: unknown): data is ExternalImage {
  return (
    (typeof ImageData !== 'undefined' && data instanceof ImageData) ||
    (typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap) ||
    (typeof HTMLImageElement !== 'undefined' && data instanceof HTMLImageElement) ||
    (typeof HTMLVideoElement !== 'undefined' && data instanceof HTMLVideoElement) ||
    (typeof VideoFrame !== 'undefined' && data instanceof VideoFrame) ||
    (typeof HTMLCanvasElement !== 'undefined' && data instanceof HTMLCanvasElement) ||
    (typeof OffscreenCanvas !== 'undefined' && data instanceof OffscreenCanvas)
  );
}

/** Determine size (width and height) of provided image data */
export function getExternalImageSize(data: ExternalImage): {width: number; height: number} {
  if (
    (typeof ImageData !== 'undefined' && data instanceof ImageData) ||
    (typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap) ||
    (typeof HTMLCanvasElement !== 'undefined' && data instanceof HTMLCanvasElement) ||
    (typeof OffscreenCanvas !== 'undefined' && data instanceof OffscreenCanvas)
  ) {
    return {width: data.width, height: data.height};
  }
  if (typeof HTMLImageElement !== 'undefined' && data instanceof HTMLImageElement) {
    return {width: data.naturalWidth, height: data.naturalHeight};
  }
  if (typeof HTMLVideoElement !== 'undefined' && data instanceof HTMLVideoElement) {
    return {width: data.videoWidth, height: data.videoHeight};
  }
  if (typeof VideoFrame !== 'undefined' && data instanceof VideoFrame) {
    // TODO: is this the right choice for width and height?
    return {width: data.displayWidth, height: data.displayHeight};
  }
  throw new Error('Unknown image type');
}
