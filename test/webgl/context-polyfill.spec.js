import {polyfillWebGLContext} from '../../src/webgl/context-polyfill';
// import {polyfillWebGLContext, TEST_EXPORTS} from '../../src/webgl///';
import test from 'tape-catch';

import {fixture} from '../setup';

test('WebGL#polyfillWebGLContext', t => {
  const {gl, gl2} = fixture;

  t.ok(typeof polyfillWebGLContext === 'function', 'polyfillWebGLContext defined');

  const extensions = polyfillWebGLContext(gl);
  t.ok(extensions, 'extensions were returned');

  if (gl2) {
    const extensions2 = polyfillWebGLContext(gl2);
    t.ok(extensions2, 'extensions were returned');
  }

  t.end();
});
