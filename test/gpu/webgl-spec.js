/* global document */
import {WebGLRenderingContext} from '../../src/webgl/webgl-types';

import {createGLContext, hasWebGL, hasExtension}
  from '../../src/webgl';
import test from 'tape-catch';

test('WebGL#headless', t => {
  const canvas = document.createElement('canvas');
  const gl = createGLContext(canvas);
  t.ok(gl instanceof WebGLRenderingContext);
  t.ok(hasWebGL(), 'hasWebGL() is true');
  t.notOk(hasExtension('noextension'), 'hasExtension(noextension) is false');
  t.end();
});
