// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {createGLTFTexture} from '@luma.gl/gltf';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

test('gltf#createGLTFTexture generates authored mipmaps on WebGL and WebGPU', async testContext => {
  const image = await createImageBitmap(
    new ImageData(
      new Uint8ClampedArray([0, 0, 0, 255, 4, 0, 0, 255, 8, 0, 0, 255, 12, 0, 0, 255]),
      2,
      2
    )
  );
  const devices = [await getWebGLTestDevice(), await getWebGPUTestDevice()];

  for (const device of devices) {
    if (!device) {
      continue;
    }

    for (const colorSpace of ['linear', 'srgb'] as const) {
      const texture = createGLTFTexture(device, image, {
        id: `authored-${colorSpace}-mipmaps-${device.type}`,
        colorSpace,
        sampler: {
          minFilter: 'linear',
          magFilter: 'linear',
          mipmapFilter: 'linear'
        }
      });

      const layout = texture.computeMemoryLayout({mipLevel: 1, width: 1, height: 1});
      const buffer = device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });

      try {
        testContext.equal(texture.mipLevels, 2, `${device.type} allocates the full mip chain`);
        testContext.equal(
          texture.format,
          colorSpace === 'srgb' ? 'rgba8unorm-srgb' : 'rgba8unorm',
          `${device.type} decodes ${colorSpace} textures exactly once`
        );

        texture.readBuffer({mipLevel: 1, width: 1, height: 1}, buffer);
        const mipLevel = new Uint8Array(await buffer.readAsync(0, layout.byteLength));
        testContext.ok(mipLevel[0] > 0, `${device.type} generates ${colorSpace} mip texels`);
        testContext.equal(mipLevel[3], 255, `${device.type} preserves authored mip opacity`);
      } finally {
        buffer.destroy();
        texture.destroy();
      }
    }
  }

  image.close();
  testContext.end();
});
