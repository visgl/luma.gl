// NOTE: `headless.js` must **NOT** be included in this file
import {createGLContext, Program, isBrowser} from '@luma.gl/webgl';

import test from 'tape-catch';

test('LumaGL#imports are defined', t => {
  t.ok(typeof Program === 'function', 'Program is defined');
  t.ok(typeof createGLContext === 'function', 'createGLContext is defined');
  t.end();
});

test('LumaGL#createGLContext throws without headless', t => {
  if (!isBrowser) {
    t.throws(
      () => createGLContext({createNodeContext: null, throwOnError: true}),
      // /WebGL API is missing/,
      'createGLContext throws when headless is not included'
    );
  }
  t.end();
});
