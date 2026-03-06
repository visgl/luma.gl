// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {NullDevice} from '@luma.gl/test-utils';
import {GL} from '@luma.gl/constants';
import {
  createCompressedTexture,
  type CompressedImageFlat,
  type CompressedImageDataArray,
  type CompressedImageMipmapArray
} from '@luma.gl/gltf/parsers/parse-pbr-material';

const device = new NullDevice({});

const BASE_OPTIONS = {
  id: 'test-texture',
  sampler: {}
};

// --- loaders.gl < 4.3 flat format ---

test('gltf#createCompressedTexture - old flat format (loaders.gl < 4.3)', t => {
  const image: CompressedImageFlat = {
    compressed: true,
    format: 'bc7-rgba-unorm',
    data: new Uint8Array(64),
    width: 256,
    height: 256
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  t.ok(texture, 'texture created');
  t.equals(texture.width, 256, 'width matches');
  t.equals(texture.height, 256, 'height matches');
  t.equals(texture.format, 'bc7-rgba-unorm', 'format matches');
  t.equals(texture.mipLevels, 1, 'single mip level');

  texture.destroy();
  t.end();
});

// --- loaders.gl 4.3.4 actual format: data is Array, mipmaps is boolean, format is GL enum ---

test('gltf#createCompressedTexture - loaders.gl 4.3 data-array with GL enum format', t => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [
      {
        data: new Uint8Array(64),
        width: 256,
        height: 256,
        format: GL.COMPRESSED_RGBA_ASTC_4x4_KHR,
        compressed: true
      }
    ]
  };

  const texture = createCompressedTexture(device, image as any, BASE_OPTIONS);

  t.ok(texture, 'texture created');
  t.equals(texture.width, 256, 'width from mip level');
  t.equals(texture.height, 256, 'height from mip level');
  t.equals(texture.format, 'astc-4x4-unorm', 'GL enum resolved to TextureFormat string');
  t.equals(texture.mipLevels, 1, 'single mip level');

  texture.destroy();
  t.end();
});

test('gltf#createCompressedTexture - loaders.gl 4.3 data-array with multiple mip levels', t => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [
      {
        data: new Uint8Array(64),
        width: 256,
        height: 256,
        format: GL.COMPRESSED_RGBA_ASTC_4x4_KHR,
        compressed: true
      },
      {
        data: new Uint8Array(16),
        width: 128,
        height: 128,
        format: GL.COMPRESSED_RGBA_ASTC_4x4_KHR,
        compressed: true
      },
      {
        data: new Uint8Array(4),
        width: 64,
        height: 64,
        format: GL.COMPRESSED_RGBA_ASTC_4x4_KHR,
        compressed: true
      }
    ]
  };

  const texture = createCompressedTexture(device, image as any, BASE_OPTIONS);

  t.ok(texture, 'texture created');
  t.equals(texture.width, 256, 'width from base level');
  t.equals(texture.format, 'astc-4x4-unorm', 'GL enum resolved to TextureFormat');
  t.equals(texture.mipLevels, 3, 'all three mip levels');

  texture.destroy();
  t.end();
});

test('gltf#createCompressedTexture - loaders.gl 4.3 with undefined top-level dimensions', t => {
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
        format: GL.COMPRESSED_RGB8_ETC2,
        compressed: true
      }
    ]
  };

  const texture = createCompressedTexture(device, image as any, BASE_OPTIONS);

  t.ok(texture, 'texture created despite undefined top-level dimensions');
  t.equals(texture.width, 256, 'width from mip level');
  t.equals(texture.format, 'etc2-rgb8unorm', 'GL enum resolved');

  texture.destroy();
  t.end();
});

test('gltf#createCompressedTexture - unknown GL enum format returns fallback', t => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [{data: new Uint8Array(64), width: 256, height: 256, format: 99999, compressed: true}]
  };

  const texture = createCompressedTexture(device, image as any, BASE_OPTIONS);

  t.ok(texture, 'fallback texture created');
  t.equals(texture.width, 1, 'fallback width is 1');
  t.equals(texture.format, 'rgba8unorm', 'fallback format is rgba8unorm');

  texture.destroy();
  t.end();
});

// --- Hypothetical mipmaps-array format (forward compatibility) ---

test('gltf#createCompressedTexture - mipmaps array format single level', t => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    width: 512,
    height: 512,
    mipmaps: [{data: new Uint8Array(128), width: 512, height: 512, format: 'bc7-rgba-unorm'}]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  t.ok(texture, 'texture created');
  t.equals(texture.width, 512, 'width matches');
  t.equals(texture.format, 'bc7-rgba-unorm', 'format from mipmap level');
  t.equals(texture.mipLevels, 1, 'single mip level');

  texture.destroy();
  t.end();
});

test('gltf#createCompressedTexture - mipmaps array format multiple levels', t => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    format: 'etc2-rgb8unorm',
    mipmaps: [
      {data: new Uint8Array(64), width: 256, height: 256, format: 'etc2-rgb8unorm'},
      {data: new Uint8Array(16), width: 128, height: 128, format: 'etc2-rgb8unorm'},
      {data: new Uint8Array(4), width: 64, height: 64, format: 'etc2-rgb8unorm'}
    ]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  t.ok(texture, 'texture created');
  t.equals(texture.width, 256, 'width from base level');
  t.equals(texture.mipLevels, 3, 'all three levels');

  texture.destroy();
  t.end();
});

// --- Validation / fallback tests ---

test('gltf#createCompressedTexture - empty data array returns fallback', t => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: []
  };

  const texture = createCompressedTexture(device, image as any, BASE_OPTIONS);

  t.ok(texture, 'fallback texture created');
  t.equals(texture.width, 1, 'fallback width is 1');
  t.equals(texture.format, 'rgba8unorm', 'fallback format');

  texture.destroy();
  t.end();
});

test('gltf#createCompressedTexture - base level with zero dimensions returns fallback', t => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    mipmaps: [
      {data: new Uint8Array(64), width: 0, height: 256, format: 'bc7-rgba-unorm'},
      {data: new Uint8Array(16), width: 128, height: 128, format: 'bc7-rgba-unorm'}
    ]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  t.ok(texture, 'fallback texture created');
  t.equals(texture.width, 1, 'fallback width');
  t.equals(texture.format, 'rgba8unorm', 'fallback format');

  texture.destroy();
  t.end();
});

test('gltf#createCompressedTexture - zero base width not masked by top-level width', t => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    width: 512,
    height: 512,
    mipmaps: [{data: new Uint8Array(64), width: 0, height: 256, format: 'bc7-rgba-unorm'}]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  t.ok(texture, 'fallback texture created');
  t.equals(texture.width, 1, 'fallback width despite image.width=512');
  t.equals(texture.format, 'rgba8unorm', 'fallback format');

  texture.destroy();
  t.end();
});

test('gltf#createCompressedTexture - mismatched GL enum formats truncate chain', t => {
  const image: CompressedImageDataArray = {
    compressed: true,
    mipmaps: true,
    data: [
      {
        data: new Uint8Array(64),
        width: 256,
        height: 256,
        format: GL.COMPRESSED_RGBA_ASTC_4x4_KHR,
        compressed: true
      },
      {
        data: new Uint8Array(16),
        width: 128,
        height: 128,
        format: GL.COMPRESSED_RGB8_ETC2,
        compressed: true
      }
    ]
  };

  const texture = createCompressedTexture(device, image as any, BASE_OPTIONS);

  t.ok(texture, 'texture created');
  t.equals(texture.mipLevels, 1, 'chain truncated at format mismatch');
  t.equals(texture.format, 'astc-4x4-unorm', 'format from valid base level');

  texture.destroy();
  t.end();
});

test('gltf#createCompressedTexture - invalid mip level truncates chain', t => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    mipmaps: [
      {data: new Uint8Array(64), width: 256, height: 256, format: 'bc7-rgba-unorm'},
      {data: new Uint8Array(16), width: 128, height: 128, format: 'bc7-rgba-unorm'},
      {data: null as any, width: 0, height: 0, format: 'bc7-rgba-unorm'}
    ]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  t.ok(texture, 'texture created');
  t.equals(texture.mipLevels, 2, 'chain truncated at invalid level');

  texture.destroy();
  t.end();
});

test('gltf#createCompressedTexture - no format anywhere returns fallback', t => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    mipmaps: [{data: new Uint8Array(64), width: 256, height: 256}]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  t.ok(texture, 'fallback texture created');
  t.equals(texture.width, 1, 'fallback width');
  t.equals(texture.format, 'rgba8unorm', 'fallback format');

  texture.destroy();
  t.end();
});

test('gltf#createCompressedTexture - format from top-level fallback when mipmap has no format', t => {
  const image: CompressedImageMipmapArray = {
    compressed: true,
    format: 'astc-4x4-unorm',
    mipmaps: [{data: new Uint8Array(64), width: 256, height: 256}]
  };

  const texture = createCompressedTexture(device, image, BASE_OPTIONS);

  t.ok(texture, 'texture created');
  t.equals(texture.format, 'astc-4x4-unorm', 'format falls back to image.format');

  texture.destroy();
  t.end();
});
