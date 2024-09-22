import { describe, it } from '../mocha-support.js';
import {
  generateMipmap,
  numMipLevels,
} from '../../dist/1.x/webgpu-utils.module.js';
import { assertArrayEqualApproximately, assertEqual } from '../assert.js';
import { readTextureUnpadded, testWithDeviceWithOptions } from '../webgpu.js';

// prevent global document
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const document = undefined;

/* global GPUTextureUsage */

describe('generate-mipmap tests', () => {

  it('returns correct number of mip levels', () => {
    assertEqual(numMipLevels([1]), 1);
    assertEqual(numMipLevels([2]), 2);
    assertEqual(numMipLevels([3]), 2);
    assertEqual(numMipLevels([4]), 3);
    assertEqual(numMipLevels([4]), 3);

    assertEqual(numMipLevels([1, 1]), 1);
    assertEqual(numMipLevels([1, 2]), 2);
    assertEqual(numMipLevels([1, 3]), 2);
    assertEqual(numMipLevels([1, 4]), 3);
    assertEqual(numMipLevels([1, 4]), 3);

    assertEqual(numMipLevels([1, 1, 1]), 1);
    assertEqual(numMipLevels([1, 1, 2]), 1);
    assertEqual(numMipLevels([1, 1, 3]), 1);
    assertEqual(numMipLevels([1, 1, 4]), 1);
    assertEqual(numMipLevels([1, 1, 4]), 1);

    assertEqual(numMipLevels([1, 1, 1], '3d'), 1);
    assertEqual(numMipLevels([1, 1, 2], '3d'), 2);
    assertEqual(numMipLevels([1, 1, 3], '3d'), 2);
    assertEqual(numMipLevels([1, 1, 4], '3d'), 3);
    assertEqual(numMipLevels([1, 1, 4], '3d'), 3);

    assertEqual(numMipLevels({width: 1}), 1);
    assertEqual(numMipLevels({width: 2}), 2);
    assertEqual(numMipLevels({width: 3}), 2);
    assertEqual(numMipLevels({width: 4}), 3);
    assertEqual(numMipLevels({width: 4}), 3);

    assertEqual(numMipLevels({width: 1, height: 1}), 1);
    assertEqual(numMipLevels({width: 1, height: 2}), 2);
    assertEqual(numMipLevels({width: 1, height: 3}), 2);
    assertEqual(numMipLevels({width: 1, height: 4}), 3);
    assertEqual(numMipLevels({width: 1, height: 4}), 3);

    assertEqual(numMipLevels({width: 1, depthOrArrayLayers: 1}, '3d'), 1);
    assertEqual(numMipLevels({width: 1, depthOrArrayLayers: 2}, '3d'), 2);
    assertEqual(numMipLevels({width: 1, depthOrArrayLayers: 3}, '3d'), 2);
    assertEqual(numMipLevels({width: 1, depthOrArrayLayers: 4}, '3d'), 3);
    assertEqual(numMipLevels({width: 1, depthOrArrayLayers: 4}, '3d'), 3);

    assertEqual(numMipLevels({width: 1, depthOrArrayLayers: 1}), 1);
    assertEqual(numMipLevels({width: 1, depthOrArrayLayers: 2}), 1);
    assertEqual(numMipLevels({width: 1, depthOrArrayLayers: 3}), 1);
    assertEqual(numMipLevels({width: 1, depthOrArrayLayers: 4}), 1);
    assertEqual(numMipLevels({width: 1, depthOrArrayLayers: 4}), 1);

  });

  function test(compatibilityMode) {
    const options = {
      compatibilityMode,
    };

    describe(compatibilityMode ? 'test compatibility mode' : 'test normal WebGPU', () => {

      const r = [255, 0, 0, 255];
      const g = [0, 255, 0, 255];
      const b = [0, 0, 255, 255];
      const y = [255, 255, 0, 255];
      const c = [0, 255, 255, 255];
      const m = [255, 0, 255, 255];

      const layerData = [
        {
          src: new Uint8Array([
            r, r, b, b,
            r, r, b, b,
            b, b, r, r,
            b, b, r, r,
          ].flat()),
          expected: [128, 0, 128, 255],
        },
        {
          src: new Uint8Array([
            g, g, b, b,
            g, g, b, b,
            b, b, g, g,
            b, b, g, g,
          ].flat()),
          expected: [0, 128, 128, 255],
        },
        {
          src: new Uint8Array([
            y, y, m, m,
            y, y, m, m,
            m, m, y, y,
            m, m, y, y,
          ].flat()),
          expected: [255, 128, 128, 255],
        },
        {
          src: new Uint8Array([
            c, c, m, m,
            c, c, m, m,
            m, m, c, c,
            m, m, c, c,
          ].flat()),
          expected: [128, 128, 255, 255],
        },
        {
          src: new Uint8Array([
            b, b, y, y,
            b, b, y, y,
            y, y, b, b,
            y, y, b, b,
          ].flat()),
          expected: [128, 128, 128, 255],
        },
        {
          src: new Uint8Array([
            g, g, r, r,
            g, g, r, r,
            r, r, g, g,
            r, r, g, g,
          ].flat()),
          expected: [128, 128, 0, 255],
        },
      ];

      async function testGenerateMipmap(device, textureData, textureOptions = {}) {
        const kTextureWidth = 4;
        const kTextureHeight = 4;
        const size = [kTextureWidth, kTextureHeight, textureData.length];
        const texture = device.createTexture({
          ...textureOptions,
          size,
          mipLevelCount: numMipLevels(size),
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING |
                 GPUTextureUsage.RENDER_ATTACHMENT |
                 GPUTextureUsage.COPY_DST |
                 GPUTextureUsage.COPY_SRC,
        });

        textureData.forEach(({src}, layer) => {
          device.queue.writeTexture(
              { texture, origin: [0, 0, layer] },
              src,
              { bytesPerRow: kTextureWidth * 4 },
              { width: kTextureWidth, height: kTextureHeight },
          );
        });
        generateMipmap(device, texture, textureOptions.textureBindingViewDimension === 'cube' ? 'cube' : undefined);

        const results = await Promise.all(textureData.map((_, layer) => readTextureUnpadded(device, texture, 2, layer)));

        textureData.forEach(({expected}, layer) => {
          assertArrayEqualApproximately(results[layer], expected, 1, `for layer: ${layer}`);
        });

      }

      it('generates mipmaps 1 layer', testWithDeviceWithOptions(options, async device => {
        await testGenerateMipmap(device, layerData.slice(0, 1));
      }));

      it('generates mipmaps 3 layers', testWithDeviceWithOptions(options, async device => {
        await testGenerateMipmap(device, layerData.slice(0, 3));
      }));

      it('generates mipmaps 6 layers (cube)', testWithDeviceWithOptions(options, async device => {
        await testGenerateMipmap(device, layerData.slice(0, 6), { textureBindingViewDimension: 'cube' });
      }));

      it('generates mipmaps 6 layers (2d-array)', testWithDeviceWithOptions(options, async device => {
        await testGenerateMipmap(device, layerData.slice(0, 6), { textureBindingViewDimension: '2d-array' });
      }));

      it('generates mipmaps 12 layers (cube-array)', testWithDeviceWithOptions(options, async device => {
        if (options.compatibilityMode) {
          // no cube-array in compat
          return;
        }
        await testGenerateMipmap.call(this,
            device,
            [
              ...layerData.slice(0, 6),
              ...layerData.slice(0, 6).reverse(),
            ],
        );
      }));

    });
  }

  test(false);
  test(true);

 });

