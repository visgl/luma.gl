// luma.gl, MIT license

import test from 'tape-promise/tape';
import {CanvasContext, Framebuffer} from '@luma.gl/api';
import {isBrowser} from '@probe.gl/env';

class TestCanvasContext extends CanvasContext {
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
