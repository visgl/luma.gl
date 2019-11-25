// NOTE: `headless.js` must **NOT** be included in this file
import {createGLContext, Program} from '@luma.gl/webgl';

import test from 'tape-catch';

test('LumaGL#imports are defined', t => {
  t.ok(typeof Program === 'function', 'Program is defined');
  t.ok(typeof createGLContext === 'function', 'createGLContext is defined');
  t.end();
});
