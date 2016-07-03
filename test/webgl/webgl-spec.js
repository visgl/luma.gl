import {isWebGLRenderingContext} from '../../src/webgl/webgl-checks';
import {createGLContext} from '../../src/webgl';

import headlessGL from 'gl';
import test from 'tape-catch';

test('WebGL#headless context creation', t => {
  const gl = createGLContext({headlessGL});
  t.ok(isWebGLRenderingContext(gl), 'Context creation ok');
  t.end();
});
