// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {SphericalTrails} from '../../examples/experimental/vector-observatory/spherical-trails';

for (const crossing of ['pole', 'seam'] as const) {
  it(`renders continuous ${crossing} arcs after ring wrap and reprojects paused history`, async context => {
    const device = await getTestDevice('webgpu');
    if (!device) return context.skip();
    const source = device.createBuffer({byteLength: 16, usage: Buffer.COPY_SRC | Buffer.COPY_DST});
    const trails = new SphericalTrails(device, 1);
    const texture = device.createTexture({
      width: 64,
      height: 64,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({colorAttachments: [texture]});
    const layout = texture.computeMemoryLayout({width: 64, height: 64});
    const readback = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    /** Render the same retained samples with a different camera; no integration occurs. */
    async function render(longitude: number, latitude: number): Promise<Uint8Array> {
      const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
      trails.draw(pass, {
        width: 64,
        height: 64,
        longitude,
        latitude,
        time: 29,
        duration: 2,
        widthPixels: 4,
        exposure: 1
      });
      pass.end();
      device.submit();
      texture.readBuffer({width: 64, height: 64}, readback);
      const bytes = await readback.readAsync();
      return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }
    try {
      // More than capacity captures exercise physical ring offsets and chronological pairing.
      for (let frame = 0; frame < 30; frame++) {
        const angle = frame % 2 === 0 ? -0.2 : 0.2;
        source.write(
          new Float32Array(
            crossing === 'pole'
              ? [Math.sin(angle), 0, Math.cos(angle), frame]
              : [-Math.cos(angle), Math.sin(angle), 0, frame]
          )
        );
        trails.capture(source, frame, 2);
      }
      const pixels = await render(
        crossing === 'seam' ? Math.PI : 0,
        crossing === 'pole' ? Math.PI / 2 : 0
      );
      // The arc must cover the center on both sides of the pole/meridian, not vanish or jump.
      for (const offset of [-2, 0, 2]) {
        const column = 32 + (crossing === 'seam' ? offset : 0);
        const row = 32 + (crossing === 'pole' ? offset : 0);
        expect(pixels[row * layout.bytesPerRow + column * 4 + 2]).toBeGreaterThan(0);
      }
      const hidden = await render(0, crossing === 'pole' ? -Math.PI / 2 : 0);
      expect(hidden.some(value => value !== 0)).toBe(false);
    } finally {
      readback.destroy();
      framebuffer.destroy();
      texture.destroy();
      trails.destroy();
      source.destroy();
    }
  });
}
