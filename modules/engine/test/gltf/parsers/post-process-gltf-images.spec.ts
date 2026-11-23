// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  postProcessGLTF,
  type GLTFImageData,
  type GLTFImagePostprocessed
} from '@luma.gl/engine/gltf';
import type {
  CompressedImageDataArray,
  CompressedImageMipmapArray,
  CompressedMipLevel
} from '@luma.gl/engine/gltf/parsers/parse-pbr-material';
import {expect, expectTypeOf, test} from 'vitest';

test('glTF image types cover missing resources and borrowed browser images', () => {
  expectTypeOf<null>().toExtend<GLTFImagePostprocessed['image']>();
  expectTypeOf<ImageBitmap>().toExtend<GLTFImageData>();
  expectTypeOf<HTMLImageElement>().toExtend<GLTFImageData>();
  const gltf = postProcessGLTF({
    json: {asset: {version: '2.0'}, images: [{uri: 'image.png'}]},
    buffers: []
  });
  expect(gltf.images[0].image).toBeNull();
});

test.runIf(typeof createImageBitmap === 'function' && typeof document !== 'undefined')(
  'glTF postprocessing borrows native images without requiring pixel data properties',
  async () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const bitmap = await createImageBitmap(canvas);
    try {
      const image = new Image();
      const gltf = postProcessGLTF({
        json: {asset: {version: '2.0'}, images: [{uri: 'bitmap.png'}, {uri: 'image.png'}]},
        buffers: [],
        images: [bitmap, image]
      });
      expect(gltf.images[0].image).toBe(bitmap);
      expect(gltf.images[1].image).toBe(image);
    } finally {
      bitmap.close();
    }
  }
);

test('glTF postprocessing accepts and borrows compressed data and mipmap arrays', () => {
  expectTypeOf<CompressedImageDataArray>().toExtend<GLTFImageData>();
  expectTypeOf<CompressedImageMipmapArray>().toExtend<GLTFImageData>();
  const level: CompressedMipLevel = {
    data: new Uint8Array(16),
    width: 4,
    height: 4,
    textureFormat: 'bc7-rgba-unorm'
  };
  const dataImage: CompressedImageDataArray = {compressed: true, mipmaps: true, data: [level]};
  const mipmapImage: CompressedImageMipmapArray = {compressed: true, mipmaps: [level]};
  const gltf = postProcessGLTF({
    json: {asset: {version: '2.0'}, images: [{uri: 'data.ktx2'}, {uri: 'mipmaps.ktx2'}]},
    buffers: [],
    images: [dataImage, mipmapImage]
  });
  expect(gltf.images[0].image).toBe(dataImage);
  expect(gltf.images[1].image).toBe(mipmapImage);
});
