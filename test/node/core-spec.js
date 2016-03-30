import {createGLContext, hasWebGL, hasExtension, Program}
  from '../../src/webgl';
import test from 'tape-catch';

test('LumaGL#imports are defined', t => {
  t.ok(typeof Program === 'function', 'Program is defined');
  t.ok(typeof createGLContext === 'function', 'createGLContext is defined');
  t.ok(typeof hasWebGL === 'function', 'hasWebGL is defined');
  t.ok(typeof hasExtension === 'function', 'hasExtension is defined');
  t.end();
});
