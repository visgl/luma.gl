// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {getNullTestDevice} from '@luma.gl/core/test-utils';
import type {
  CopyElementImageOptions,
  CopyExternalImageOptions,
  CopyImageDataOptions,
  TextureReadOptions,
  TextureWriteOptions
} from '@luma.gl/core';

it.each([
  '2d-array',
  '3d'
] as const)('reuses read and write outputs without stale fields (%s)', async dimension => {
  const device = await getNullTestDevice();
  const texture = device.createTexture({dimension, width: 16, height: 8, depth: 4, mipLevels: 3});
  try {
    const read = {} as Required<TextureReadOptions>;
    const write = {} as Required<TextureWriteOptions>;
    const input = Object.freeze({
      mipLevel: 1,
      x: 2,
      y: 1,
      z: 1,
      width: 20,
      height: 10,
      depthOrArrayLayers: 10
    });
    expect(texture._normalizeTextureReadOptions(input, read)).toBe(read);
    expect(read).toEqual({
      mipLevel: 1,
      x: 2,
      y: 1,
      z: 1,
      width: 6,
      height: 3,
      depthOrArrayLayers: dimension === '3d' ? 1 : 3,
      aspect: 'all'
    });
    texture._normalizeTextureWriteOptions(
      {...input, byteOffset: 16, bytesPerRow: 64, rowsPerImage: 8},
      write
    );
    expect(write.byteOffset).toBe(16);
    expect(texture._normalizeTextureWriteOptions({width: undefined, byteOffset: 0}, write)).toBe(
      write
    );
    expect(write).toEqual(texture._normalizeTextureWriteOptions({}));
    expect(texture._normalizeTextureReadOptions({}, read)).toEqual(
      texture._normalizeTextureReadOptions({})
    );
    expect(texture._normalizeTextureReadOptions({})).not.toBe(
      texture._normalizeTextureReadOptions({})
    );
    expect(() => texture._normalizeTextureWriteOptions({bytesPerRow: 1}, write)).toThrow(
      'bytesPerRow'
    );
    expect(texture._normalizeTextureWriteOptions({}, write)).toEqual(
      texture._normalizeTextureWriteOptions({})
    );
    expect(texture._normalizeTextureWriteOptions(write, write)).toBe(write);
  } finally {
    texture.destroy();
  }
});

it('normalizes legacy copy depth and resets reusable image options', async () => {
  const device = await getNullTestDevice();
  const texture = device.createTexture({dimension: '2d-array', width: 16, height: 8, depth: 4});
  const data = new Uint8Array(512);
  const copied = {} as Required<CopyImageDataOptions>;
  const external = {} as Required<CopyExternalImageOptions>;
  const element = {} as Required<CopyElementImageOptions>;
  const image = {} as CopyExternalImageOptions['image'];
  const elementImage = {} as CopyElementImageOptions['element'];
  const size = vi.spyOn(device, 'getExternalImageSize').mockReturnValue({width: 4, height: 2});
  try {
    expect(texture._normalizeCopyImageDataOptions({data, depth: 2}, copied)).toBe(copied);
    expect(copied.depthOrArrayLayers).toBe(2);
    texture._normalizeCopyImageDataOptions({data, depth: 2, depthOrArrayLayers: 3}, copied);
    expect(copied.depth).toBe(3);
    texture._normalizeCopyImageDataOptions({data}, copied);
    expect(copied.depth).toBe(4);
    texture._normalizeCopyExternalImageOptions(
      {image, flipY: true, sourceX: 2, depth: 3},
      external
    );
    expect(texture._normalizeCopyExternalImageOptions({image}, external)).toBe(external);
    expect(external).toEqual(texture._normalizeCopyExternalImageOptions({image}));
    expect(external.width).toBe(4);
    expect(external.flipY).toBe(false);
    texture._normalizeCopyElementImageOptions(
      {element: elementImage, width: 4, height: 2, sourceWidth: 10, sourceHeight: 10},
      element
    );
    const next = {element: elementImage, width: 2, height: 1};
    expect(texture._normalizeCopyElementImageOptions(next, element)).toBe(element);
    expect(element).toEqual(texture._normalizeCopyElementImageOptions(next));
    expect(element.sourceWidth).toBeUndefined();
  } finally {
    size.mockRestore();
    texture.destroy();
  }
});
