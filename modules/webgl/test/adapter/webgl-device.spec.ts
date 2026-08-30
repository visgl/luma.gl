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

it('WebGLDevice#destroy marks the device lost', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});

  expect(device.isLost, 'device starts active').toBe(false);
  device.destroy();
  expect(device.isLost, 'destroy synchronously marks the device lost').toBe(true);
});
