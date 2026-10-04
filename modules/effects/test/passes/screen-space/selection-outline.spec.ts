// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Buffer, Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {selectionOutline, type SelectionOutlineProps} from '@luma.gl/effects';
import {getTestDevice} from '@luma.gl/test-utils';
import {expect, test} from 'vitest';

for (const backend of ['webgl', 'webgpu'] as const) {
  test(`${backend}: selection outlines preserve interiors and composite premultiplied alpha`, async context => {
    const device = await getTestDevice(backend);
    if (!device) {
      context.skip(`${backend} is unavailable`);
      return;
    }
    const sourcePixels = new Uint8Array(64 * 64 * 4);
    const maskPixels = new Uint8Array(64 * 64);
    for (let vertical = 0; vertical < 64; vertical++) {
      for (let horizontal = 0; horizontal < 64; horizontal++) {
        const index = vertical * 64 + horizontal;
        sourcePixels.set([32, 16, 8, 128], index * 4);
        if (horizontal >= 24 && horizontal < 40 && vertical >= 24 && vertical < 40)
          maskPixels[index] = 255;
      }
    }
    const sourceTexture = device.createTexture({
      width: 64,
      height: 64,
      format: 'rgba8unorm',
      data: sourcePixels
    });
    const maskTexture = device.createTexture({
      width: 64,
      height: 64,
      format: 'r8unorm',
      data: maskPixels,
      sampler: {
        minFilter: 'nearest',
        magFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge'
      }
    });
    const renderer = new ShaderPassRenderer(device, {
      shaderPasses: [selectionOutline],
      colorFormat: 'rgba8unorm'
    });
    renderer.resize([64, 64]);
    const readback = device.createBuffer({
      byteLength: 64 * 64 * 4,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    async function renderOutline(props: SelectionOutlineProps) {
      const texture = renderer.renderToTexture({
        sourceTexture,
        bindings: {selectionTexture: maskTexture},
        uniforms: {selectionOutline: props}
      });
      expect(texture).toBeInstanceOf(Texture);
      device.submit();
      texture!.readBuffer({width: 64, height: 64}, readback);
      const bytes = await readback.readAsync();
      return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }
    const pixel = (values: Uint8Array, horizontal: number, vertical: number) =>
      Array.from(
        values.slice((vertical * 64 + horizontal) * 4, (vertical * 64 + horizontal + 1) * 4)
      );
    try {
      const outlined = await renderOutline({color: [0, 1, 0, 0.5], thickness: 2});
      expect(pixel(outlined, 32, 32)).toEqual([32, 16, 8, 128]);
      expect(pixel(outlined, 10, 32)).toEqual([32, 16, 8, 128]);
      const edge = pixel(outlined, 23, 32);
      expect(edge[0]).toBeCloseTo(16, 0);
      expect(edge[1]).toBeGreaterThanOrEqual(135);
      expect(edge[1]).toBeLessThanOrEqual(136);
      expect(edge[3]).toBeGreaterThanOrEqual(191);
      expect(edge[3]).toBeLessThanOrEqual(192);
      expect(await renderOutline({thickness: 0})).toEqual(sourcePixels);
      expect(await renderOutline({thickness: 2, color: [0, 1, 0, 0]})).toEqual(sourcePixels);
    } finally {
      renderer.destroy();
      sourceTexture.destroy();
      maskTexture.destroy();
      readback.destroy();
    }
  });
}
