// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {CanvasContext, Framebuffer} from '@luma.gl/core';
import {isBrowser} from '@probe.gl/env';

// @ts-expect-error
class TestCanvasContext extends CanvasContext {
  // @ts-expect-error
  readonly device = {};
  getCurrentFramebuffer(): Framebuffer { throw new Error('test'); }
  update() {}
}

test('CanvasContext', (t) => {
  if (isBrowser()) {
    let canvasContext = new TestCanvasContext();
    t.ok(canvasContext);

    canvasContext = new TestCanvasContext({useDevicePixels: false});
    t.ok(canvasContext);
    t.deepEqual(canvasContext.getPixelSize(), [800, 600]);
  }
  t.end();
});
