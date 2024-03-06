// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray} from '@math.gl/core';

/**
 * Flip rows (can be used on arrays returned from `Framebuffer.readPixels`)
 * https: *stackoverflow.com/questions/41969562/
 * how-can-i-flip-the-result-of-webglrenderingcontext-readpixels
 * @param param0
 */
export function flipRows(options: {
  data: TypedArray;
  width: number;
  height: number;
  bytesPerPixel?: number;
  temp?: Uint8Array;
}): void {
  const {data, width, height, bytesPerPixel = 4, temp} = options;
  const bytesPerRow = width * bytesPerPixel;

  // make a temp buffer to hold one row
  const tempBuffer = temp || new Uint8Array(bytesPerRow);
  for (let y = 0; y < height / 2; ++y) {
    const topOffset = y * bytesPerRow;
    const bottomOffset = (height - y - 1) * bytesPerRow;
    // make copy of a row on the top half
    tempBuffer.set(data.subarray(topOffset, topOffset + bytesPerRow));
    // copy a row from the bottom half to the top
    data.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);
    // copy the copy of the top half row to the bottom half
    data.set(tempBuffer, bottomOffset);
  }
}

export function scalePixels(options: {data: TypedArray; width: number; height: number}): {
  data: Uint8Array;
  width: number;
  height: number;
} {
  const {data, width, height} = options;
  const newWidth = Math.round(width / 2);
  const newHeight = Math.round(height / 2);
  const newData = new Uint8Array(newWidth * newHeight * 4);
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      for (let c = 0; c < 4; c++) {
        newData[(y * newWidth + x) * 4 + c] = data[(y * 2 * width + x * 2) * 4 + c];
      }
    }
  }
  return {data: newData, width: newWidth, height: newHeight};
}
