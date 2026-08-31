// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {createGLTFTexture} from '@luma.gl/gltf';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

it('gltf#createGLTFTexture generates authored mipmaps on WebGL and WebGPU', async () => {
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
        expect(texture.mipLevels, `${device.type} allocates the full mip chain`).toBe(2);
        expect(texture.format, `${device.type} decodes ${colorSpace} textures exactly once`).toBe(
          colorSpace === 'srgb' ? 'rgba8unorm-srgb' : 'rgba8unorm'
        );

        texture.readBuffer({mipLevel: 1, width: 1, height: 1}, buffer);
        const mipLevel = new Uint8Array(await buffer.readAsync(0, layout.byteLength));
        expect(mipLevel[0] > 0, `${device.type} generates ${colorSpace} mip texels`).toBe(true);
        expect(mipLevel[3], `${device.type} preserves authored mip opacity`).toBe(255);
      } finally {
        buffer.destroy();
        texture.destroy();
      }
    }
  }

  image.close();
});
