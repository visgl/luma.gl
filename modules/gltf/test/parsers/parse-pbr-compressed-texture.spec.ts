import {expect, test} from 'vitest';
import { NullDevice } from '@luma.gl/test-utils';
import { createCompressedTexture, type CompressedImageDataArray, type CompressedImageMipmapArray } from '@luma.gl/gltf/parsers/parse-pbr-material';
const device = new NullDevice({});
const BASE_OPTIONS = {
  id: 'test-texture',
  sampler: {}
};

// --- loaders.gl current format: data is Array, mipmaps is boolean, textureFormat is a TextureFormat ---

test('gltf#createCompressedTexture - data-array single mip level', () => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [{
      data: new Uint8Array(64),
      width: 256,
      height: 256,
      textureFormat: 'astc-4x4-unorm'
    }]
  };
  const texture = createCompressedTexture(device, image, BASE_OPTIONS);
  expect(texture, 'texture created').toBeTruthy();
  expect(texture.width, 'width from mip level').toBe(256);
  expect(texture.height, 'height from mip level').toBe(256);
  expect(texture.format, 'textureFormat passed through').toBe('astc-4x4-unorm');
  expect(texture.mipLevels, 'single mip level').toBe(1);
  texture.destroy();
});
test('gltf#createCompressedTexture - data-array with multiple mip levels', () => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [{
      data: new Uint8Array(64),
      width: 256,
      height: 256,
      textureFormat: 'astc-4x4-unorm'
    }, {
      data: new Uint8Array(16),
      width: 128,
      height: 128,
      textureFormat: 'astc-4x4-unorm'
    }, {
      data: new Uint8Array(4),
      width: 64,
      height: 64,
      textureFormat: 'astc-4x4-unorm'
    }]
  };
  const texture = createCompressedTexture(device, image, BASE_OPTIONS);
  expect(texture, 'texture created').toBeTruthy();
  expect(texture.width, 'width from base level').toBe(256);
  expect(texture.format, 'textureFormat passed through').toBe('astc-4x4-unorm');
  expect(texture.mipLevels, 'all three mip levels').toBe(3);
  texture.destroy();
});
test('gltf#createCompressedTexture - data-array with undefined top-level dimensions', () => {
  const image = {
    compressed: true,
    mipmaps: true,
    width: undefined,
    height: undefined,
    data: [{
      data: new Uint8Array(64),
      width: 256,
      height: 256,
      textureFormat: 'etc2-rgb8unorm'
    }]
  };
  const texture = createCompressedTexture(device, image, BASE_OPTIONS);
  expect(texture, 'texture created despite undefined top-level dimensions').toBeTruthy();
  expect(texture.width, 'width from mip level').toBe(256);
  expect(texture.format, 'textureFormat passed through').toBe('etc2-rgb8unorm');
  texture.destroy();
});

// --- Hypothetical mipmaps-array format (forward compatibility) ---

test('gltf#createCompressedTexture - mipmaps array format single level', () => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    width: 512,
    height: 512,
    mipmaps: [{
      data: new Uint8Array(128),
      width: 512,
      height: 512,
      textureFormat: 'bc7-rgba-unorm'
    }]
  };
  const texture = createCompressedTexture(device, image, BASE_OPTIONS);
  expect(texture, 'texture created').toBeTruthy();
  expect(texture.width, 'width matches').toBe(512);
  expect(texture.format, 'format from mipmap level').toBe('bc7-rgba-unorm');
  expect(texture.mipLevels, 'single mip level').toBe(1);
  texture.destroy();
});
test('gltf#createCompressedTexture - mipmaps array format multiple levels', () => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    mipmaps: [{
      data: new Uint8Array(64),
      width: 256,
      height: 256,
      textureFormat: 'etc2-rgb8unorm'
    }, {
      data: new Uint8Array(16),
      width: 128,
      height: 128,
      textureFormat: 'etc2-rgb8unorm'
    }, {
      data: new Uint8Array(4),
      width: 64,
      height: 64,
      textureFormat: 'etc2-rgb8unorm'
    }]
  };
  const texture = createCompressedTexture(device, image, BASE_OPTIONS);
  expect(texture, 'texture created').toBeTruthy();
  expect(texture.width, 'width from base level').toBe(256);
  expect(texture.mipLevels, 'all three levels').toBe(3);
  texture.destroy();
});

// --- Validation / fallback tests ---

test('gltf#createCompressedTexture - empty data array returns fallback', () => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: []
  };
  const texture = createCompressedTexture(device, image as any, BASE_OPTIONS);
  expect(texture, 'fallback texture created').toBeTruthy();
  expect(texture.width, 'fallback width is 1').toBe(1);
  expect(texture.format, 'fallback format').toBe('rgba8unorm');
  texture.destroy();
});
test('gltf#createCompressedTexture - base level with zero dimensions returns fallback', () => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    mipmaps: [{
      data: new Uint8Array(64),
      width: 0,
      height: 256,
      textureFormat: 'bc7-rgba-unorm'
    }, {
      data: new Uint8Array(16),
      width: 128,
      height: 128,
      textureFormat: 'bc7-rgba-unorm'
    }]
  };
  const texture = createCompressedTexture(device, image, BASE_OPTIONS);
  expect(texture, 'fallback texture created').toBeTruthy();
  expect(texture.width, 'fallback width').toBe(1);
  expect(texture.format, 'fallback format').toBe('rgba8unorm');
  texture.destroy();
});
test('gltf#createCompressedTexture - zero base width not masked by top-level width', () => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    width: 512,
    height: 512,
    mipmaps: [{
      data: new Uint8Array(64),
      width: 0,
      height: 256,
      textureFormat: 'bc7-rgba-unorm'
    }]
  };
  const texture = createCompressedTexture(device, image, BASE_OPTIONS);
  expect(texture, 'fallback texture created').toBeTruthy();
  expect(texture.width, 'fallback width despite image.width=512').toBe(1);
  expect(texture.format, 'fallback format').toBe('rgba8unorm');
  texture.destroy();
});
test('gltf#createCompressedTexture - mismatched textureFormat values truncate chain', () => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [{
      data: new Uint8Array(64),
      width: 256,
      height: 256,
      textureFormat: 'astc-4x4-unorm'
    }, {
      data: new Uint8Array(16),
      width: 128,
      height: 128,
      textureFormat: 'etc2-rgb8unorm'
    }]
  };
  const texture = createCompressedTexture(device, image, BASE_OPTIONS);
  expect(texture, 'texture created').toBeTruthy();
  expect(texture.mipLevels, 'chain truncated at format mismatch').toBe(1);
  expect(texture.format, 'format from valid base level').toBe('astc-4x4-unorm');
  texture.destroy();
});
test('gltf#createCompressedTexture - invalid mip level truncates chain', () => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    mipmaps: [{
      data: new Uint8Array(64),
      width: 256,
      height: 256,
      textureFormat: 'bc7-rgba-unorm'
    }, {
      data: new Uint8Array(16),
      width: 128,
      height: 128,
      textureFormat: 'bc7-rgba-unorm'
    }, {
      data: null as any,
      width: 0,
      height: 0,
      textureFormat: 'bc7-rgba-unorm'
    }]
  };
  const texture = createCompressedTexture(device, image, BASE_OPTIONS);
  expect(texture, 'texture created').toBeTruthy();
  expect(texture.mipLevels, 'chain truncated at invalid level').toBe(2);
  texture.destroy();
});
test('gltf#createCompressedTexture - missing textureFormat returns fallback', () => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    mipmaps: [{
      data: new Uint8Array(64),
      width: 256,
      height: 256
    }]
  };
  const texture = createCompressedTexture(device, image, BASE_OPTIONS);
  expect(texture, 'fallback texture created').toBeTruthy();
  expect(texture.width, 'fallback width').toBe(1);
  expect(texture.format, 'fallback format').toBe('rgba8unorm');
  texture.destroy();
});
test('gltf#createCompressedTexture - block-size limit truncates mip chain', () => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [{
      data: new Uint8Array(64),
      width: 16,
      height: 16,
      textureFormat: 'astc-10x10-unorm'
    }, {
      data: new Uint8Array(16),
      width: 8,
      height: 8,
      textureFormat: 'astc-10x10-unorm'
    }]
  };
  const texture = createCompressedTexture(device, image, BASE_OPTIONS);
  expect(texture, 'texture created').toBeTruthy();
  expect(texture.mipLevels, 'chain capped before mip dimensions drop below block size').toBe(1);
  texture.destroy();
});
