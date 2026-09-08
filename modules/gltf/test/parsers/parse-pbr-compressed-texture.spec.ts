// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {TextureFormat} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {
  createCompressedTexture,
  type CompressedImageDataArray,
  type CompressedImageMipmapArray
} from '@luma.gl/gltf/parsers/parse-pbr-material';

class CompressedTextureNullDevice extends NullDevice {
  override isTextureFormatSupported(_format: TextureFormat): boolean {
    return true;
  }
}

const device = new CompressedTextureNullDevice({});

const BASE_OPTIONS = {
  id: 'test-texture',
  sampler: {}
};

// --- loaders.gl current format: data is Array, mipmaps is boolean, textureFormat is a TextureFormat ---

it('gltf#createCompressedTexture - data-array single mip level', () => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [
      {
        data: new Uint8Array(64),
        width: 256,
        height: 256,
        textureFormat: 'astc-4x4-unorm'
      }
    ]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  expect(Boolean(texture), 'texture created').toBe(true);
  expect(texture.width, 'width from mip level').toBe(256);
  expect(texture.height, 'height from mip level').toBe(256);
  expect(texture.format, 'textureFormat passed through').toBe('astc-4x4-unorm');
  expect(texture.mipLevels, 'single mip level').toBe(1);

  texture.destroy();
  void 0;
});

it('gltf#createCompressedTexture - data-array with multiple mip levels', () => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [
      {
        data: new Uint8Array(64),
        width: 256,
        height: 256,
        textureFormat: 'astc-4x4-unorm'
      },
      {
        data: new Uint8Array(16),
        width: 128,
        height: 128,
        textureFormat: 'astc-4x4-unorm'
      },
      {
        data: new Uint8Array(4),
        width: 64,
        height: 64,
        textureFormat: 'astc-4x4-unorm'
      }
    ]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  expect(Boolean(texture), 'texture created').toBe(true);
  expect(texture.width, 'width from base level').toBe(256);
  expect(texture.format, 'textureFormat passed through').toBe('astc-4x4-unorm');
  expect(texture.mipLevels, 'all three mip levels').toBe(3);

  texture.destroy();
  void 0;
});

it('gltf#createCompressedTexture - data-array with undefined top-level dimensions', () => {
  const image = {
    compressed: true,
    mipmaps: true,
    width: undefined,
    height: undefined,
    data: [
      {
        data: new Uint8Array(64),
        width: 256,
        height: 256,
        textureFormat: 'etc2-rgb8unorm'
      }
    ]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  expect(Boolean(texture), 'texture created despite undefined top-level dimensions').toBe(true);
  expect(texture.width, 'width from mip level').toBe(256);
  expect(texture.format, 'textureFormat passed through').toBe('etc2-rgb8unorm');

  texture.destroy();
  void 0;
});

// --- Hypothetical mipmaps-array format (forward compatibility) ---

it('gltf#createCompressedTexture - mipmaps array format single level', () => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    width: 512,
    height: 512,
    mipmaps: [{data: new Uint8Array(128), width: 512, height: 512, textureFormat: 'bc7-rgba-unorm'}]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  expect(Boolean(texture), 'texture created').toBe(true);
  expect(texture.width, 'width matches').toBe(512);
  expect(texture.format, 'format from mipmap level').toBe('bc7-rgba-unorm');
  expect(texture.mipLevels, 'single mip level').toBe(1);

  texture.destroy();
  void 0;
});

it('gltf#createCompressedTexture - mipmaps array format multiple levels', () => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    mipmaps: [
      {data: new Uint8Array(64), width: 256, height: 256, textureFormat: 'etc2-rgb8unorm'},
      {data: new Uint8Array(16), width: 128, height: 128, textureFormat: 'etc2-rgb8unorm'},
      {data: new Uint8Array(4), width: 64, height: 64, textureFormat: 'etc2-rgb8unorm'}
    ]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  expect(Boolean(texture), 'texture created').toBe(true);
  expect(texture.width, 'width from base level').toBe(256);
  expect(texture.mipLevels, 'all three levels').toBe(3);

  texture.destroy();
  void 0;
});

// --- Validation / fallback tests ---

it('gltf#createCompressedTexture - empty data array returns fallback', () => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: []
  };

  const texture = createCompressedTexture(device, image as any, BASE_OPTIONS);

  expect(Boolean(texture), 'fallback texture created').toBe(true);
  expect(texture.width, 'fallback width is 1').toBe(1);
  expect(texture.format, 'fallback format').toBe('rgba8unorm');

  texture.destroy();
  void 0;
});

it('gltf#createCompressedTexture - base level with zero dimensions returns fallback', () => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    mipmaps: [
      {data: new Uint8Array(64), width: 0, height: 256, textureFormat: 'bc7-rgba-unorm'},
      {data: new Uint8Array(16), width: 128, height: 128, textureFormat: 'bc7-rgba-unorm'}
    ]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  expect(Boolean(texture), 'fallback texture created').toBe(true);
  expect(texture.width, 'fallback width').toBe(1);
  expect(texture.format, 'fallback format').toBe('rgba8unorm');

  texture.destroy();
  void 0;
});

it('gltf#createCompressedTexture - zero base width not masked by top-level width', () => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    width: 512,
    height: 512,
    mipmaps: [{data: new Uint8Array(64), width: 0, height: 256, textureFormat: 'bc7-rgba-unorm'}]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  expect(Boolean(texture), 'fallback texture created').toBe(true);
  expect(texture.width, 'fallback width despite image.width=512').toBe(1);
  expect(texture.format, 'fallback format').toBe('rgba8unorm');

  texture.destroy();
  void 0;
});

it('gltf#createCompressedTexture - mismatched textureFormat values truncate chain', () => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [
      {
        data: new Uint8Array(64),
        width: 256,
        height: 256,
        textureFormat: 'astc-4x4-unorm'
      },
      {
        data: new Uint8Array(16),
        width: 128,
        height: 128,
        textureFormat: 'etc2-rgb8unorm'
      }
    ]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  expect(Boolean(texture), 'texture created').toBe(true);
  expect(texture.mipLevels, 'chain truncated at format mismatch').toBe(1);
  expect(texture.format, 'format from valid base level').toBe('astc-4x4-unorm');

  texture.destroy();
  void 0;
});

it('gltf#createCompressedTexture - invalid mip level truncates chain', () => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    mipmaps: [
      {data: new Uint8Array(64), width: 256, height: 256, textureFormat: 'bc7-rgba-unorm'},
      {data: new Uint8Array(16), width: 128, height: 128, textureFormat: 'bc7-rgba-unorm'},
      {data: null as any, width: 0, height: 0, textureFormat: 'bc7-rgba-unorm'}
    ]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  expect(Boolean(texture), 'texture created').toBe(true);
  expect(texture.mipLevels, 'chain truncated at invalid level').toBe(2);

  texture.destroy();
  void 0;
});

it('gltf#createCompressedTexture - missing textureFormat returns fallback', () => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    mipmaps: [{data: new Uint8Array(64), width: 256, height: 256}]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  expect(Boolean(texture), 'fallback texture created').toBe(true);
  expect(texture.width, 'fallback width').toBe(1);
  expect(texture.format, 'fallback format').toBe('rgba8unorm');

  texture.destroy();
  void 0;
});

it('gltf#createCompressedTexture - unsupported device format returns fallback', () => {
  const unsupportedDevice = new NullDevice({});
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [
      {
        data: new Uint8Array(64),
        width: 256,
        height: 256,
        textureFormat: 'bc7-rgba-unorm'
      }
    ]
  };

  const texture = createCompressedTexture(unsupportedDevice, image, BASE_OPTIONS);

  expect(texture.format, 'unsupported compressed format uses fallback').toBe('rgba8unorm');
  expect(texture.width, 'fallback has deterministic dimensions').toBe(1);

  texture.destroy();
  unsupportedDevice.destroy();
  void 0;
});

it('gltf#createCompressedTexture - block-size limit truncates mip chain', () => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [
      {data: new Uint8Array(64), width: 16, height: 16, textureFormat: 'astc-10x10-unorm'},
      {data: new Uint8Array(16), width: 8, height: 8, textureFormat: 'astc-10x10-unorm'}
    ]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  expect(Boolean(texture), 'texture created').toBe(true);
  expect(texture.mipLevels, 'chain capped before mip dimensions drop below block size').toBe(1);

  texture.destroy();
  void 0;
});
