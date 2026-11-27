// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {EffectRenderer} from '@luma.gl/engine';
import {persistence, persistenceEffect} from '@luma.gl/engine/effects';
import {expect, it} from 'vitest';

it('persistenceEffect#bindings', () => {
  expect(persistenceEffect.bindingLayout, 'declares the frame-history texture binding').toEqual([
    {name: 'persistenceTexture', group: 0}
  ]);
  void 0;
});

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
      const output = renderer.renderToTexture({sourceTexture, resetHistory});
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
