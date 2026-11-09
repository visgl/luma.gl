// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUResourcePreview} from '@luma.gl/graph/gpu-core';

/** Display conversion only: preserve the readback bytes for numeric inspection. */
export function makeTexturePreviewPixels(
  preview: GPUResourcePreview
): Uint8ClampedArray<ArrayBuffer> | undefined {
  const match = /^(r|rg|rgba|bgra)(8unorm|8snorm|16float|32float)(-srgb)?$/.exec(
    preview.format ?? ''
  );
  if (!match || !preview.width || !preview.height) return undefined;
  const channels = match[1] === 'r' ? 1 : match[1] === 'rg' ? 2 : 4;
  const storage = match[2];
  const componentBytes = storage === '16float' ? 2 : storage === '32float' ? 4 : 1;
  const count = preview.width * preview.height;
  if (preview.data.byteLength !== count * channels * componentBytes) return undefined;
  const source = new DataView(
    preview.data.buffer,
    preview.data.byteOffset,
    preview.data.byteLength
  );
  const pixels = new Uint8ClampedArray(count * 4);
  const read = (index: number): number => {
    const offset = index * componentBytes;
    if (storage === '8unorm') return source.getUint8(offset) / 255;
    if (storage === '8snorm') return Math.max(-1, source.getInt8(offset) / 127);
    if (storage === '32float') return source.getFloat32(offset, true);
    const bits = source.getUint16(offset, true);
    const sign = bits & 0x8000 ? -1 : 1;
    const exponent = (bits >> 10) & 31;
    const fraction = bits & 1023;
    return (
      sign *
      (exponent === 31
        ? fraction
          ? NaN
          : Infinity
        : exponent === 0
          ? fraction * 2 ** -24
          : (1 + fraction / 1024) * 2 ** (exponent - 15))
    );
  };
  for (let index = 0; index < count; index++) {
    for (let channel = 0; channel < 4; channel++) {
      const sourceChannel = match[1] === 'bgra' && channel < 3 ? 2 - channel : channel;
      let value = channel === 3 ? 1 : 0;
      if (sourceChannel < channels) value = read(index * channels + sourceChannel);
      else if (channels === 1 && channel < 3) value = read(index);
      // Linear float/unorm colors are displayed in sRGB; signed values and HDR are clamped.
      value = Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
      if (channel < 3 && !match[3])
        value = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
      pixels[index * 4 + channel] = Math.round(value * 255);
    }
  }
  return pixels;
}

export function makeTexturePreviewCanvas(
  document: Document,
  preview: GPUResourcePreview
): HTMLCanvasElement | undefined {
  const pixels = makeTexturePreviewPixels(preview);
  if (!pixels) return undefined;
  const canvas = document.createElement('canvas');
  canvas.width = preview.width!;
  canvas.height = preview.height!;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute(
    'aria-label',
    `Current texture allocation, top-left ${canvas.width} by ${canvas.height} pixels; display range 0 to 1`
  );
  canvas.title = 'Current allocation · top-left crop · display range 0–1';
  canvas.getContext('2d')?.putImageData(new ImageData(pixels, canvas.width, canvas.height), 0, 0);
  canvas.style.cssText = `width:${(128 * canvas.width) / Math.max(canvas.width, canvas.height)}px;max-width:100%;height:auto;image-rendering:pixelated;background:repeating-conic-gradient(#888 0% 25%,#bbb 0% 50%) 0/12px 12px`;
  return canvas;
}
