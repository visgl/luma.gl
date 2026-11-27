// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {expect, test, vi} from 'vitest';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {CORTAOPass} from '@luma.gl/engine/lighting';
import {createOcclusionFixture} from './ambient-occlusion-fixture';

for (const [backend, depthFormat, resolutionScale] of [
  ['webgl', 'depth32float', 1],
  ['webgl', 'depth32float', 0.5],
  ['webgpu', 'depth32float', 1],
  ['webgpu', 'depth24plus-stencil8', 1],
  ['webgpu', 'depth24plus-stencil8', 0.5],
  ['webgpu', 'depth32float', 0.25]
] as const) {
  test(`CORTAO generates full-resolution visibility and resizes on ${backend} with ${depthFormat} at scale ${resolutionScale}`, async context => {
    const device = backend === 'webgpu' ? await getWebGPUTestDevice() : await getWebGLTestDevice();
    if (!device) return context.skip(`No ${backend}`);
    const fixture = createOcclusionFixture(device, 97, 65, depthFormat);
    const resized = createOcclusionFixture(device, 47, 31, depthFormat);
    const pass = new CORTAOPass(device, {resolutionScale});
    try {
      const submit = vi.spyOn(device, 'submit');
      const visibility = pass.render({...fixture, radius: 2});
      expect(submit).not.toHaveBeenCalled();
      submit.mockRestore();
      expect([visibility.width, visibility.height]).toEqual([97, 65]);
      const layout = visibility.computeMemoryLayout();
      const readback = device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      device.submit();
      visibility.readBuffer({}, readback);
      try {
        const bytes = new Uint8Array(await readback.readAsync());

        expect(bytes[0], 'an open corner remains unoccluded').toBeGreaterThan(250);
        expect(
          bytes.some((value, index) => index % 4 === 0 && value > 0 && value < 240),
          'foreground casts occlusion'
        ).toBe(true);
      } finally {
        readback.destroy();
      }
      const next = pass.render({...resized, filter: false});
      device.submit();
      expect([next.width, next.height]).toEqual([47, 31]);
      expect(visibility.destroyed).toBe(true);
      pass.destroy();
      expect(next.destroyed).toBe(true);
      expect(resized.depthTexture.destroyed).toBe(false);
      expect(() => pass.render(resized)).toThrow();
    } finally {
      pass.destroy();
      fixture.destroy();
      resized.destroy();
    }
  });
}
