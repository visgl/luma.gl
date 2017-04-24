import {
  createGLContext, Program,
  loadFiles, loadTextures
} from '..//without-io';
import test from 'tape-catch';

test('LumaGL#imports are defined', t => {
  t.ok(typeof Program === 'function', 'Program is defined');
  t.ok(typeof createGLContext === 'function', 'createGLContext is defined');
  t.end();
});

test('LumaGL#io imports are not defined', t => {
  t.notOk(typeof loadFiles === 'function', 'loadFiles is defined');
  t.notOk(typeof loadTextures === 'function', 'loadTextures is defined');
  t.end();
});
