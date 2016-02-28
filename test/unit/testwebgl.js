import {createGLContext, hasWebGL, hasExtension, Program}
  from '../../src/webgl';
import test from 'tape';

test('WebGL#types', t => {
  t.ok(typeof Program === 'function', 'Program is defined');
  t.ok(typeof createGLContext === 'function', 'createGLContext is defined');
  t.ok(typeof hasWebGL === 'function', 'hasWebGL is defined');
  t.ok(typeof hasExtension === 'function', 'hasExtension is defined');
  t.end();
});

test('WebGL#headless', t => {
  // t.throws(createGLContext);
  // t.notOk(hasWebGL(), 'hasWebGL() is false');
  t.notOk(hasExtension('noextension'), 'hasExtension(noextension) is false');
  t.end();
});
