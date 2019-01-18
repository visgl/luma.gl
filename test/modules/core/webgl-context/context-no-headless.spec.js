// NOTE: `headless.js` must **NOT** be included in this file
import {createGLContext, Program, webGLTypesAvailable} from 'luma.gl';

import test from 'tape-catch';

test('LumaGL#imports are defined', t => {
  t.ok(typeof Program === 'function', 'Program is defined');
  t.ok(typeof createGLContext === 'function', 'createGLContext is defined');
  t.end();
});

if (!webGLTypesAvailable) {
  test('LumaGL#createGLContext throws without headless', t => {
    t.throws(
      () => createGLContext(),
      /WebGL API is missing/,
      'createGLContext throws when headless is not included'
    );
    t.end();
  });
}
