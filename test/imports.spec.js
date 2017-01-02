import {createGLContext, Program, loadFiles, loadTextures} from '../index';
import test from 'tape-catch';

test('LumaGL#imports are defined', t => {
  t.ok(typeof Program === 'function', 'Program is defined');
  t.ok(typeof createGLContext === 'function', 'createGLContext is defined');
  t.end();
});

test('LumaGL#io imports (basic functions) are defined', t => {
  t.ok(typeof loadFiles === 'function', 'loadFiles is defined');
  t.ok(typeof loadTextures === 'function', 'loadTextures is defined');
  t.end();
});
