import {WebGLRenderingContext} from '../../src/webgl/webgl-types';
import {createGLContext} from '../../src/webgl';

import headlessGL from 'gl';
import test from 'tape-catch';

test('WebGL#headless context creation', t => {
  const gl = createGLContext({headlessGL});
  t.ok(gl instanceof WebGLRenderingContext, 'Context creation ok');
  t.end();
});
