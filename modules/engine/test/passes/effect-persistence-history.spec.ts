// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {EffectRenderer} from '@luma.gl/engine';
import {persistence, sepiaEffect} from '@luma.gl/engine/effects';
import {expect, it} from 'vitest';

for (const backend of ['webgpu', 'webgl'] as const) {
  it(`persistence retains and resets its own frame history on ${backend}`, async context => {
    const device = await getTestDevice(backend);
    if (!device) return context.skip();

    const sourceTexture = device.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      data: new Uint8Array([255, 0, 0, 255]),
      usage: Texture.SAMPLE | Texture.COPY_DST
    });
    const renderer = new EffectRenderer(device, {
      effects: [persistence],
      colorFormat: 'rgba8unorm'
    });
    renderer.resize([1, 1]);

    async function readRed(resetHistory = false): Promise<number> {
      const encoder = device.createCommandEncoder();
      const output = renderer.render({commandEncoder: encoder, sourceTexture, resetHistory});
      device.submit(encoder.finish());
      if (!output) throw new Error('Expected persistence to produce a color texture.');
      const buffer = device.createBuffer({
        byteLength: output.computeMemoryLayout().byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        output.readBuffer({}, buffer);
        const bytes = await buffer.readAsync();
        return bytes[0];
      } finally {
        buffer.destroy();
      }
    }

    try {
      const firstRed = await readRed();
      expect(firstRed).toBeGreaterThan(0);
      sourceTexture.writeData(new Uint8Array([0, 0, 0, 0]));
      const trailRed = await readRed();
      expect(trailRed).toBeGreaterThan(0);
      expect(trailRed).toBeLessThan(firstRed);
      expect(await readRed(true)).toBe(0);
    } finally {
      renderer.destroy();
      sourceTexture.destroy();
    }
  });
}

it('renders a module filter into a borrowed framebuffer', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const sourceTexture = device.createTexture({
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    data: new Uint8Array([255, 0, 0, 255]),
    usage: Texture.SAMPLE | Texture.COPY_DST
  });
  const target = device.createFramebuffer({width: 1, height: 1, colorAttachments: ['rgba8unorm']});
  const renderer = new EffectRenderer(device, {effects: [sepiaEffect], colorFormat: 'rgba8unorm'});
  renderer.resize([1, 1]);
  const commandEncoder = device.createCommandEncoder();
  try {
    expect(renderer.render({sourceTexture, target, commandEncoder})).toBe(true);
    device.submit(commandEncoder.finish());
    expect(target.colorAttachments[0].texture.width).toBe(1);
  } finally {
    renderer.destroy();
    target.destroy();
    sourceTexture.destroy();
  }
});
