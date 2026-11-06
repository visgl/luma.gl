// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer, type Texture} from '@luma.gl/core';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {toHalfFloat, fromHalfFloat} from '@luma.gl/shaders';
import {PrefilteredEnvironmentGenerator} from '@luma.gl/engine/lighting';

async function readPixel(texture: Texture, face = 0, mipLevel = 0, x = 0, y = 0) {
  const options = {width: 1, height: 1, x, y, z: face, mipLevel};
  const layout = texture.computeMemoryLayout(options);
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer(options, buffer);
    const result = await buffer.readAsync(0, layout.byteLength);
    return texture.format === 'rgba16float'
      ? Array.from(new Uint16Array(result.buffer, result.byteOffset, 4), fromHalfFloat)
      : Array.from(new Uint8Array(result.buffer, result.byteOffset, 4), value => value / 255);
  } finally {
    buffer.destroy();
  }
}

test('portable environment filtering preserves constant radiance, HDR, batches of outputs and borrowed LUTs', async context => {
  const webglDevice = await getWebGLTestDevice();
  const devices = [...(await getTestDevices(['webgpu'])), ...(webglDevice ? [webglDevice] : [])];
  if (!devices.length) return context.skip('No rendering device');
  for (const device of devices) {
    const capabilities = device.getTextureFormatCapabilities('rgba16float');
    const format = capabilities.render && capabilities.filter ? 'rgba16float' : 'rgba8unorm';
    const expected =
      format === 'rgba16float' ? [2, 0.5, 0.25, 1] : [128 / 255, 64 / 255, 32 / 255, 1];
    const source = device.createTexture({
      width: 2,
      height: 1,
      format,
      data:
        format === 'rgba16float'
          ? Uint16Array.from([...expected, ...expected], toHalfFloat)
          : new Uint8Array([128, 64, 32, 255, 128, 64, 32, 255])
    });
    const generator = new PrefilteredEnvironmentGenerator(device);
    const environment = generator.prepare({
      source,
      format,
      size: 4,
      irradianceSize: 2,
      brdfLUTSize: 4,
      sampleCount: 32
    });
    let second: ReturnType<typeof generator.prepare> | undefined;
    try {
      for (let face = 0; face < 6; face++) {
        for (let mipLevel = 0; mipLevel < 3; mipLevel++) {
          const pixel = await readPixel(environment.textures.specularTexture, face, mipLevel);
          expected.forEach((value, channel) =>
            expect(pixel[channel], `${device.type} face ${face} mip ${mipLevel}`).toBeCloseTo(
              value,
              2
            )
          );
        }
        const diffuse = await readPixel(environment.textures.diffuseTexture, face);
        expected.forEach((value, channel) => expect(diffuse[channel]).toBeCloseTo(value, 2));
      }
      second = generator.prepare({
        source,
        format,
        size: 2,
        irradianceSize: 1,
        brdfLUTTexture: environment.textures.brdfLUTTexture,
        sampleCount: 8
      });
      expect(second.textures.brdfLUTTexture).toBe(environment.textures.brdfLUTTexture);
      generator.destroy();
      expect((await readPixel(second.textures.specularTexture))[0]).toBeCloseTo(expected[0], 2);
      second.destroy();
      expect(environment.textures.brdfLUTTexture.destroyed).toBe(false);
      expect(source.destroyed).toBe(false);
    } finally {
      second?.destroy();
      environment.destroy();
      generator.destroy();
      source.destroy();
    }
  }
}, 30000);

test('direction-coded equirectangular input preserves cube face orientation', async context => {
  const webglDevice = await getWebGLTestDevice();
  const devices = [...(await getTestDevices(['webgpu'])), ...(webglDevice ? [webglDevice] : [])];
  if (!devices.length) return context.skip('No rendering device');
  const width = 64;
  const height = 32;
  const data = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const longitude = ((column + 0.5) / width - 0.5) * 2 * Math.PI;
      const latitude = ((row + 0.5) / height) * Math.PI;
      const direction = [
        Math.sin(latitude) * Math.cos(longitude),
        Math.cos(latitude),
        Math.sin(latitude) * Math.sin(longitude)
      ];
      data.set(
        [...direction.map(value => Math.round((value + 1) * 127.5)), 255],
        (row * width + column) * 4
      );
    }
  }
  const expectedDirections = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1]
  ];
  for (const device of devices) {
    const source = device.createTexture({
      width,
      height,
      format: 'rgba8unorm',
      data,
      sampler: {
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'repeat',
        addressModeV: 'clamp-to-edge'
      }
    });
    const generator = new PrefilteredEnvironmentGenerator(device);
    const environment = generator.prepare({
      source,
      format: 'rgba8unorm',
      size: 3,
      irradianceSize: 1,
      brdfLUTSize: 4,
      sampleCount: 512
    });
    try {
      for (let face = 0; face < 6; face++) {
        const pixel = await readPixel(environment.textures.specularTexture, face, 0, 1, 1);
        expectedDirections[face].forEach((value, channel) => {
          expect(
            Math.abs(pixel[channel] - (value + 1) / 2),
            `${device.type} cube axis ${face}:${channel}`
          ).toBeLessThan(0.03);
        });
      }
      // Off-axis texels catch vertical face flips that axis-center checks cannot detect.
      const directions = [
        [1, 2 / 3, 2 / 3],
        [-1, 2 / 3, -2 / 3],
        [-2 / 3, 1, -2 / 3],
        [-2 / 3, -1, 2 / 3],
        [-2 / 3, 2 / 3, 1],
        [2 / 3, 2 / 3, -1]
      ];
      for (let face = 0; face < 6; face++) {
        const pixel = await readPixel(environment.textures.specularTexture, face);
        const length = Math.hypot(...directions[face]);
        directions[face].forEach((value, channel) => {
          expect(
            Math.abs(pixel[channel] - (value / length + 1) / 2),
            `${device.type} cube corner ${face}:${channel}`
          ).toBeLessThan(0.03);
        });
      }
      // Independent double-precision hemispherical midpoint quadrature (2048 x 2048),
      // with NdotV = 0.625 and Schlick-GGX k = roughness squared / 2.
      // Row zero is roughness 0.875; row three is roughness 0.125.
      const referenceRows = [
        {row: 0, values: [0.473788, 0.002119]},
        {row: 3, values: [0.982822, 0.007529]}
      ];
      for (const {row, values} of referenceRows) {
        const lookup = await readPixel(environment.textures.brdfLUTTexture, 0, 0, 2, row);
        values.forEach((value, channel) => {
          expect(
            Math.abs(lookup[channel] - value),
            `${device.type} BRDF row ${row}:${channel}`
          ).toBeLessThan(0.015);
        });
      }
    } finally {
      environment.destroy();
      generator.destroy();
      source.destroy();
    }
  }
}, 30000);
