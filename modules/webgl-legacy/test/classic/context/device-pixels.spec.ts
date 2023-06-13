import test from 'tape-promise/tape';
import {
  cssToDevicePixels,
  cssToDeviceRatio,
  getDevicePixelRatio,
  setDevicePixelRatio
} from '@luma.gl/webgl-legacy';

// Let's not repeat the tedious CanvasContext mocking tests. Just check that these are actually exported
test('webgl-legacy#exports', (t) => {
  t.ok(cssToDevicePixels);
  t.ok(cssToDeviceRatio);
  t.ok(getDevicePixelRatio);
  t.ok(setDevicePixelRatio);
  t.end();
});
