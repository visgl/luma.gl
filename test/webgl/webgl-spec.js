import {createGLContext} from '../../src/headless';
import {isWebGLRenderingContext} from '../../src/webgl/webgl-checks';

import test from 'tape-catch';

test('WebGL#headless context creation', t => {
  const gl = createGLContext();
  t.ok(isWebGLRenderingContext(gl), 'Context creation ok');
  t.end();
});
