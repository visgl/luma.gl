import test from 'tape';

import {
  isTextureSliceData,
  getFirstMipLevel,
  getTextureSizeFromData,
  type TextureImageData,
  type TextureDataProps,
  type TextureCubeFace,
  type TextureSliceData
} from '../../src/dynamic-texture/texture-data';

import type {} from '../../src/dynamic-texture/dynamic-texture';

import {isExternalImage, getExternalImageSize} from '@luma.gl/core';

test('isTextureSliceData: typed array image vs not', t => {
  t.equal(
    isTextureSliceData(mkImageData(4, 2)),
    true,
    'true for TextureImageData with typed array'
  );

  // Random non-image objects
  t.equal(isTextureSliceData({} as any), false, 'false for random object');
  t.equal(isTextureSliceData([] as any), false, 'false for array');
  t.equal(isTextureSliceData(null as any), false, 'false for null');

  // If environment provides an ExternalImage, ensure it returns false here
  const image = maybeMakeExternalImage();
  if (image) {
    t.equal(isExternalImage(image), true, 'isExternalImage: external image is detected by luma');
    t.equal(isTextureSliceData(image), true, 'isTextureSliceData: ExternalImage');
  } else {
    t.comment(
      'ExternalImage test skipped (no native external image type available in this environment).'
    );
  }

  t.end();
});

test('getFirstMipLevel: single, array, empty', t => {
  const m0 = mkImageData(8, 8);
  t.equal(getFirstMipLevel(m0), m0, 'returns item when single mip');

  const m1 = mkImageData(4, 4);
  t.equal(getFirstMipLevel([m0, m1]), m0, 'returns first when array');

  t.equal(getFirstMipLevel(null), null, 'null input → null');
  t.equal(getFirstMipLevel([]), null, 'empty array → null');

  t.end();
});

test('getTextureSizeFromData: 1d', t => {
  const props: TextureDataProps = {dimension: '1d', data: mkImageData(32, 1)};
  t.deepEqual(getTextureSizeFromData(props), {width: 32, height: 1});
  t.end();
});

test('getTextureSizeFromData: 2d (single & mips)', t => {
  t.deepEqual(
    getTextureSizeFromData({dimension: '2d', data: mkImageData(64, 32)}),
    {width: 64, height: 32},
    '2d single mip'
  );

  t.deepEqual(
    getTextureSizeFromData({dimension: '2d', data: [mkImageData(64, 64), mkImageData(32, 32)]}),
    {width: 64, height: 64},
    '2d first mip from array'
  );

  t.end();
});

test('getTextureSizeFromData: 2d with ExternalImage (env-dependent)', t => {
  const ext = maybeMakeExternalImage();
  if (!ext) {
    t.comment('Skipping 2d ExternalImage size test (no native external image available).');
    t.end();
    return;
  }

  // Sanity check: luma reports correct size
  const reported = getExternalImageSize(ext);
  t.ok(
    reported && typeof reported.width === 'number' && typeof reported.height === 'number',
    'getExternalImageSize returns width/height'
  );

  const props: TextureDataProps = {dimension: '2d', data: ext};
  t.deepEqual(
    getTextureSizeFromData(props),
    reported,
    'uses getExternalImageSize for ExternalImage'
  );
  t.end();
});

test('getTextureSizeFromData: 3d & 2d-array', t => {
  const threeD = [
    [mkImageData(16, 8), mkImageData(8, 4)], // depth slice 0 (with mips)
    [mkImageData(16, 8)] // depth slice 1
  ];
  t.deepEqual(
    getTextureSizeFromData({dimension: '3d', data: threeD as any}),
    {width: 16, height: 8},
    '3d first slice, first mip'
  );

  const arr = [mkImageData(20, 10), mkImageData(20, 10)];
  t.deepEqual(
    getTextureSizeFromData({dimension: '2d-array', data: arr as any}),
    {width: 20, height: 10},
    '2d-array first layer, first mip'
  );

  t.equal(getTextureSizeFromData({dimension: '3d', data: [] as any}), null, '3d empty → null');
  t.equal(
    getTextureSizeFromData({dimension: '2d-array', data: [] as any}),
    null,
    '2d-array empty → null'
  );

  t.end();
});

test('getTextureSizeFromData: cube & cube-array', t => {
  const cube: Record<TextureCubeFace, TextureSliceData> = {
    '+X': mkImageData(128, 128),
    '-X': mkImageData(128, 128),
    '+Y': mkImageData(128, 128),
    '-Y': mkImageData(128, 128),
    '+Z': mkImageData(128, 128),
    '-Z': mkImageData(128, 128)
  };
  t.deepEqual(
    getTextureSizeFromData({dimension: 'cube', data: cube}),
    {width: 128, height: 128},
    'cube: picks first face first mip'
  );

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
  t.deepEqual(
    getTextureSizeFromData({dimension: 'cube-array', data: [cube0, cube1]}),
    {width: 64, height: 64},
    'cube-array: first cube, first face, first mip'
  );

  t.equal(
    getTextureSizeFromData({dimension: 'cube', data: {} as any}),
    null,
    'cube empty map → null'
  );
  t.equal(
    getTextureSizeFromData({dimension: 'cube-array', data: [] as any}),
    null,
    'cube-array empty → null'
  );

  t.end();
});

test('getTextureSizeFromData: invalid 2d payload throws', t => {
  // When first mip is neither ExternalImage nor has width/height keys.
  const bad: any = {foo: 'bar'};
  t.throws(
    () => getTextureSizeFromData({dimension: '2d', data: bad}),
    /Unsupported mip-level data/,
    'throws for unsupported mip-level data'
  );
  t.end();
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
    if (
      typeof OffscreenCanvas !== 'undefined' &&
      typeof (globalThis as any).createImageBitmap === 'function'
    ) {
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
