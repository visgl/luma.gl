// /* global document */
// import {WebGLRenderingContext} from '../../src/webgl';

import {createGLContext, hasWebGL, hasExtension, Program}
  from '../../src/webgl';
import test from 'tape-catch';

test('WebGL#types', t => {
  t.ok(typeof Program === 'function', 'Program is defined');
  t.ok(typeof createGLContext === 'function', 'createGLContext is defined');
  t.ok(typeof hasWebGL === 'function', 'hasWebGL is defined');
  t.ok(typeof hasExtension === 'function', 'hasExtension is defined');
  t.end();
});

// test('WebGL#headless', t => {
//   const canvas = document.createElement('canvas');
//   const gl = createGLContext(canvas);
//   t.ok(gl instanceof WebGLRenderingContext);
//   t.ok(hasWebGL(), 'hasWebGL() is true');
//   t.notOk(hasExtension('noextension'), 'hasExtension(noextension) is false');
//   t.end();
// });
