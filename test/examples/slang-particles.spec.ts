// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import SlangParticlesExample from '../../examples/tutorials/slang-particles/app';
import {
  makeParticles,
  simulateParticles
} from '../../examples/tutorials/slang-particles/simulation';

it('Slang particle simulation matches three CPU steps and renders the resulting GPU buffer', async () => {
  const device = (await getWebGPUTestDevice('core'))!;
  const application = new SlangParticlesExample({device} as AnimationProps, 128);
  const texture = device.createTexture({
    width: 256,
    height: 256,
    format: 'rgba8unorm',
    usage: Texture.RENDER | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    colorAttachments: [texture],
    width: 256,
    height: 256,
    depthStencilAttachment: 'depth24plus'
  });
  const readback = device.createBuffer({
    byteLength: 256 * 256 * 4,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    await vi.waitFor(() => {
      const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
      const drawn = application.model.draw(pass);
      pass.end();
      device.submit();
      expect(drawn).toBe(true);
    });
    let expected = makeParticles(application.particleCount);
    for (let step = 1; step <= 3; step++) {
      expected = simulateParticles(expected, step / 60, 1 / 60);
      application.step(step / 60, 1 / 60);
      device.submit();
    }
    const bytes = await application.currentParticles.readAsync();
    const actual = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    expect(actual.length).toBe(expected.length);
    for (let index = 0; index < actual.length; index++)
      expect(Math.abs(actual[index] - expected[index])).toBeLessThan(0.00001);
    const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
    expect(application.model.draw(pass)).toBe(true);
    pass.end();
    device.submit();
    texture.readBuffer({width: 256, height: 256}, readback);
    const pixels = new Uint8Array(await readback.readAsync());
    expect(pixels.filter((value, index) => index % 4 !== 3 && value > 10).length).toBeGreaterThan(
      50
    );
    application.reset();
    device.submit();
    const resetBytes = await application.currentParticles.readAsync();
    expect(
      new Float32Array(resetBytes.buffer, resetBytes.byteOffset, resetBytes.byteLength / 4)
    ).toEqual(makeParticles(application.particleCount));
  } finally {
    application.onFinalize();
    readback.destroy();
    framebuffer.destroy();
    texture.destroy();
  }
});
