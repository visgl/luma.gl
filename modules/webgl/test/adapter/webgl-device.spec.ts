// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {webgl2Adapter} from '@luma.gl/webgl';

// TODO - duplicates core spec?
test('WebGLDevice#lost (Promise)', async t => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});

  if (
    device.info.gpu === 'software' ||
    device.info.gpuType === 'cpu' ||
    Boolean(device.info.fallback)
  ) {
    t.comment('Skipping explicit WebGL context loss on a software-backed adapter');
    device.destroy();
    device.canvasContext.destroy();
    device.canvasContext.htmlCanvas?.remove();
    t.end();
    return;
  }

  // Wrap in a promise to make sure tape waits for us
  await new Promise<void>(resolve => {
    setTimeout(() => {
      void device.lost.then(cause => {
        t.equal(cause.reason, 'destroyed', `Context lost: ${cause.message}`);
        t.end();
        resolve();
      });
    }, 0);
    device.loseDevice();
  });

  device.destroy();
});
