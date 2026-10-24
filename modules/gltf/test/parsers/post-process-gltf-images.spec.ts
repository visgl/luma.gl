// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {postProcessGLTF, type GLTFImageData, type GLTFImagePostprocessed} from '@luma.gl/gltf';
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
