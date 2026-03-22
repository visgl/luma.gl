import {expect, test} from 'vitest';
import { isTextureSliceData, getFirstMipLevel, getTextureSizeFromData, type TextureImageData, type TextureDataProps, type TextureCubeFace, type TextureSliceData } from '../../src/dynamic-texture/texture-data';
import type {} from '../../src/dynamic-texture/dynamic-texture';
import { isExternalImage, getExternalImageSize } from '@luma.gl/core';
test('isTextureSliceData: typed array image vs not', () => {
  expect(isTextureSliceData(mkImageData(4, 2)), 'true for TextureImageData with typed array').toBe(true);

  // Random non-image objects
  expect(isTextureSliceData({} as any), 'false for random object').toBe(false);
  expect(isTextureSliceData([] as any), 'false for array').toBe(false);
  expect(isTextureSliceData(null as any), 'false for null').toBe(false);

  // If environment provides an ExternalImage, ensure it returns false here
  const image = maybeMakeExternalImage();
  if (image) {
    expect(isExternalImage(image), 'isExternalImage: external image is detected by luma').toBe(true);
    expect(isTextureSliceData(image), 'isTextureSliceData: ExternalImage').toBe(true);
  } else {}
});
test('getFirstMipLevel: single, array, empty', () => {
  const m0 = mkImageData(8, 8);
  expect(getFirstMipLevel(m0), 'returns item when single mip').toBe(m0);
  const m1 = mkImageData(4, 4);
  expect(getFirstMipLevel([m0, m1]), 'returns first when array').toBe(m0);
  expect(getFirstMipLevel(null), 'null input → null').toBe(null);
  expect(getFirstMipLevel([]), 'empty array → null').toBe(null);
});
test('getTextureSizeFromData: 1d', () => {
  const props: TextureDataProps = {
    dimension: '1d',
    data: mkImageData(32, 1)
  };
  expect(getTextureSizeFromData(props)).toEqual({
    width: 32,
    height: 1
  });
});
test('getTextureSizeFromData: 2d (single & mips)', () => {
  expect(getTextureSizeFromData({
    dimension: '2d',
    data: mkImageData(64, 32)
  }), '2d single mip').toEqual({
    width: 64,
    height: 32
  });
  expect(getTextureSizeFromData({
    dimension: '2d',
    data: [mkImageData(64, 64), mkImageData(32, 32)]
  }), '2d first mip from array').toEqual({
    width: 64,
    height: 64
  });
});
test('getTextureSizeFromData: 2d with ExternalImage (env-dependent)', () => {
  const ext = maybeMakeExternalImage();
  if (!ext) {
    return;
  }

  // Sanity check: luma reports correct size
  const reported = getExternalImageSize(ext);
  expect(reported && typeof reported.width === 'number' && typeof reported.height === 'number', 'getExternalImageSize returns width/height').toBeTruthy();
  const props: TextureDataProps = {
    dimension: '2d',
    data: ext
  };
  expect(getTextureSizeFromData(props), 'uses getExternalImageSize for ExternalImage').toEqual(reported);
});
test('getTextureSizeFromData: 3d & 2d-array', () => {
  const threeD = [[mkImageData(16, 8), mkImageData(8, 4)],
  // depth slice 0 (with mips)
  [mkImageData(16, 8)] // depth slice 1
  ];
  expect(getTextureSizeFromData({
    dimension: '3d',
    data: threeD as any
  }), '3d first slice, first mip').toEqual({
    width: 16,
    height: 8
  });
  const arr = [mkImageData(20, 10), mkImageData(20, 10)];
  expect(getTextureSizeFromData({
    dimension: '2d-array',
    data: arr as any
  }), '2d-array first layer, first mip').toEqual({
    width: 20,
    height: 10
  });
  expect(getTextureSizeFromData({
    dimension: '3d',
    data: [] as any
  }), '3d empty → null').toBe(null);
  expect(getTextureSizeFromData({
    dimension: '2d-array',
    data: [] as any
  }), '2d-array empty → null').toBe(null);
});
test('getTextureSizeFromData: cube & cube-array', () => {
  const cube: Record<TextureCubeFace, TextureSliceData> = {
    '+X': mkImageData(128, 128),
    '-X': mkImageData(128, 128),
    '+Y': mkImageData(128, 128),
    '-Y': mkImageData(128, 128),
    '+Z': mkImageData(128, 128),
    '-Z': mkImageData(128, 128)
  };
  expect(getTextureSizeFromData({
    dimension: 'cube',
    data: cube
  }), 'cube: picks first face first mip').toEqual({
    width: 128,
    height: 128
  });
  const cube0: Record<TextureCubeFace, TextureSliceData> = {
    '+X': [mkImageData(64, 64), mkImageData(32, 32)],
    '-X': mkImageData(64, 64),
    '+Y': mkImageData(64, 64),
    '-Y': mkImageData(64, 64),
    '+Z': mkImageData(64, 64),
    '-Z': mkImageData(64, 64)
  };
  const cube1: Record<TextureCubeFace, TextureSliceData> = {
    '+X': mkImageData(32, 32),
    '-X': mkImageData(32, 32),
    '+Y': mkImageData(32, 32),
    '-Y': mkImageData(32, 32),
    '+Z': mkImageData(32, 32),
    '-Z': mkImageData(32, 32)
  };
  expect(getTextureSizeFromData({
    dimension: 'cube-array',
    data: [cube0, cube1]
  }), 'cube-array: first cube, first face, first mip').toEqual({
    width: 64,
    height: 64
  });
  expect(getTextureSizeFromData({
    dimension: 'cube',
    data: {} as any
  }), 'cube empty map → null').toBe(null);
  expect(getTextureSizeFromData({
    dimension: 'cube-array',
    data: [] as any
  }), 'cube-array empty → null').toBe(null);
});
test('getTextureSizeFromData: invalid 2d payload throws', () => {
  // When first mip is neither ExternalImage nor has width/height keys.
  const bad: any = {
    foo: 'bar'
  };
  expect(() => getTextureSizeFromData({
    dimension: '2d',
    data: bad
  }), 'throws for unsupported mip-level data').toThrow(/Unsupported mip-level data/);
});

// ---------------- Helpers ----------------

function mkImageData(width: number, height: number, bytes = width * height * 4): TextureImageData {
  return {
    data: new Uint8Array(bytes),
    width,
    height,
    format: 'rgba8unorm'
  };
}
function maybeMakeExternalImage(): any | null {
  // Try to build a native "ExternalImage" that luma.gl recognizes in your env.
  // Prefer ImageData (widely available in browsers, sometimes available under jsdom),
  // then OffscreenCanvas/ImageBitmap if present.
  try {
    // ImageData path
    if (typeof ImageData !== 'undefined') {
      const imgData = new ImageData(4, 3);
      if (isExternalImage(imgData)) {
        return imgData;
      }
    }

    // OffscreenCanvas -> transferToImageBitmap
    if (typeof OffscreenCanvas !== 'undefined' && typeof (globalThis as any).createImageBitmap === 'function') {
      const oc = new OffscreenCanvas(5, 7);
      const bmp = (globalThis as any).createImageBitmap(oc);
      // Note: createImageBitmap may return a Promise in some envs; bail if async
      if (bmp && typeof bmp.then !== 'function' && isExternalImage(bmp)) {
        return bmp;
      }
    }
  } catch {
    // ignore
  }

  // TODO - Could add HTMLCanvasElement/HTMLImageElement branches for browser runs if desired.

  return null; // environment doesn’t provide a suitable external image type
}
