// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {webgl2Adapter} from '@luma.gl/webgl';

// TODO - duplicates core spec?
test('WebGLDevice#lost (Promise)', async t => {
  const device = await webgl2Adapter.create({createCanvasContext: true});

  // Wrap in a promise to make sure tape waits for us
  await new Promise<void>(async resolve => {
    setTimeout(async () => {
      const cause = await device.lost;
      t.equal(cause.reason, 'destroyed', `Context lost: ${cause.message}`);
      t.end();
      resolve();
    }, 0);
    device.loseDevice();
  });

  device.destroy();
});
