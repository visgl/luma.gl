// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgl2Adapter} from '@luma.gl/core/webgl';
import {expect, it} from 'vitest';

// TODO - duplicates core spec?
it('WebGLDevice#lost (Promise)', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});

  // Wrap in a promise to make sure tape waits for us
  await new Promise<void>(resolve => {
    setTimeout(() => {
      void device.lost.then(cause => {
        expect(cause.reason, `Context lost: ${cause.message}`).toBe('destroyed');
        resolve();
      });
    }, 0);
    device.loseDevice();
  });

  device.destroy();
});

it('WebGLDevice#lost classifies external context loss as unknown', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});

  device.canvasContext.canvas.dispatchEvent(new Event('webglcontextlost'));

  await expect(device.lost).resolves.toMatchObject({reason: 'unknown'});
  device.destroy();
});

it('WebGLDevice#destroy marks the device lost', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});

  expect(device.isLost, 'device starts active').toBe(false);
  device.destroy();
  expect(device.isLost, 'destroy synchronously marks the device lost').toBe(true);
});

it('WebGLDevice rejects resource creation while its context is lost', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});
  const resourceCounts = device.statsManager.getStats('Resource Counts');
  const resourcesBeforeLoss = resourceCounts.get('Resources Active').count;

  try {
    const extension = device.gl.getExtension('WEBGL_lose_context');
    expect(extension).not.toBeNull();
    extension!.loseContext();
    await device.lost;

    const createResources = [
      () => device.createBuffer({byteLength: 16}),
      () => device.createTexture({width: 1, height: 1}),
      () => device.createSampler({}),
      () =>
        device.createShader({
          stage: 'vertex',
          source: 'void main() { gl_Position = vec4(0.0); }'
        })
    ];

    for (const createResource of createResources) {
      expect(createResource).toThrowError('WebGL context is lost');
      expect(resourceCounts.get('Resources Active').count).toBe(resourcesBeforeLoss);
    }
  } finally {
    device.destroy();
  }
});
