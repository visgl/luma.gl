// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {textureFormatDecoder, type TextureMemoryLayout} from '@luma.gl/core';
import {getNullTestDevice} from '@luma.gl/core/test-utils';

it('overwrites every layout field when reusing output across formats and alignments', () => {
  const result = {} as TextureMemoryLayout;
  const compressed = {
    format: 'astc-5x4-unorm' as const,
    width: 7,
    height: 9,
    depth: 3,
    byteAlignment: 256
  };
  expect(textureFormatDecoder.computeMemoryLayout(compressed, result)).toBe(result);
  expect(result).toEqual({
    bytesPerPixel: 1,
    bytesPerRow: 256,
    rowsPerImage: 3,
    depthOrArrayLayers: 3,
    bytesPerImage: 768,
    byteLength: 2304
  });
  const packed = {format: 'rgb10a2unorm' as const, width: 3, height: 2, depth: 1, byteAlignment: 8};
  expect(textureFormatDecoder.computeMemoryLayout(packed, result)).toBe(result);
  expect(result).toEqual(textureFormatDecoder.computeMemoryLayout(packed));
  // Packed byte sizes continue to follow existing format metadata.
  const color = {...packed, format: 'rgba8unorm' as const};
  textureFormatDecoder.computeMemoryLayout(color, result);
  expect(result).toEqual({
    bytesPerPixel: 4,
    bytesPerRow: 16,
    rowsPerImage: 2,
    depthOrArrayLayers: 1,
    bytesPerImage: 32,
    byteLength: 32
  });
  expect(textureFormatDecoder.computeMemoryLayout(color)).not.toBe(result);
});

it('texture layout scratch is reentrant and never escapes as a default result', async () => {
  const device = await getNullTestDevice();
  const texture = device.createTexture({width: 16, height: 8, format: 'rgba8unorm'});
  const original = textureFormatDecoder.computeMemoryLayout.bind(textureFormatDecoder);
  const compute = vi.spyOn(textureFormatDecoder, 'computeMemoryLayout');
  try {
    compute.mockImplementationOnce((options, result) => {
      const width = options.width;
      expect(texture.computeMemoryLayout({width: 2, height: 1}).bytesPerRow).toBe(8);
      expect(options.width).toBe(width);
      return original(options, result);
    });
    const result = {} as TextureMemoryLayout;
    expect(texture.computeMemoryLayout({width: 4, height: 2}, result)).toBe(result);
    expect(result.bytesPerRow).toBe(16);
    const fresh = texture.computeMemoryLayout({width: 1, height: 1});
    expect(fresh).not.toBe(result);
    expect(result.bytesPerRow).toBe(16);
    compute.mockImplementationOnce(() => {
      throw new Error('layout failed');
    });
    expect(() => texture.computeMemoryLayout()).toThrow('layout failed');
    expect(texture.computeMemoryLayout({width: 1, height: 1})).toEqual(fresh);
  } finally {
    compute.mockRestore();
    texture.destroy();
  }
});

it('write normalization calculates row stride without a full layout object', async () => {
  const device = await getNullTestDevice();
  const texture = device.createTexture({width: 8, height: 4, format: 'rgba8unorm'});
  const compute = vi.spyOn(textureFormatDecoder, 'computeMemoryLayout');
  try {
    const options = texture._normalizeTextureWriteOptions({width: 3, height: 2});
    expect(options.bytesPerRow).toBe(12);
    expect(options.rowsPerImage).toBe(2);
    expect(compute).not.toHaveBeenCalled();
    expect(() => texture._normalizeTextureWriteOptions({bytesPerRow: 1})).toThrow('bytesPerRow');
  } finally {
    compute.mockRestore();
    texture.destroy();
  }
});
