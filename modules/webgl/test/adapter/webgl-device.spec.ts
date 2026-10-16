// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgl2Adapter} from '@luma.gl/webgl';
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

it('WebGLDevice#loseDevice marks the wrapper lost without WEBGL_lose_context', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});
  device.extensions.WEBGL_lose_context = null;

  expect(device.isLost, 'device starts active').toBe(false);
  expect(device.loseDevice(), 'native context loss was unavailable').toBe(false);
  expect(device.isLost, 'loseDevice synchronously marks the wrapper lost').toBe(true);
  await expect(device.lost).resolves.toMatchObject({reason: 'destroyed'});

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
