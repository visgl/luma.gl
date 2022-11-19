// luma.gl, MIT license
import test from 'tape-promise/tape';
import {WebGLCanvasContext} from '@luma.gl/webgl';

test('WebGLDevice#headless context creation', (t) => {
  t.ok(WebGLCanvasContext, 'WebGLCanvasContext defined');
  // t.ok(new WEBGLCanvasContext()), 'Context creation ok');
  t.end();
});
